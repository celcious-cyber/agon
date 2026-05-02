import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'
import { generateBracket, getNextRoundSlot } from '@/utils/bracket.js'

export const useJudgingStore = defineStore('judging', () => {
  const brackets = ref([])
  const scores = ref([])
  const scoreDetails = ref([])
  const loading = ref(false)
  const auth = useAuthStore()

  async function fetchBrackets(competitionId) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('brackets')
        .select('*')
        .eq('competition_id', competitionId)
        .order('round', { ascending: true })
        .order('match_number', { ascending: true })
      if (error) throw error
      brackets.value = data
    } catch (e) {
      console.error('Error fetching brackets:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function generateBrackets(competitionId, participants) {
    loading.value = true
    try {
      await supabase.from('brackets').delete().eq('competition_id', competitionId)
      const newBrackets = generateBracket(participants).map(b => ({
        ...b,
        competition_id: competitionId
      }))
      const { error } = await supabase.from('brackets').insert(newBrackets)
      if (error) throw error
      await fetchBrackets(competitionId)
    } catch (e) {
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setWinner(bracket, winnerId) {
    try {
      const { error: currErr } = await supabase
        .from('brackets')
        .update({ winner_id: winnerId, status: 'done' })
        .eq('id', bracket.id)
      if (currErr) throw currErr

      const nextSlot = getNextRoundSlot(bracket)
      const { data: nextBracket } = await supabase
        .from('brackets')
        .select('id')
        .match({ 
          competition_id: bracket.competition_id, 
          round: nextSlot.round, 
          match_number: nextSlot.match_number 
        })
        .single()

      if (nextBracket) {
        const updateData = {}
        updateData[nextSlot.slot] = winnerId
        await supabase
          .from('brackets')
          .update(updateData)
          .eq('id', nextBracket.id)
      }
      
      await fetchBrackets(bracket.competition_id)
    } catch (e) {
      throw e
    }
  }

  async function fetchScores(competitionId) {
    loading.value = true
    try {
      // 1. Ambil semua pendaftar (registrations) di lomba ini
      const { data: regData, error: regErr } = await supabase
        .from('registrations')
        .select(`
          participant_id,
          participants(
            name,
            institutions(name)
          )
        `)
        .eq('competition_id', competitionId)
      
      if (regErr) throw regErr

      // 2. Ambil rekap skor dari tabel scores
      const { data: scoreData } = await supabase
        .from('scores')
        .select('*')
        .eq('competition_id', competitionId)
      
      // 3. Ambil detail skor per juri
      const { data: detailData } = await supabase
        .from('score_details')
        .select('*')
        .eq('competition_id', competitionId)

      // Gabungkan pendaftar dengan skor mereka
      scores.value = regData.map(reg => {
        const s = scoreData?.find(sd => sd.participant_id === reg.participant_id)
        return {
          participant_id: reg.participant_id,
          participants: reg.participants,
          total_score: s?.total_score || 0
        }
      }).sort((a, b) => b.total_score - a.total_score)

      scoreDetails.value = detailData || []
    } catch (e) {
      console.error('Error fetching scores:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function upsertScore(competitionId, participantId, criteriaId, score) {
    try {
      const { error } = await supabase
        .from('score_details')
        .upsert({
          competition_id: competitionId,
          participant_id: participantId,
          criteria_id: criteriaId,
          judge_id: auth.user.id,
          score: score,
          updated_at: new Date().toISOString()
        }, { onConflict: 'participant_id,criteria_id,judge_id' })
      
      if (error) throw error
    } catch (e) {
      throw e
    }
  }

  return { 
    brackets, scores, scoreDetails, loading,
    fetchBrackets, generateBrackets, setWinner,
    fetchScores, upsertScore 
  }
})

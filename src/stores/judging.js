import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'
import { generateBracket as generateBracketUtil, getNextRoundSlot } from '@/utils/bracket.js'

export const useJudgingStore = defineStore('judging', () => {
  const brackets = ref([])
  const scores = ref([])
  const scoreDetails = ref([])
  const loading = ref(false)
  const auth = useAuthStore()

  async function fetchScores(competitionId) {
    loading.value = true
    try {
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

      const { data: scoreData } = await supabase
        .from('scores')
        .select('*')
        .eq('competition_id', competitionId)
      
      const { data: detailData } = await supabase
        .from('score_details')
        .select('*')
        .eq('competition_id', competitionId)

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

  // --- BRACKET LOGIC ---

  async function fetchBrackets(competitionId) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('competition_id', competitionId)
        .order('round', { ascending: true })
        .order('match_number', { ascending: true })
      
      if (error) throw error
      
      console.log('Data dari DB:', data)

      // Menggunakan kolom participant_ids (Array)
      brackets.value = data.map(m => {
        console.log(`Match ${m.match_number}:`, m.participant_ids)
        return {
          ...m,
          participants: m.participant_ids || []
        }
      })
    } catch (e) {
      console.error('Error fetching brackets:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function generateBrackets(competitionId, providedParticipants = null, sizePerMatch = 2) {
    loading.value = true
    try {
      let participantsData = providedParticipants
      
      if (!participantsData) {
        const { data, error: pErr } = await supabase
          .from('registrations')
          .select('participants(id, name)')
          .eq('competition_id', competitionId)
        
        if (pErr) throw pErr
        participantsData = data.map(p => p.participants)
      }

      if (!participantsData || participantsData.length < 2) {
        throw new Error('Minimal butuh 2 peserta untuk membuat bracket')
      }

      const bracketData = generateBracketUtil(participantsData, sizePerMatch)

      // Propagasi BYE
      for (const match of bracketData) {
        if (match.winner_id && match.status === 'done') {
          const nextSlot = getNextRoundSlot(match, sizePerMatch)
          const targetMatch = bracketData.find(b => b.round === nextSlot.round && b.match_number === nextSlot.match_number)
          if (targetMatch) {
            targetMatch.participants[nextSlot.slotIndex] = match.winner_id
          }
        }
      }

      const payload = bracketData.map(b => ({
        competition_id: competitionId,
        round: b.round,
        match_number: b.match_number,
        participant_ids: b.participants,
        winner_id: b.winner_id,
        status: b.status
      }))

      await supabase.from('matches').delete().eq('competition_id', competitionId)

      const { error: insErr } = await supabase
        .from('matches')
        .insert(payload)
      
      if (insErr) throw insErr

      await fetchBrackets(competitionId)
    } catch (e) {
      console.error('Error generating brackets:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setWinner(match, winnerId, sizePerMatch = 2) {
    try {
      const { error: updErr } = await supabase
        .from('matches')
        .update({ winner_id: winnerId, status: 'done' })
        .eq('id', match.id)
      
      if (updErr) throw updErr

      const nextSlot = getNextRoundSlot({
        round: match.round,
        match_number: match.match_number
      }, sizePerMatch)

      const { data: nextMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('competition_id', match.competition_id)
        .eq('round', nextSlot.round)
        .eq('match_number', nextSlot.match_number)
        .single()
      
      if (nextMatch) {
        const newParticipants = [...(nextMatch.participant_ids || [])]
        newParticipants[nextSlot.slotIndex] = winnerId
        
        await supabase
          .from('matches')
          .update({ participant_ids: newParticipants })
          .eq('id', nextMatch.id)
      }

      await fetchBrackets(match.competition_id)
    } catch (e) {
      console.error('Error setting winner:', e.message)
      throw e
    }
  }

  async function resetWinner(matchId, sizePerMatch = 2) {
    loading.value = true
    try {
      const { data: match, error: getErr } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
      
      if (getErr) throw getErr

      await supabase.from('matches').update({ winner_id: null, status: 'pending' }).eq('id', matchId)

      const nextSlot = getNextRoundSlot(match, sizePerMatch)
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('competition_id', match.competition_id)
        .eq('round', nextSlot.round)
        .eq('match_number', nextSlot.match_number)
        .single()
      
      if (nextMatch) {
        const newParticipants = [...(nextMatch.participant_ids || [])]
        newParticipants[nextSlot.slotIndex] = null
        
        await supabase
          .from('matches')
          .update({ participant_ids: newParticipants })
          .eq('id', nextMatch.id)
      }

      await fetchBrackets(match.competition_id)
    } catch (e) {
      console.error('Error resetting winner:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function upsertScore(competitionId, participantId, criteriaId, judgeId, score) {
    try {
      const { error } = await supabase
        .from('score_details')
        .upsert({
          competition_id: competitionId,
          participant_id: participantId,
          criteria_id: criteriaId,
          judge_id: judgeId,
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
    fetchScores, upsertScore, fetchBrackets, generateBrackets, setWinner, resetWinner
  }
})

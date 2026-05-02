import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useLiveStore = defineStore('live', () => {
  const scores = ref([])
  const judgingStatus = ref({}) // Format: { participantId: { 1: bool, 2: bool, 3: bool } }
  const competitionJudges = ref([])
  const selectedCompetitionId = ref(null)
  let channel = null

  async function fetchLeaderboard(competitionId) {
    // 1. Ambil Skor Rekap
    const { data: scoreData } = await supabase
      .from('scores')
      .select('*, participants(name, institutions(name))')
      .eq('competition_id', competitionId)
      .order('total_score', { ascending: false })
    
    scores.value = scoreData || []

    // 2. Ambil Mapping Juri (J1, J2, J3)
    const { data: judgeData } = await supabase
      .from('competition_judges')
      .select('judge_id, position')
      .eq('competition_id', competitionId)
    
    competitionJudges.value = judgeData || []

    // 3. Ambil Detail Input Juri untuk Monitoring
    const { data: detailData } = await supabase
      .from('score_details')
      .select('participant_id, judge_id')
      .eq('competition_id', competitionId)

    const status = {}
    detailData?.forEach(d => {
      if (!status[d.participant_id]) status[d.participant_id] = { 1: false, 2: false, 3: false }
      // Cari posisi juri ini
      const plot = competitionJudges.value.find(p => p.judge_id === d.judge_id)
      if (plot) status[d.participant_id][plot.position] = true
    })
    judgingStatus.value = status
  }

  async function subscribe(competitionId) {
    selectedCompetitionId.value = competitionId
    await fetchLeaderboard(competitionId)

    if (channel) supabase.removeChannel(channel)

    channel = supabase.channel(`live-${competitionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'score_details', filter: `competition_id=eq.${competitionId}` }, () => {
        fetchLeaderboard(competitionId)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `competition_id=eq.${competitionId}` }, () => {
        fetchLeaderboard(competitionId)
      })
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    selectedCompetitionId.value = null
    scores.value = []
    judgingStatus.value = {}
  }

  return { 
    scores, judgingStatus, competitionJudges, selectedCompetitionId, 
    subscribe, unsubscribe, fetchLeaderboard
  }
})

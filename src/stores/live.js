import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useLiveStore = defineStore('live', () => {
  const scores = ref([])
  const brackets = ref([])
  const selectedCompetitionId = ref(null)
  let channel = null

  async function fetchLeaderboard(competitionId) {
    const { data, error } = await supabase
      .from('scores')
      .select('*, participants(name, institutions(name))')
      .eq('competition_id', competitionId)
      .order('total_score', { ascending: false })
    if (!error) scores.value = data
  }

  async function fetchBrackets(competitionId) {
    const { data, error } = await supabase
      .from('brackets')
      .select(`
        *,
        participant_a_data:participants!participant_a(name),
        participant_b_data:participants!participant_b(name)
      `)
      .eq('competition_id', competitionId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true })
    if (!error) brackets.value = data
  }

  async function subscribe(competitionId) {
    selectedCompetitionId.value = competitionId
    await fetchLeaderboard(competitionId)
    await fetchBrackets(competitionId)

    if (channel) supabase.removeChannel(channel)

    channel = supabase.channel(`live-${competitionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'scores', 
        filter: `competition_id=eq.${competitionId}` 
      }, () => {
        fetchLeaderboard(competitionId)
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'brackets', 
        filter: `competition_id=eq.${competitionId}` 
      }, () => {
        fetchBrackets(competitionId)
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
    brackets.value = []
  }

  return { 
    scores, brackets, selectedCompetitionId, 
    subscribe, unsubscribe, fetchLeaderboard, fetchBrackets 
  }
})

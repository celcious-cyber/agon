import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useParticipantsStore = defineStore('participants', () => {
  const items = ref([])
  const loading = ref(false)

  async function fetch(filters = {}) {
    loading.value = true
    try {
      let query = supabase
        .from('participants')
        .select(`
          *,
          institutions(name),
          registrations(
            competition_id,
            competitions(name, gender, quota)
          )
        `)
        .order('created_at', { ascending: false })

      if (filters.institution_id) query = query.eq('institution_id', filters.institution_id)
      if (filters.gender) query = query.eq('gender', filters.gender)

      const { data, error } = await query
      if (error) throw error

      if (filters.competition_id) {
        items.value = data.filter(p => 
          p.registrations.some(r => r.competition_id === filters.competition_id)
        )
      } else {
        items.value = data
      }
    } catch (e) {
      console.error('Error fetching participants:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function create(participantData, competitionIds = []) {
    const { data: part, error: partErr } = await supabase
      .from('participants')
      .insert(participantData)
      .select()
      .single()
    if (partErr) throw partErr

    if (competitionIds.length > 0) {
      const regPayload = competitionIds.map(compId => ({
        participant_id: part.id,
        competition_id: compId
      }))
      const { error: regErr } = await supabase
        .from('registrations')
        .insert(regPayload)
      if (regErr) throw regErr
    }

    await fetch()
    return part
  }

  async function remove(id) {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id)
    if (error) throw error
    items.value = items.value.filter(i => i.id !== id)
  }

  return { items, loading, fetch, create, remove }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useInstitutionsStore = defineStore('institutions', () => {
  const items = ref([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name')
      if (error) throw error
      items.value = data
    } catch (e) {
      console.error('Error fetching institutions:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data, error } = await supabase
      .from('institutions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    items.value.push(data)
    return data
  }

  async function update(id, payload) {
    const { error } = await supabase
      .from('institutions')
      .update(payload)
      .eq('id', id)
    if (error) throw error
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) Object.assign(items.value[idx], payload)
  }

  async function remove(id) {
    const { error } = await supabase
      .from('institutions')
      .delete()
      .eq('id', id)
    if (error) throw error
    items.value = items.value.filter(i => i.id !== id)
  }

  return { items, loading, fetch, create, update, remove }
})

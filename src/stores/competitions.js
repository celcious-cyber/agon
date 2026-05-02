import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useCompetitionsStore = defineStore('competitions', () => {
  const items = ref([])
  const loading = ref(false)
  const categoryParams = ref([])
  const masterCriteria = ref([])

  async function fetch() {
    loading.value = true
    try {
      // Mengambil lomba beserta jumlah pendaftar DAN kriteria penilaiannya
      const { data, error } = await supabase
        .from('competitions')
        .select(`
          *,
          registrations(count),
          competition_criteria(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Map data agar kriteria bisa diakses dengan nama .criteria (sesuai ekspektasi UI)
      items.value = data.map(item => ({
        ...item,
        criteria: item.competition_criteria || []
      }))
    } catch (e) {
      console.error('Error fetching competitions:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchParams() {
    const { data } = await supabase.from('category_params').select('*')
    categoryParams.value = data || []
  }

  async function fetchMasterCriteria() {
    const { data } = await supabase.from('master_criteria').select('*').order('name')
    masterCriteria.value = data || []
  }

  async function create(competitionData, criteriaItems = []) {
    const { data: comp, error: compErr } = await supabase
      .from('competitions')
      .insert(competitionData)
      .select()
      .single()
    
    if (compErr) throw compErr

    if (criteriaItems.length > 0) {
      const payload = criteriaItems.map((item, index) => ({
        competition_id: comp.id,
        name: item.name,
        min_score: item.min_score || 0,
        max_score: item.max_score || 100,
        weight: item.weight || 0,
        order_num: index
      }))
      await supabase.from('competition_criteria').insert(payload)
    }

    await fetch()
    return comp
  }

  async function update(id, competitionData, criteriaItems = []) {
    // 1. Update data dasar lomba
    const { error: compErr } = await supabase
      .from('competitions')
      .update(competitionData)
      .eq('id', id)
    
    if (compErr) throw compErr

    // 2. Update kriteria: Hapus yang lama, masukkan yang baru (Sync)
    const { error: delErr } = await supabase
      .from('competition_criteria')
      .delete()
      .eq('competition_id', id)
    
    if (delErr) throw delErr

    if (criteriaItems && criteriaItems.length > 0) {
      const payload = criteriaItems.map((item, index) => ({
        competition_id: id,
        name: item.name,
        min_score: item.min_score || 0,
        max_score: item.max_score || 100,
        weight: item.weight || 0,
        order_num: index
      }))
      const { error: insErr } = await supabase.from('competition_criteria').insert(payload)
      if (insErr) throw insErr
    }

    await fetch()
  }

  async function updateStatus(id, status) {
    await supabase.from('competitions').update({ status }).eq('id', id)
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) items.value[idx].status = status
  }

  async function remove(id) {
    await supabase.from('competitions').delete().eq('id', id)
    items.value = items.value.filter(i => i.id !== id)
  }

  return { 
    items, loading, categoryParams, masterCriteria,
    fetch, fetchParams, fetchMasterCriteria, create, update, updateStatus, remove 
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useCriteriaStore = defineStore('criteria', () => {
  const templates = ref([])
  const loading = ref(false)

  async function fetchTemplates() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('criteria_templates')
        .select('*, criteria_template_items(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      
      templates.value = data.map(t => ({
        ...t,
        criteria_template_items: t.criteria_template_items.sort((a, b) => a.order_num - b.order_num)
      }))
    } catch (e) {
      console.error('Error fetching templates:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(payload) {
    const { data, error } = await supabase
      .from('criteria_templates')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    templates.value.unshift({ ...data, criteria_template_items: [] })
    return data
  }

  async function updateTemplate(id, payload) {
    const { error } = await supabase
      .from('criteria_templates')
      .update(payload)
      .eq('id', id)
    if (error) throw error
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx !== -1) Object.assign(templates.value[idx], payload)
  }

  async function removeTemplate(id) {
    const { error } = await supabase
      .from('criteria_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
    templates.value = templates.value.filter(t => t.id !== id)
  }

  async function addItem(templateId, payload) {
    const { data, error } = await supabase
      .from('criteria_template_items')
      .insert({ ...payload, template_id: templateId })
      .select()
      .single()
    if (error) throw error
    
    const template = templates.value.find(t => t.id === templateId)
    if (template) {
      template.criteria_template_items.push(data)
      template.criteria_template_items.sort((a, b) => a.order_num - b.order_num)
    }
    return data
  }

  async function updateItem(id, payload) {
    const { data, error } = await supabase
      .from('criteria_template_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    
    const template = templates.value.find(t => t.id === data.template_id)
    if (template) {
      const idx = template.criteria_template_items.findIndex(i => i.id === id)
      if (idx !== -1) {
        Object.assign(template.criteria_template_items[idx], data)
        template.criteria_template_items.sort((a, b) => a.order_num - b.order_num)
      }
    }
  }

  async function removeItem(id) {
    const { data, error } = await supabase
      .from('criteria_template_items')
      .delete()
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    
    const template = templates.value.find(t => t.id === data.template_id)
    if (template) {
      template.criteria_template_items = template.criteria_template_items.filter(i => i.id !== id)
    }
  }

  return { 
    templates, loading, 
    fetchTemplates, createTemplate, updateTemplate, removeTemplate,
    addItem, updateItem, removeItem 
  }
})

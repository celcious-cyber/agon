import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const loading = ref(false)
  let initialized = false

  const user = computed(() => session.value?.user ?? null)
  const role = computed(() => user.value?.user_metadata?.role ?? 'viewer')
  const isAdmin = computed(() => role.value === 'admin')
  const isJuri = computed(() => role.value === 'juri' || role.value === 'admin')

  async function init() {
    if (initialized) return
    initialized = true
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    supabase.auth.onAuthStateChange((_, s) => { session.value = s })
  }

  async function login(email, password) {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false
    if (error) throw error
    session.value = data.session
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
  }

  return { session, user, role, loading, isAdmin, isJuri, init, login, logout }
})

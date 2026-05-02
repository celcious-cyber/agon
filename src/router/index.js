import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
      // Master Data
      { path: 'master/institutions', name: 'Institutions', component: () => import('@/views/master/InstitutionsView.vue') },
      { path: 'master/categories', name: 'Categories', component: () => import('@/views/master/CategoryParamsView.vue') },
      { path: 'master/criteria', name: 'CriteriaTemplates', component: () => import('@/views/master/CriteriaTemplatesView.vue') },
      { path: 'master/sessions', name: 'MasterSessions', component: () => import('@/views/master/MasterSessionsView.vue') },
      // Competitions
      { path: 'competitions', name: 'Competitions', component: () => import('@/views/competitions/CompetitionHub.vue') },
      { path: 'competitions/assign-sessions', name: 'AssignSessions', component: () => import('@/views/competitions/AssignSessionsView.vue') },
      { path: 'competitions/schedule', name: 'Schedule', component: () => import('@/views/competitions/ScheduleView.vue') },
      // Participants
      { path: 'participants', name: 'Participants', component: () => import('@/views/participants/ParticipantHub.vue') },
      // Judging
      { path: 'judging/scoring', name: 'ScoringBoard', component: () => import('@/views/judging/ScoringBoard.vue'), meta: { roles: ['admin', 'juri'] } },
      { path: 'judging/bracket', name: 'BracketManager', component: () => import('@/views/judging/BracketManager.vue'), meta: { roles: ['admin', 'juri'] } },
      // Live Center
      { path: 'live/leaderboard', name: 'Leaderboard', component: () => import('@/views/live/Leaderboard.vue') },
      { path: 'live/bracket', name: 'LiveBracket', component: () => import('@/views/live/LiveBracket.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if (!to.meta.public && !auth.session) return { name: 'Login' }
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return { name: 'Dashboard' }
})

export default router

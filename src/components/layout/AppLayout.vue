<template>
  <div class="app-wrapper">
    <!-- Sidebar -->
    <aside v-if="!isLocked" class="app-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo">A</div>
        <div v-if="!sidebarCollapsed">
          <div class="brand-name">AGON</div>
          <div class="brand-tagline">Where Champions Are Made</div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <n-scrollbar style="flex:1">
        <n-menu
          :collapsed="sidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          :options="menuOptions"
          :value="activeKey"
          @update:value="handleMenuSelect"
          :indent="16"
        />
      </n-scrollbar>

      <!-- User Info -->
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <div>
            <div class="user-name">{{ auth.user?.email }}</div>
            <div class="user-role">{{ auth.role }}</div>
          </div>
          <n-button text @click="auth.logout()" style="margin-left:auto">
            <template #icon><n-icon :component="LogOut" /></template>
          </n-button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="app-content">
      <!-- Header -->
      <header v-if="!isLocked" class="app-header">
        <n-button text @click="sidebarCollapsed = !sidebarCollapsed">
          <template #icon><n-icon :component="Menu" size="20" /></template>
        </n-button>
        <div style="margin-left:auto; display:flex; align-items:center; gap:12px">
          <span class="badge" :class="`badge-${auth.role}`">{{ auth.role.toUpperCase() }}</span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-body">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { NScrollbar, NMenu, NButton, NIcon } from 'naive-ui'
import {
  GridOutline as Grid,
  BusinessOutline as Business,
  OptionsOutline as Options,
  ListOutline as ListIcon,
  TrophyOutline as Trophy,
  PeopleOutline as People,
  ScaleOutline as Scale,
  GitNetworkOutline as Bracket,
  TvOutline as Tv,
  BarChartOutline as Chart,
  LogOutOutline as LogOut,
  MenuOutline as Menu,
  DocumentTextOutline as Document,
  CalendarOutline as Calendar,
  TimeOutline,
} from '@vicons/ionicons5'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarCollapsed = ref(false)
const isLocked = ref(!!localStorage.getItem('judge_lock'))

// Monitor judge lock status dan route
setInterval(() => {
  const hasLock = !!localStorage.getItem('judge_lock')
  // Sidebar hanya sembunyi jika terkunci DAN berada di halaman scoring
  isLocked.value = hasLock && route.name === 'ScoringBoard'
}, 500)

const activeKey = computed(() => route.name)
const userInitial = computed(() => auth.user?.email?.[0]?.toUpperCase() ?? 'A')

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed(() => {
  const options = [
    {
      label: 'Dashboard',
      key: 'Dashboard',
      icon: renderIcon(Grid),
    },
    {
      type: 'divider',
      key: 'd1'
    },
    {
      label: 'Master Data',
      key: 'master',
      icon: renderIcon(Options),
      children: [
        { label: 'Parameter Kategori', key: 'Categories', icon: renderIcon(ListIcon) },
        { label: 'Bank Kriteria', key: 'CriteriaTemplates', icon: renderIcon(Document) },
      ]
    },
    {
      label: 'Kepesertaan',
      key: 'ParticipantManagement',
      icon: renderIcon(People),
      children: [
        { label: 'Institusi', key: 'Institutions', icon: renderIcon(Business) },
        { label: 'Manajemen Peserta', key: 'Participants', icon: renderIcon(People) },
      ]
    },
    {
      label: 'Manajemen Lomba',
      key: 'CompetitionManagement',
      icon: renderIcon(Trophy),
      children: [
        { label: 'Perlombaan', key: 'Competitions', icon: renderIcon(ListIcon) },
        { label: 'Atur Sesi', key: 'MasterSessions', icon: renderIcon(TimeOutline) },
        { label: 'Jadwal', key: 'Schedule', icon: renderIcon(Calendar) },
      ]
    },
    {
      type: 'divider',
      key: 'd2'
    },
    {
      label: 'Penjurian & Penilaian',
      key: 'judging',
      icon: renderIcon(Scale),
      children: [
        { label: 'Daftar Juri', key: 'JudgeManagement', icon: renderIcon(People) },
        { label: 'Plotting Juri', key: 'JudgePlotting', icon: renderIcon(Options) },
        { label: 'Scoring Board', key: 'ScoringBoard', icon: renderIcon(Chart) },
        { label: 'Bracket Manager', key: 'BracketManager', icon: renderIcon(Bracket) },
      ]
    },
    {
      type: 'divider',
      key: 'd3'
    },
    {
      label: 'Live Center',
      key: 'live',
      icon: renderIcon(Tv),
      children: [
        { label: 'Leaderboard', key: 'Leaderboard', icon: renderIcon(Chart) },
        { label: 'Live Bracket', key: 'LiveBracket', icon: renderIcon(Bracket) },
      ]
    }
  ]
  return options.filter(opt => opt.show === undefined || opt.show === true)
})

function handleMenuSelect(key) {
  router.push({ name: key })
}
</script>

<style scoped>
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: white;
  flex-shrink: 0;
}

.user-name {
  font-size: 12px; color: var(--text-1);
  font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 110px;
}

.user-role {
  font-size: 10px; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.5px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0; transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0; transform: translateY(-8px);
}
</style>

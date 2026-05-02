<template>
  <div class="dashboard-root">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="welcome-text">
          <h1>Selamat Datang di AGON Control Center</h1>
          <p>Memantau {{ stats[0].value }} kompetisi dan {{ stats[2].value }} peserta hari ini.</p>
        </div>
        <div class="hero-clock">
          <div class="time">{{ currentTime }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </div>
      
      <!-- Quick Stats Overlap -->
      <div class="stats-cards">
        <div v-for="s in stats" :key="s.label" class="premium-stat-card">
          <div class="stat-icon" :style="{ background: s.color }">
            <n-icon :component="s.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-body">
      <n-grid :cols="12" :x-gap="24" :y-gap="24" responsive="screen">
        <!-- Main Table -->
        <n-grid-item :span="8">
          <n-card title="Mata Lomba Sedang Berlangsung" class="glass-card shadow-lg" :segmented="{ content: true }">
            <template #header-extra>
              <n-button text type="primary" @click="router.push('/competitions')">Lihat Semua</n-button>
            </template>
            <n-data-table
              :columns="columns"
              :data="activeCompetitions"
              :loading="loading"
              :pagination="false"
              size="small"
              class="modern-table"
            />
          </n-card>
        </n-grid-item>

        <!-- Sidebar Dashboard -->
        <n-grid-item :span="4">
          <n-space vertical :size="24">
            <!-- Quick Actions -->
            <n-card title="Aksi Cepat" class="glass-card">
              <div class="action-grid">
                <n-button v-for="act in quickActions" :key="act.label" secondary :type="act.type" class="action-btn" @click="router.push(act.to)">
                  <template #icon><n-icon :component="act.icon" /></template>
                  {{ act.label }}
                </n-button>
              </div>
            </n-card>

            <!-- Real Level Distribution -->
            <n-card title="Distribusi Jenjang" class="glass-card">
              <n-space vertical :size="16">
                <div v-if="levelDist.length === 0 && !loading" style="text-align:center; padding: 20px; color: #888">
                  Belum ada data pendaftar.
                </div>
                <div v-for="lvl in levelDist" :key="lvl.name" class="progress-item">
                  <div class="progress-label">
                    <span>{{ lvl.name }}</span>
                    <span>{{ lvl.count }} Peserta</span>
                  </div>
                  <n-progress
                    type="line"
                    :percentage="lvl.percent"
                    :color="lvl.color"
                    :show-indicator="false"
                    processing
                  />
                </div>
              </n-space>
            </n-card>
          </n-space>
        </n-grid-item>
      </n-grid>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { 
  NTag, NCard, NGrid, NGridItem, NDataTable, NIcon, NButton, NSpace, NProgress
} from 'naive-ui'
import { 
  TrophyOutline, PeopleOutline, BusinessOutline, TimeOutline, 
  AddCircleOutline, GitNetworkOutline, BarChartOutline, SettingsOutline
} from '@vicons/ionicons5'

const router = useRouter()
const loading = ref(false)
const stats = ref([
  { label: 'Total Lomba', value: 0, icon: TrophyOutline, color: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  { label: 'Lomba Aktif', value: 0, icon: TimeOutline, color: 'linear-gradient(135deg, #00F2FE, #4FACFE)' },
  { label: 'Total Peserta', value: 0, icon: PeopleOutline, color: 'linear-gradient(135deg, #20D4A0, #05999E)' },
  { label: 'Institusi', value: 0, icon: BusinessOutline, color: 'linear-gradient(135deg, #F093FB, #F5576C)' },
])

const activeCompetitions = ref([])
const levelDist = ref([])

const quickActions = [
  { label: 'Tambah Peserta', icon: AddCircleOutline, type: 'primary', to: '/participants' },
  { label: 'Kelola Bracket', icon: GitNetworkOutline, type: 'info', to: '/judging/bracket' },
  { label: 'Input Nilai', icon: BarChartOutline, type: 'warning', to: '/judging/scoring' },
  { label: 'Pengaturan', icon: SettingsOutline, type: 'tertiary', to: '/master/categories' },
]

const currentTime = ref('')
const currentDate = ref('')

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  currentDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

const columns = [
  { title: 'NAMA LOMBA', key: 'name', fixed: 'left' },
  { title: 'SISTEM', key: 'scoring_type', render: (row) =>
    h(NTag, { type: row.scoring_type === 'point' ? 'warning' : 'info', size: 'small', round: true, ghost: true },
      { default: () => row.scoring_type === 'point' ? 'Poin' : 'Bracket' })
  },
  { title: 'STATUS', key: 'status', render: (row) =>
    h('div', { class: 'status-wrapper' }, [
      h('div', { class: `status-dot dot-${row.status}` }),
      h('span', { class: 'status-text' }, row.status.toUpperCase())
    ])
  }
]

async function loadDashboard() {
  loading.value = true
  try {
    // 1. Ambil data dasar dulu tanpa JOIN yang rumit agar tidak error
    const [compRes, partRes, instRes, regRes] = await Promise.all([
      supabase.from('competitions').select('*'),
      supabase.from('participants').select('*', { count: 'exact' }),
      supabase.from('institutions').select('*', { count: 'exact' }),
      supabase.from('registrations').select('competition_id')
    ])

    // Logging untuk debug di console jika masih kosong
    console.log('Stats Check:', { 
      comp: compRes.data?.length, 
      part: partRes.count, 
      inst: instRes.count,
      regs: regRes.data?.length 
    })

    if (compRes.error) console.error('Error Comp:', compRes.error)
    if (partRes.error) console.error('Error Part:', partRes.error)

    const competitions = compRes.data || []
    stats.value[0].value = competitions.length
    stats.value[1].value = competitions.filter(c => c.status === 'open').length
    stats.value[2].value = partRes.count || 0
    stats.value[3].value = instRes.count || 0

    activeCompetitions.value = competitions.filter(c => c.status === 'open').slice(0, 5)

    // 2. Distribusi Jenjang
    if (regRes.data && regRes.data.length > 0) {
      const counts = {}
      regRes.data.forEach(r => {
        const comp = competitions.find(c => c.id === r.competition_id)
        const lvlName = comp?.level || 'Umum'
        counts[lvlName] = (counts[lvlName] || 0) + 1
      })

      const totalRegs = regRes.data.length
      const colors = ['#FF9A9E', '#A18CD1', '#FBC2EB', '#84FAB0', '#A6C1EE']
      
      levelDist.value = Object.keys(counts).map((name, idx) => ({
        name: name.toUpperCase(),
        count: counts[name],
        percent: Math.round((counts[name] / totalRegs) * 100),
        color: colors[idx % colors.length]
      })).sort((a, b) => b.count - a.count)
    }

  } catch (e) {
    console.error('Fatal Dashboard Error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
  updateClock()
  setInterval(updateClock, 60000)
})
</script>

<style scoped>
/* Style tetap sama seperti sebelumnya agar visual tetap premium */
.dashboard-root {
  min-height: 100vh;
  background: var(--bg-body);
}

.hero-section {
  background: linear-gradient(135deg, #1a1f2c 0%, #0a0d14 100%);
  padding: 40px 40px 100px 40px;
  position: relative;
  border-radius: 0 0 40px 40px;
  margin-bottom: 80px;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.welcome-text h1 {
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin: 0;
  background: linear-gradient(to right, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-text p {
  color: #888;
  margin-top: 8px;
  font-size: 15px;
}

.hero-clock {
  text-align: right;
  color: white;
}

.hero-clock .time {
  font-size: 32px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
}

.hero-clock .date {
  color: var(--primary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stats-cards {
  position: absolute;
  bottom: -60px;
  left: 40px;
  right: 40px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.premium-stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  position: relative;
}

.stat-icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.stat-label {
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: white;
}

.dashboard-body {
  padding: 0 40px 40px 40px;
}

.glass-card {
  background: rgba(var(--bg-surface-rgb), 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  height: 60px;
  border-radius: 12px;
  font-weight: 600;
}

.status-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.dot-open { color: #20d4a0; background: #20d4a0; }
.dot-closed { color: #f5576c; background: #f5576c; }

.progress-item {
  margin-bottom: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}
</style>

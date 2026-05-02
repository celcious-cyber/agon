<template>
  <div>
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Ringkasan event AGON</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Quick Summary Table -->
    <n-card title="Lomba Aktif" :bordered="false" style="margin-top:8px">
      <n-data-table
        :columns="columns"
        :data="activeCompetitions"
        :loading="loading"
        :pagination="false"
        size="small"
      />
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { supabase } from '../lib/supabase.js'
import { NTag } from 'naive-ui'

const loading = ref(false)
const stats = ref([
  { label: 'Total Lomba', value: 0 },
  { label: 'Lomba Aktif', value: 0 },
  { label: 'Total Peserta', value: 0 },
  { label: 'Institusi', value: 0 },
])
const activeCompetitions = ref([])

const columns = [
  { title: 'Nama Lomba', key: 'name' },
  { title: 'Jenjang', key: 'level' },
  { title: 'Sistem', key: 'scoring_type', render: (row) =>
    h(NTag, { type: row.scoring_type === 'point' ? 'warning' : 'error', size: 'small' },
      { default: () => row.scoring_type === 'point' ? 'Poin' : 'Bracket' })
  },
  { title: 'Peserta', key: 'participant_count' },
  { title: 'Status', key: 'status', render: (row) =>
    h('span', { class: `badge badge-${row.status}` }, [
      h('span', { class: 'badge-dot' }),
      row.status.toUpperCase()
    ])
  }
]

async function loadDashboard() {
  loading.value = true
  const [comp, part, inst] = await Promise.all([
    supabase.from('competitions').select('id, name, level, scoring_type, status'),
    supabase.from('participants').select('id', { count: 'exact', head: true }),
    supabase.from('institutions').select('id', { count: 'exact', head: true }),
  ])
  const competitions = comp.data ?? []
  stats.value[0].value = competitions.length
  stats.value[1].value = competitions.filter(c => c.status === 'open').length
  stats.value[2].value = part.count ?? 0
  stats.value[3].value = inst.count ?? 0
  activeCompetitions.value = competitions.filter(c => c.status === 'open').map(c => ({
    ...c,
    participant_count: '—'
  }))
  loading.value = false
}

onMounted(loadDashboard)
</script>

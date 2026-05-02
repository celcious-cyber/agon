<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Scoring Board</h1>
        <p class="page-subtitle">Pusat penilaian real-time untuk mata lomba sistem poin</p>
      </div>
    </div>

    <n-grid x-gap="20" y-gap="20" cols="1 l:12" responsive="screen">
      <!-- Sisi Kiri: Kontrol & Statistik -->
      <n-grid-item span="3">
        <n-space vertical :size="20">
          <n-card title="Pilih Lomba" class="content-card">
            <n-select 
              v-model:value="selectedId" 
              :options="competitionOptions" 
              placeholder="Pilih lomba..." 
              filterable 
              @update:value="loadJudgingData" 
            />
          </n-card>

          <n-card v-if="selectedId" title="Info Kriteria" class="content-card">
            <n-list size="small">
              <n-list-item v-for="c in competitionCriteria" :key="c.id">
                <template #prefix><n-tag size="tiny" type="info">{{ c.weight }}%</n-tag></template>
                <div class="text-xs font-bold">{{ c.name }}</div>
                <div class="text-tiny opacity-60">Rentang: {{ c.min_score }} - {{ c.max_score }}</div>
              </n-list-item>
            </n-list>
          </n-card>
        </n-space>
      </n-grid-item>

      <!-- Sisi Kanan: Tabel Penilaian -->
      <n-grid-item span="9">
        <n-card v-if="selectedId" class="content-card">
          <template #header>
            <div style="display:flex; align-items:center; justify-content:space-between">
              <span>Daftar Peserta</span>
              <n-tag type="success" :bordered="false">Sistem Poin Aktif</n-tag>
            </div>
          </template>

          <n-data-table 
            :columns="columns" 
            :data="judgingStore.scores" 
            :loading="judgingStore.loading" 
            scroll-x="1000"
          />
        </n-card>
        <div v-else class="empty-state">
          <n-empty description="Pilih mata lomba pada panel kiri untuk memunculkan daftar penilaian peserta." />
        </div>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { 
  NCard, NDataTable, NSelect, NInputNumber, NSpace, NTag, NEmpty, 
  NGrid, NGridItem, NList, NListItem, useMessage 
} from 'naive-ui'
import { supabase } from '@/lib/supabase.js'
import { useJudgingStore } from '@/stores/judging.js'
import { useCompetitionsStore } from '@/stores/competitions.js'
import { useAuthStore } from '@/stores/auth.js'

const judgingStore = useJudgingStore()
const compStore = useCompetitionsStore()
const authStore = useAuthStore()
const message = useMessage()
const selectedId = ref(null)
const competitionCriteria = ref([])
let realtimeChannel = null

onMounted(() => { compStore.fetch() })
onUnmounted(() => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) })

const competitionOptions = computed(() => 
  compStore.items
    .filter(c => c.scoring_type === 'point')
    .map(c => ({ label: `${c.name} (${c.level})`, value: c.id }))
)

async function loadJudgingData(id) {
  if (!id) return
  
  // Ambil kriteria lomba ini
  const { data: criteria } = await supabase
    .from('competition_criteria')
    .select('*')
    .eq('competition_id', id)
    .order('order_num', { ascending: true })
  
  competitionCriteria.value = criteria || []
  
  // Ambil skor peserta
  await judgingStore.fetchScores(id)
  
  // Set up realtime
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  realtimeChannel = supabase.channel(`scoring-${id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'score_details', filter: `competition_id=eq.${id}` }, () => {
      judgingStore.fetchScores(id)
    })
    .subscribe()
}

const columns = computed(() => {
  const base = [
    { title: 'No', key: 'no', width: 60, render: (_, index) => index + 1 },
    { title: 'Peserta', key: 'participants.name', width: 200 },
    { title: 'Institusi', key: 'participants.institutions.name', width: 150 },
  ]

  const criteriaCols = competitionCriteria.value.map(c => ({
    title: c.name,
    key: `criteria_${c.id}`,
    align: 'center',
    width: 120,
    render(row) {
      // Cari nilai juri saat ini
      const myScore = judgingStore.scoreDetails.find(sd => 
        sd.participant_id === row.participant_id && 
        sd.criteria_id === c.id && 
        sd.judge_id === authStore.user.id
      )

      return h(NInputNumber, {
        value: myScore?.score || 0,
        min: c.min_score,
        max: c.max_score,
        size: 'small',
        placeholder: `${c.min_score}-${c.max_score}`,
        style: { width: '80px' },
        onUpdateValue: async (val) => {
          try {
            await judgingStore.upsertScore(selectedId.value, row.participant_id, c.id, val)
          } catch (e) {
            message.error(e.message)
          }
        }
      })
    }
  }))

  return [
    ...base,
    ...criteriaCols,
    { 
      title: 'Total Skor', 
      key: 'total_score', 
      fixed: 'right', 
      width: 100, 
      align: 'center',
      render: (row) => h('span', { class: 'total-score-badge' }, row.total_score.toFixed(1)) 
    }
  ]
})
</script>

<style scoped>
.empty-state { padding-top: 100px; }
.text-xs { font-size: 12px; }
.text-tiny { font-size: 10px; }
.font-bold { font-weight: 700; }
.total-score-badge {
  background: var(--success);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 14px;
}
</style>

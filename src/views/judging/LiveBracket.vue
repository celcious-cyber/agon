<template>
  <div class="page-container live-mode">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Live Center: Tournament Bracket</h1>
        <p class="page-subtitle">Pantau jalannya pertandingan secara real-time</p>
      </div>
      <div class="header-actions">
        <n-tag v-if="isRealtime" type="success" round ghost>
          <template #icon><n-icon><pulse-outline /></n-icon></template>
          Live Sync Active
        </n-tag>
      </div>
    </div>

    <n-card class="content-card mb-6 shadow-sm">
      <n-grid :cols="12" x-gap="12" items-center>
        <n-grid-item span="8">
          <n-form-item label="Pilih Mata Lomba" label-placement="left" :show-feedback="false">
            <n-select 
              v-model:value="selectedId" 
              :options="competitionOptions" 
              placeholder="Pilih lomba untuk melihat bagan..." 
              filterable 
              @update:value="initLiveBracket" 
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item span="4">
          <div v-if="selectedId" class="stat-info">
            <n-button quaternary circle @click="initLiveBracket">
              <template #icon><n-icon><refresh-outline /></n-icon></template>
            </n-button>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>

    <div v-if="selectedId" class="bracket-view-area live">
      <div v-if="loading" class="loading-overlay">
        <n-spin size="large" />
      </div>
      
      <div v-else-if="judgingStore.brackets.length === 0" class="empty-state">
        <n-empty description="Bagan belum tersedia untuk lomba ini" />
      </div>

      <div v-else class="zoomable-bracket">
        <BracketTree 
          :brackets="judgingStore.brackets" 
          :participants="competitionParticipants" 
          :readonly="true" 
        />
      </div>
    </div>

    <div v-else class="initial-state">
      <n-empty description="Silakan pilih mata lomba untuk mulai memantau" size="large">
        <template #extra>
          <div class="hint">Bagan akan terupdate otomatis saat pertandingan selesai</div>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  NCard, NSelect, NFormItem, NSpin, NEmpty, NTag, NIcon, NButton, NGrid, NGridItem
} from 'naive-ui'
import { PulseOutline, RefreshOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'
import { useJudgingStore } from '@/stores/judging.js'
import { useCompetitionsStore } from '@/stores/competitions.js'
import BracketTree from '@/components/bracket/BracketTree.vue'

const judgingStore = useJudgingStore()
const compStore = useCompetitionsStore()

const selectedId = ref(null)
const competitionParticipants = ref([])
const loading = ref(false)
const isRealtime = ref(false)
let subscription = null

onMounted(() => { 
  compStore.fetch()
})

onUnmounted(() => {
  stopRealtime()
})

const competitionOptions = computed(() => {
  return compStore.items
    .filter(c => c.scoring_type === 'bracket')
    .map(c => ({ label: c.name, value: c.id }))
})

async function initLiveBracket(id) {
  loading.value = true
  try {
    // Ambil peserta
    const { data: p } = await supabase
      .from('participants')
      .select('*, registrations!inner(competition_id)')
      .eq('registrations.competition_id', id)
    
    competitionParticipants.value = p || []
    
    // Ambil data bracket awal
    await judgingStore.fetchBrackets(id)
    
    // Aktifkan Realtime
    startRealtime(id)
  } finally {
    loading.value = false
  }
}

function startRealtime(competitionId) {
  stopRealtime()
  
  subscription = supabase
    .channel('live-bracket-' + competitionId)
    .on(
      'postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'matches', 
        filter: `competition_id=eq.${competitionId}` 
      }, 
      () => {
        // Jika ada perubahan apa pun di tabel matches, tarik data terbaru
        judgingStore.fetchBrackets(competitionId)
      }
    )
    .subscribe()
    
  isRealtime.value = true
}

function stopRealtime() {
  if (subscription) {
    supabase.removeChannel(subscription)
    subscription = null
  }
  isRealtime.value = false
}
</script>

<style scoped>
.live-mode {
  background: var(--bg-body);
}

.bracket-view-area.live {
  min-height: calc(100vh - 250px);
  background: #0f1218; /* Darker background for live mode */
  border-radius: 20px;
  border: 1px solid #1e2430;
}

.initial-state {
  margin-top: 100px;
}

.hint {
  color: var(--text-3);
  font-size: 13px;
  font-style: italic;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  z-index: 10;
}
</style>

<template>
  <div class="page-container" :class="{ 'live-fullscreen': isFullscreen }">
    <div class="page-header" v-if="!isFullscreen">
      <div class="header-content">
        <h1 class="page-title">Live Scoreboard & Monitoring</h1>
        <p class="page-subtitle">Pantau pergerakan nilai dan progress juri secara real-time</p>
      </div>
      <n-button type="primary" secondary @click="isFullscreen = !isFullscreen">
        <template #icon><n-icon><expand-outline /></n-icon></template>
        Mode Monitor
      </n-button>
    </div>

    <!-- Tombol Kelayang untuk Keluar Mode Monitor -->
    <div v-if="isFullscreen" class="floating-exit">
      <n-button type="error" @click="isFullscreen = false">
        <template #icon><n-icon><close-outline /></n-icon></template>
        Keluar Mode Monitor
      </n-button>
    </div>

    <n-card class="content-card mb-6" v-if="!isFullscreen">
      <n-grid cols="1 l:2" x-gap="20">
        <n-grid-item>
          <n-form-item label="Pilih Mata Lomba untuk Dimonitor">
            <n-select 
              v-model:value="selectedId" 
              :options="competitionOptions" 
              placeholder="Cari mata lomba..." 
              filterable
              @update:value="liveStore.subscribe" 
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item v-if="selectedId">
           <div class="monitor-summary">
              <n-statistic label="Total Peserta" :value="liveStore.scores.length" />
              <n-divider vertical />
              <n-statistic label="Status Sistem" value="Real-time Terhubung">
                <template #prefix><n-icon color="green"><radio-button-on-outline /></n-icon></template>
              </n-statistic>
           </div>
        </n-grid-item>
      </n-grid>
    </n-card>

    <div v-if="selectedId" class="leaderboard-wrapper">
      <!-- HEADER TABEL -->
      <div class="lb-table-header">
        <div class="col-rank">RANK</div>
        <div class="col-name">PESERTA & INSTITUSI</div>
        <div class="col-judges">STATUS JURI</div>
        <div class="col-score">TOTAL SKOR</div>
      </div>

      <!-- LIST DATA DENGAN ANIMASI FLIP -->
      <TransitionGroup name="flip" tag="div" class="leaderboard-list">
        <div v-for="(entry, index) in liveStore.scores" :key="entry.participant_id" class="lb-row">
          <div class="col-rank">
            <div class="rank-badge" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
          </div>
          
          <div class="col-name">
            <div class="participant-name">{{ entry.participants?.name }}</div>
            <div class="participant-inst">{{ entry.participants?.institutions?.name }}</div>
          </div>

          <div class="col-judges">
            <div class="judge-dots">
              <div v-for="pos in [1, 2, 3]" :key="pos" class="judge-dot-item">
                <div 
                  class="dot" 
                  :class="{ 'dot-active': liveStore.judgingStatus[entry.participant_id]?.[pos] }"
                ></div>
                <span class="dot-label">J{{ pos }}</span>
              </div>
            </div>
          </div>

          <div class="col-score">
            <div class="score-value">{{ entry.total_score.toFixed(2) }}</div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="liveStore.scores.length === 0" class="empty-state">
        <n-empty description="Belum ada data nilai masuk." />
      </div>
    </div>

    <div v-else class="empty-state">
      <n-empty description="Pilih mata lomba untuk memulai monitoring live." />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  NButton, NCard, NSelect, NEmpty, NGrid, NGridItem, 
  NFormItem, NStatistic, NIcon, NDivider 
} from 'naive-ui'
import { ExpandOutline, RadioButtonOnOutline } from '@vicons/ionicons5'
import { useLiveStore } from '@/stores/live.js'
import { useCompetitionsStore } from '@/stores/competitions.js'

const liveStore = useLiveStore()
const compStore = useCompetitionsStore()
const selectedId = ref(null)
const isFullscreen = ref(false)

onMounted(() => { 
  compStore.fetch() 
})

onUnmounted(() => { 
  liveStore.unsubscribe() 
})

const competitionOptions = computed(() => 
  compStore.items
    .filter(c => c.scoring_type === 'point')
    .map(c => ({ label: c.name + ' (' + c.level + ')', value: c.id }))
)
</script>

<style scoped>
.leaderboard-wrapper {
  background: #0f172a; /* Dark theme untuk monitor */
  border-radius: 16px;
  padding: 20px;
  min-height: 500px;
  color: #f8fafc;
}

.lb-table-header {
  display: flex;
  padding: 10px 20px;
  font-weight: 800;
  font-size: 12px;
  color: #94a3b8;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 15px;
}

.lb-row {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #1e293b;
  margin-bottom: 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.lb-row:hover {
  background: #334155;
  border-color: var(--primary);
  transform: scale(1.01);
}

.col-rank { width: 80px; }
.col-name { flex: 1; }
.col-judges { width: 150px; }
.col-score { width: 120px; text-align: right; }

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #334155;
  font-weight: 900;
  font-size: 14px;
}

.rank-1 { background: #fbbf24; color: #000; box-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
.rank-2 { background: #94a3b8; color: #000; }
.rank-3 { background: #b45309; color: #fff; }

.participant-name { font-weight: 700; font-size: 16px; }
.participant-inst { font-size: 12px; opacity: 0.6; }

.judge-dots { display: flex; gap: 12px; }
.judge-dot-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #475569;
  transition: all 0.3s ease;
}
.dot-active {
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
}
.dot-label { font-size: 10px; font-weight: 800; color: #94a3b8; }

.score-value {
  font-size: 20px;
  font-weight: 900;
  color: #22c55e;
}

.monitor-summary { display: flex; align-items: center; gap: 40px; padding: 10px; }

/* Animasi Flip Move */
.flip-move { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

.live-fullscreen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  background: #0f172a;
  padding: 40px;
  overflow-y: auto;
}

.floating-exit {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.floating-exit:hover {
  opacity: 1;
}
</style>

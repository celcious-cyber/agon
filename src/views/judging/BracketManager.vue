<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Manajemen Bracket</h1>
        <p class="page-subtitle">Kelola bagan pertandingan (2-4 regu per match)</p>
      </div>
      <div class="header-actions" v-if="selectedId">
        <n-space>
          <n-input-number v-model:value="teamsPerMatch" :min="2" :max="5" style="width: 180px">
            <template #prefix><span style="font-size:11px">Regu/Match:</span></template>
          </n-input-number>
          
          <n-popconfirm @positive-click="handleGenerate">
            <template #trigger>
              <n-button secondary type="primary">Re-Generate</n-button>
            </template>
            Hapus bagan saat ini dan buat ulang?
          </n-popconfirm>
        </n-space>
      </div>
    </div>

    <n-card class="content-card mb-6 shadow-sm">
      <n-grid :cols="12" x-gap="12" items-center>
        <n-grid-item span="8">
          <n-form-item label="Pilih Mata Lomba" label-placement="left" :show-feedback="false">
            <n-select 
              v-model:value="selectedId" 
              :options="competitionOptions" 
              placeholder="Pilih lomba..." 
              filterable 
              @update:value="loadBracketData" 
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item span="4">
          <div v-if="selectedId" class="stat-info">
            <n-tag type="info" round>{{ competitionParticipants.length }} Peserta</n-tag>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>

    <div v-if="selectedId" class="bracket-view-area">
      <div v-if="judgingStore.loading" class="loading-overlay">
        <n-spin size="large" />
        <p>Memproses Data...</p>
      </div>
      
      <div v-else-if="judgingStore.brackets.length === 0" class="empty-state">
        <n-empty description="Bagan belum diundi">
          <template #extra>
            <n-space vertical align="center">
              <n-form-item label="Satu kali tanding berapa regu?">
                <n-radio-group v-model:value="teamsPerMatch">
                  <n-radio-button :value="2">2 (Dual)</n-radio-button>
                  <n-radio-button :value="3">3 (Triple)</n-radio-button>
                  <n-radio-button :value="4">4 (Quad)</n-radio-button>
                  <n-radio-button :value="5">5 (Penta)</n-radio-button>
                </n-radio-group>
              </n-form-item>
              <n-button type="primary" size="large" @click="handleGenerate">Generate Bracket Sekarang</n-button>
            </n-space>
          </template>
        </n-empty>
      </div>

      <div v-else class="zoomable-bracket">
        <BracketTree 
          :brackets="judgingStore.brackets" 
          :participants="competitionParticipants" 
          :readonly="false" 
          @winner-selected="confirmWinner" 
          @reset-match="confirmReset"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  NButton, NCard, NSelect, NFormItem, NSpin, NEmpty, 
  useMessage, useDialog, NPopconfirm, NTag, NGrid, NGridItem, 
  NInputNumber, NSpace, NRadioGroup, NRadioButton
} from 'naive-ui'
import { supabase } from '@/lib/supabase.js'
import { useJudgingStore } from '@/stores/judging.js'
import { useCompetitionsStore } from '@/stores/competitions.js'
import BracketTree from '@/components/bracket/BracketTree.vue'

const judgingStore = useJudgingStore()
const compStore = useCompetitionsStore()
const message = useMessage()
const dialog = useDialog()

const selectedId = ref(null)
const teamsPerMatch = ref(2)
const competitionParticipants = ref([])

onMounted(() => { compStore.fetch() })

const competitionOptions = computed(() => {
  return compStore.items
    .filter(c => c.scoring_type === 'bracket')
    .map(c => ({ label: c.name, value: c.id }))
})

async function loadBracketData(id) {
  const { data: p } = await supabase
    .from('participants')
    .select('*, registrations!inner(competition_id)')
    .eq('registrations.competition_id', id)
  
  competitionParticipants.value = p || []
  await judgingStore.fetchBrackets(id)
}

async function handleGenerate() {
  try {
    await judgingStore.generateBrackets(selectedId.value, competitionParticipants.value, teamsPerMatch.value)
    message.success(`Bagan pertandingan (${teamsPerMatch.value} regu/match) berhasil dibuat`)
  } catch (e) {
    message.error(e.message)
  }
}

function confirmWinner(bId, pId) {
  const participant = competitionParticipants.value.find(p => p.id === pId)
  dialog.warning({
    title: 'Konfirmasi Pemenang',
    content: `Apakah Anda yakin menetapkan "${participant?.name}" sebagai pemenang di pertandingan ini?`,
    positiveText: 'Ya, Menangkan',
    negativeText: 'Batal',
    onPositiveClick: async () => {
      try {
        const b = judgingStore.brackets.find(x => x.id === bId)
        await judgingStore.setWinner(b, pId, teamsPerMatch.value)
        message.success(`${participant?.name} lanjut ke babak berikutnya`)
      } catch (e) {
        message.error(e.message)
      }
    }
  })
}

function confirmReset(bId) {
  dialog.error({
    title: 'Reset Pertandingan',
    content: 'Apakah Anda yakin ingin membatalkan hasil pertandingan ini?',
    positiveText: 'Ya, Reset',
    negativeText: 'Batal',
    onPositiveClick: async () => {
      try {
        await judgingStore.resetWinner(bId, teamsPerMatch.value)
        message.info('Hasil pertandingan telah di-reset')
      } catch (e) {
        message.error(e.message)
      }
    }
  })
}
</script>

<style scoped> 
.bracket-view-area {
  min-height: 600px;
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--bg-surface-rgb), 0.8);
  z-index: 10;
  gap: 12px;
}

.empty-state {
  padding: 100px 0;
}

.zoomable-bracket {
  padding: 60px;
  overflow: auto;
}

.stat-info {
  display: flex;
  justify-content: flex-end;
}
</style>

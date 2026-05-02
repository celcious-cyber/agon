<template>
  <div class="page-container" :class="{ 'locked-mode': isLocked }">
    <!-- HEADER SETUP -->
    <div v-if="!isLocked" class="page-header">
      <div class="header-content">
        <h1 class="page-title">Setup Penjurian</h1>
        <p class="page-subtitle">Pilih lomba dan posisi juri sebelum menyerahkan perangkat ke juri.</p>
      </div>
    </div>

    <!-- HEADER TERKUNCI -->
    <div v-else class="locked-header">
       <div class="judge-identity">
          <n-tag type="primary" size="large" round>
            <template #icon><n-icon><person-outline /></n-icon></template>
            {{ currentJudgeInfo?.name }} (Juri {{ currentJudgeInfo?.position }})
          </n-tag>
          <div class="comp-title">{{ selectedCompetitionName }}</div>
       </div>
       <n-button quaternary circle @click="showUnlockModal">
          <template #icon><n-icon><lock-open-outline /></n-icon></template>
       </n-button>
    </div>

    <n-grid x-gap="20" y-gap="20" cols="1 l:12" responsive="screen">
      <!-- PANEL SETUP -->
      <n-grid-item v-if="!isLocked" span="4">
        <n-card title="Konfigurasi Perangkat" class="content-card">
          <n-space vertical :size="16">
            <n-form-item label="1. Pilih Mata Lomba">
              <n-select 
                v-model:value="selectedId" 
                :options="competitionOptions" 
                placeholder="Pilih lomba..." 
                filterable 
                @update:value="handleCompetitionChange" 
              />
            </n-form-item>

            <div v-if="selectedId">
              <n-form-item label="2. Pilih Juri yang Bertugas">
                <n-select 
                  v-model:value="selectedJudgePlotId" 
                  :options="assignedJudgeOptions" 
                  :placeholder="assignedJudges.length > 0 ? 'Pilih posisi juri...' : 'Tidak ada juri terplot'" 
                  :disabled="assignedJudges.length === 0"
                  @update:value="handleJudgeSelect"
                />
              </n-form-item>
            </div>

            <n-button 
              v-if="selectedId && selectedJudgePlotId" 
              type="primary" 
              block 
              size="large"
              @click="showLockModal = true"
            >
              Kunci & Mulai Penilaian
            </n-button>
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- TABEL PENILAIAN -->
      <n-grid-item :span="isLocked ? 12 : 8">
        <n-alert v-if="!isLocked && selectedId" type="info" style="margin-bottom:10px">
          Gunakan Mode Kunci untuk mulai memberikan penilaian.
        </n-alert>

        <n-card v-if="selectedId" class="content-card" :bordered="isLocked">
          <n-data-table 
            :columns="columns" 
            :data="judgingStore.scores" 
            :loading="judgingStore.loading" 
            scroll-x="1000"
          />
        </n-card>
        <div v-else class="empty-state">
          <n-empty description="Silakan setup lomba terlebih dahulu." />
        </div>
      </n-grid-item>
    </n-grid>

    <!-- MODAL PIN -->
    <n-modal v-model:show="showLockModal" preset="dialog" title="Kunci Perangkat">
      <p>Halaman akan dikunci untuk juri yang dipilih. Masukkan PIN untuk melanjutkan.</p>
      <n-input v-model:value="pinInput" type="password" placeholder="PIN Keamanan" @keyup.enter="handleLock" />
      <template #action>
        <n-button @click="showLockModal = false">Batal</n-button>
        <n-button type="primary" @click="handleLock">Kunci</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showUnlockModalVisible" preset="dialog" title="Buka Kunci">
      <p>Masukkan PIN Keamanan untuk kembali ke menu setup.</p>
      <n-input v-model:value="pinInput" type="password" placeholder="PIN Keamanan" @keyup.enter="handleUnlock" />
      <template #action>
        <n-button @click="showUnlockModalVisible = false">Batal</n-button>
        <n-button type="error" @click="handleUnlock">Buka Kunci</n-button>
      </template>
    </n-modal>

    <!-- DIALOG KONFIRMASI SUBMIT -->
    <n-modal v-model:show="showConfirmSubmit" preset="dialog" title="Konfirmasi Nilai">
       <template #default>
          <p>Apakah Anda yakin ingin mengirim nilai untuk <b>{{ pendingParticipant?.name }}</b>?</p>
          <p class="text-tiny opacity-60">Nilai yang sudah dikirim akan langsung masuk ke sistem kalkulasi leaderboard.</p>
       </template>
       <template #action>
          <n-button @click="showConfirmSubmit = false">Periksa Lagi</n-button>
          <n-button type="success" :loading="submitting" @click="confirmSubmit">Ya, Kirim Nilai</n-button>
       </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, reactive } from 'vue'
import { 
  NCard, NDataTable, NSelect, NInputNumber, NSpace, NTag, NEmpty, 
  NGrid, NGridItem, NAlert, NIcon, NButton, NModal, NInput, NFormItem, useMessage, useDialog 
} from 'naive-ui'
import { PersonOutline, LockOpenOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'
import { useJudgingStore } from '@/stores/judging.js'
import { useCompetitionsStore } from '@/stores/competitions.js'

const judgingStore = useJudgingStore()
const compStore = useCompetitionsStore()
const message = useMessage()
const dialog = useDialog()

// State Logic
const isLocked = ref(false)
const showLockModal = ref(false)
const showUnlockModalVisible = ref(false)
const pinInput = ref('')
const masterPin = '1234'

// Scoring State
const tempScores = reactive({}) // Format: { participantId: { criteriaId: value } }
const showConfirmSubmit = ref(false)
const pendingParticipant = ref(null)
const submitting = ref(false)

const selectedId = ref(null)
const selectedJudgePlotId = ref(null)
const competitionCriteria = ref([])
const currentJudgeInfo = ref(null)
const assignedJudges = ref([])
let realtimeChannel = null

onMounted(() => { 
  compStore.fetch()
  const savedLock = localStorage.getItem('judge_lock')
  if (savedLock) {
    const data = JSON.parse(savedLock)
    selectedId.value = data.competitionId
    handleCompetitionChange(data.competitionId).then(() => {
      selectedJudgePlotId.value = data.plotId
      handleJudgeSelect(data.plotId)
      isLocked.value = true
    })
  }
})

onUnmounted(() => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) })

const competitionOptions = computed(() => 
  compStore.items
    .filter(c => c.scoring_type === 'point')
    .map(c => ({ label: `${c.name} (${c.level})`, value: c.id }))
)

const selectedCompetitionName = computed(() => {
  return compStore.items.find(c => c.id === selectedId.value)?.name || ''
})

const assignedJudgeOptions = computed(() => 
  assignedJudges.value.map(j => ({ label: `Juri ${j.position}: ${j.judges?.name}`, value: j.id }))
)

async function handleCompetitionChange(id) {
  if (!id) return
  Object.keys(tempScores).forEach(key => delete tempScores[key])
  const { data: plots } = await supabase.from('competition_judges').select('*, judges(name)').eq('competition_id', id).order('position')
  assignedJudges.value = plots || []
  selectedJudgePlotId.value = null

  const { data: criteria } = await supabase.from('competition_criteria').select('*').eq('competition_id', id).order('order_num', { ascending: true })
  competitionCriteria.value = criteria || []
  loadScores(id)
}

function handleJudgeSelect(plotId) {
  const plot = assignedJudges.value.find(p => p.id === plotId)
  if (plot) {
    currentJudgeInfo.value = { id: plot.judge_id, name: plot.judges?.name, position: plot.position }
  }
}

function handleLock() {
  if (pinInput.value !== masterPin) return message.error('PIN Salah!')
  isLocked.value = true
  showLockModal.value = false
  pinInput.value = ''
  localStorage.setItem('judge_lock', JSON.stringify({ competitionId: selectedId.value, plotId: selectedJudgePlotId.value }))
}

function showUnlockModal() { pinInput.value = ''; showUnlockModalVisible.value = true; }

function handleUnlock() {
  if (pinInput.value !== masterPin) return message.error('PIN Salah!')
  isLocked.value = false
  showUnlockModalVisible.value = false
  pinInput.value = ''
  Object.keys(tempScores).forEach(key => delete tempScores[key])
  localStorage.removeItem('judge_lock')
}

async function loadScores(id) {
  await judgingStore.fetchScores(id)
  judgingStore.scoreDetails.forEach(sd => {
    if (sd.judge_id === currentJudgeInfo.value?.id) {
      if (!tempScores[sd.participant_id]) tempScores[sd.participant_id] = {}
      tempScores[sd.participant_id][sd.criteria_id] = sd.score
    }
  })
}

function handleSubmitClick(row) {
  pendingParticipant.value = { id: row.participant_id, name: row.participants.name }
  showConfirmSubmit.value = true
}

async function confirmSubmit() {
  submitting.value = true
  try {
    const pId = pendingParticipant.value.id
    const scoresToSubmit = tempScores[pId]
    const promises = Object.keys(scoresToSubmit).map(cId => {
      return judgingStore.upsertScore(selectedId.value, pId, cId, currentJudgeInfo.value.id, scoresToSubmit[cId])
    })
    await Promise.all(promises)
    message.success(`Nilai untuk ${pendingParticipant.value.name} berhasil terkirim`)
    showConfirmSubmit.value = false
    judgingStore.fetchScores(selectedId.value)
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}

const columns = computed(() => {
  const base = [
    { title: 'Peserta', key: 'participants.name', width: 180, fixed: 'left' },
  ]

  const criteriaCols = competitionCriteria.value.map(c => ({
    title: c.name,
    key: `criteria_${c.id}`,
    align: 'center',
    width: 100,
    render(row) {
      if (!tempScores[row.participant_id]) tempScores[row.participant_id] = {}
      return h(NInputNumber, {
        value: tempScores[row.participant_id][c.id] || 0,
        min: c.min_score,
        max: c.max_score,
        size: 'small',
        disabled: !isLocked.value,
        onUpdateValue: (val) => { tempScores[row.participant_id][c.id] = val }
      })
    }
  }))

  return [
    ...base,
    ...criteriaCols,
    { 
      title: 'Total Anda', 
      key: 'my_total', 
      width: 110, 
      align: 'center',
      render: (row) => {
        const rowScores = tempScores[row.participant_id] || {}
        const sum = Object.values(rowScores).reduce((a, b) => a + (b || 0), 0)
        return h('div', { class: 'my-total-badge' }, sum.toFixed(1))
      }
    },
    {
      title: 'Aksi',
      key: 'submit',
      width: 120,
      fixed: 'right',
      render: (row) => h(NButton, {
        type: 'primary',
        size: 'small',
        disabled: !isLocked.value,
        onClick: () => handleSubmitClick(row)
      }, { default: () => 'Kirim Nilai', icon: () => h(NIcon, { component: CheckmarkCircleOutline }) })
    }
  ]
})
</script>

<style scoped>
.locked-mode { padding: 0 !important; }
.locked-header { background: var(--primary); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
.judge-identity { display: flex; align-items: center; gap: 15px; }
.comp-title { font-weight: 800; font-size: 16px; }
.my-total-badge { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 8px; font-weight: 800; }
.empty-state { padding-top: 100px; }
.text-tiny { font-size: 11px; }
</style>

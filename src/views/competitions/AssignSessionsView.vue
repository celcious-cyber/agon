<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Atur Sesi Lomba</h1>
        <p class="page-subtitle">Hubungkan mata lomba dengan master sesi waktu dan lokasi</p>
      </div>
    </div>

    <n-grid x-gap="20" cols="1 l:12" responsive="screen">
      <!-- Sisi Kiri: Daftar Lomba -->
      <n-grid-item span="4">
        <n-card title="Pilih Mata Lomba" class="content-card">
          <n-list hoverable clickable>
            <n-list-item 
              v-for="item in compStore.items" 
              :key="item.id"
              :class="{ 'active-item': selectedId === item.id }"
              @click="selectCompetition(item)"
            >
              <template #prefix>
                <n-tag :type="item.schedules?.length > 0 ? 'success' : 'default'" size="small" round>
                  {{ item.schedules?.length || 0 }}
                </n-tag>
              </template>
              <div class="font-bold">{{ item.name }}</div>
              <div class="text-tiny opacity-60">{{ item.level }} - {{ item.gender?.toUpperCase() }}</div>
            </n-list-item>
          </n-list>
        </n-card>
      </n-grid-item>

      <!-- Sisi Kanan: Editor Sesi -->
      <n-grid-item span="8">
        <n-card v-if="selectedItem" :title="'Konfigurasi Jadwal: ' + selectedItem.name" class="content-card">
          <template #header-extra>
            <n-button type="primary" :loading="submitting" @click="handleSave">
              Simpan Perubahan
            </n-button>
          </template>

          <n-space vertical :size="20">
            <div v-if="scheduleList.length === 0" class="empty-sessions">
              <n-empty description="Lomba ini belum memiliki sesi jadwal.">
                <template #extra>
                  <n-button type="primary" dashed @click="addSession">Tambah Sesi Pertama</n-button>
                </template>
              </n-empty>
            </div>

            <div v-for="(session, index) in scheduleList" :key="index" class="session-box">
              <div class="session-header">
                <span class="session-number">Sesi {{ index + 1 }}</span>
                <n-button type="error" quaternary circle size="small" @click="scheduleList.splice(index, 1)">
                  <template #icon><n-icon><trash-outline /></n-icon></template>
                </n-button>
              </div>

              <n-grid :cols="12" x-gap="12" y-gap="12">
                <n-grid-item span="12">
                  <n-form-item label="Pilih Sesi Master (Waktu)">
                    <n-select 
                      v-model:value="session.master_session_id" 
                      :options="masterSessionOptions" 
                      placeholder="Pilih jam dari Master Sesi..."
                      @update:value="(val) => handleSessionSelect(index, val)"
                    />
                  </n-form-item>
                </n-grid-item>
                
                <n-grid-item span="6">
                  <n-form-item label="Label Tampilan">
                    <n-input v-model:value="session.label" placeholder="Misal: Penyisihan / Final" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item span="6">
                  <n-form-item label="Lokasi / Venue">
                    <n-input v-model:value="session.location" placeholder="Masukkan lokasi khusus..." />
                  </n-form-item>
                </n-grid-item>
              </n-grid>
            </div>

            <n-button v-if="scheduleList.length > 0" dashed block @click="addSession">
              + Tambah Sesi Lagi
            </n-button>
          </n-space>
        </n-card>

        <div v-else class="empty-state">
          <n-empty description="Pilih salah satu mata lomba di panel kiri untuk mulai mengatur sesi." />
        </div>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { 
  NCard, NButton, NIcon, NFormItem, NInput, NSelect, NSpace, 
  NTag, NEmpty, NGrid, NGridItem, NList, NListItem, useMessage 
} from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'
import { useCompetitionsStore } from '@/stores/competitions.js'
import { supabase } from '@/lib/supabase.js'

const compStore = useCompetitionsStore()
const message = useMessage()
const selectedId = ref(null)
const selectedItem = ref(null)
const scheduleList = ref([])
const masterSessions = ref([])
const submitting = ref(false)

onMounted(() => { 
  compStore.fetch()
  fetchMasterSessions()
})

async function fetchMasterSessions() {
  const { data } = await supabase.from('master_sessions').select('*').order('start_time')
  masterSessions.value = data || []
}

const masterSessionOptions = computed(() => 
  masterSessions.value.map(s => ({
    label: `${s.name} (${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)})`,
    value: s.id
  }))
)

function selectCompetition(item) {
  selectedId.value = item.id
  selectedItem.value = item
  const rawSchedules = item.schedules || []
  scheduleList.value = JSON.parse(JSON.stringify(rawSchedules)) // Deep clone
}

function addSession() {
  scheduleList.value.push({ 
    master_session_id: null,
    label: '', 
    location: '', 
    start_time: null, 
    end_time: null 
  })
}

function handleSessionSelect(index, sessionId) {
  const master = masterSessions.value.find(s => s.id === sessionId)
  if (master) {
    scheduleList.value[index].start_time = master.start_time
    scheduleList.value[index].end_time = master.end_time
    if (!scheduleList.value[index].label) {
      scheduleList.value[index].label = master.name
    }
  }
}

async function handleSave() {
  if (!selectedId.value) return
  submitting.value = true
  try {
    await compStore.update(selectedId.value, { schedules: scheduleList.value }, selectedItem.value.criteria)
    message.success('Jadwal ' + selectedItem.value.name + ' berhasil diperbarui')
    // Refresh the item in memory
    selectedItem.value.schedules = [...scheduleList.value]
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.active-item {
  background: var(--primary-fade) !important;
  border-left: 4px solid var(--primary);
}
.session-box {
  padding: 16px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.session-number {
  font-weight: 800;
  font-size: 14px;
  color: var(--primary);
}
.font-bold { font-weight: 700; }
.text-tiny { font-size: 11px; }
.empty-sessions { padding: 40px; text-align: center; }
.empty-state { padding-top: 100px; }
</style>

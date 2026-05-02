<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Jadwal Perlombaan</h1>
        <p class="page-subtitle">Daftar ringkasan waktu, lokasi, dan tanggal pelaksanaan seluruh mata lomba</p>
      </div>
    </div>

    <n-card class="content-card">
      <n-data-table 
        :columns="columns" 
        :data="compStore.items" 
        :loading="compStore.loading"
        :pagination="{ pageSize: 15 }"
      />
    </n-card>

    <!-- Modal Edit Jadwal (Penempatan Sesi) -->
    <n-modal v-model:show="showEditModal" preset="card" :title="'Atur Jadwal: ' + editingItem?.name" style="width: 650px">
      <n-space vertical :size="16">
        <n-alert type="info" :show-icon="false">
          Pilih paket sesi & lokasi, lalu tentukan tanggal pelaksanaannya.
        </n-alert>

        <div v-for="(session, index) in scheduleList" :key="index" class="session-edit-box">
          <n-grid :cols="12" x-gap="12" y-gap="8">
            <!-- Pilih Sesi -->
            <n-grid-item span="12">
              <n-form-item label="Pilih Paket Sesi & Lokasi">
                <n-select 
                  v-model:value="session.master_session_id" 
                  :options="masterSessionOptions" 
                  placeholder="Cari Sesi / Lokasi..."
                  filterable
                  @update:value="(val) => handleSessionSelect(index, val)"
                />
              </n-form-item>
            </n-grid-item>

            <!-- Pilih Tanggal -->
            <n-grid-item span="10">
              <n-form-item label="Pilih Tanggal Pelaksanaan">
                <n-date-picker v-model:value="session.date" type="date" style="width: 100%" placeholder="Pilih Tanggal" />
              </n-form-item>
            </n-grid-item>

            <!-- Tombol Hapus Sesi -->
            <n-grid-item span="2" style="display:flex; align-items: flex-end; padding-bottom: 8px">
              <n-button type="error" quaternary circle @click="scheduleList.splice(index, 1)">
                <template #icon><n-icon><trash-outline /></n-icon></template>
              </n-button>
            </n-grid-item>
          </n-grid>

          <div v-if="session.start_time" class="session-preview">
             <n-tag size="small" :bordered="false" type="info">{{ session.start_time.substring(0,5) }} - {{ session.end_time.substring(0,5) }}</n-tag>
             <n-tag size="small" :bordered="false" type="warning">{{ session.location }}</n-tag>
          </div>
        </div>

        <n-button dashed block @click="addSessionSlot">+ Tambah Sesi Lainnya</n-button>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">Simpan Jadwal</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { 
  NCard, NDataTable, NButton, NIcon, NSpace, NTag, NModal, 
  NSelect, NFormItem, NGrid, NGridItem, NAlert, NPopconfirm, NDatePicker, useMessage 
} from 'naive-ui'
import { TimeOutline, LocationOutline, CreateOutline, TrashOutline, CalendarOutline } from '@vicons/ionicons5'
import { useCompetitionsStore } from '@/stores/competitions.js'
import { supabase } from '@/lib/supabase.js'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const compStore = useCompetitionsStore()
const message = useMessage()
const showEditModal = ref(false)
const editingItem = ref(null)
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
    label: `${s.name} | ${s.location} (${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)})`,
    value: s.id
  }))
)

const columns = [
  { title: 'Nama Lomba', key: 'name', minWidth: 150, sorter: 'default' },
  { 
    title: 'Gender', 
    key: 'gender', 
    width: 80,
    render: (row) => h(NTag, { size: 'small', type: row.gender === 'male' || row.gender === 'putra' ? 'info' : 'error', ghost: true }, { default: () => row.gender?.toUpperCase() })
  },
  { title: 'Jenjang', key: 'level', width: 90 },
  { 
    title: 'Waktu & Tanggal', 
    key: 'time',
    render: (row) => {
      const sch = row.schedules || []
      if (sch.length === 0) return h('span', { style: 'opacity: 0.4' }, '-')
      return h(NSpace, { vertical: true, size: 4 }, {
        default: () => sch.map(s => h('div', { class: 'schedule-cell' }, [
          h('div', { class: 'text-bold' }, [
            h(NIcon, { component: CalendarOutline, size: 12, style: 'margin-right: 4px' }),
            h('span', s.date ? format(new Date(s.date), 'dd MMM yyyy', { locale: id }) : '-')
          ]),
          h('div', { class: 'text-tiny' }, [
            h(NIcon, { component: TimeOutline, size: 12, style: 'margin-right: 4px' }),
            h('span', `${s.start_time?.substring(0, 5)} - ${s.end_time?.substring(0, 5)}`)
          ])
        ]))
      })
    }
  },
  { 
    title: 'Tempat', 
    key: 'location',
    render: (row) => {
      const sch = row.schedules || []
      if (sch.length === 0) return h('span', { style: 'opacity: 0.4' }, '-')
      return h(NSpace, { vertical: true, size: 2 }, {
        default: () => sch.map(s => h('div', { class: 'text-small' }, [
          h(NIcon, { component: LocationOutline, size: 12, style: 'margin-right: 4px' }),
          h('span', s.location)
        ]))
      })
    }
  },
  {
    title: 'Aksi',
    key: 'actions',
    width: 100,
    render: (row) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'small', quaternary: true, onClick: () => openEdit(row) }, { icon: () => h(NIcon, { component: CreateOutline }) }),
        h(NPopconfirm, { onPositiveClick: () => handleClear(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { icon: () => h(NIcon, { component: TrashOutline }) }),
          default: () => 'Kosongkan jadwal?'
        })
      ]
    })
  }
]

function openEdit(row) {
  editingItem.value = row
  const raw = row.schedules || []
  scheduleList.value = raw.map(s => ({
    ...s,
    date: s.date ? new Date(s.date).getTime() : null
  }))
  if (scheduleList.value.length === 0) addSessionSlot()
  showEditModal.value = true
}

function addSessionSlot() {
  scheduleList.value.push({ master_session_id: null, label: '', location: '', date: null, start_time: null, end_time: null })
}

function handleSessionSelect(index, sessionId) {
  const master = masterSessions.value.find(s => s.id === sessionId)
  if (master) {
    scheduleList.value[index].start_time = master.start_time
    scheduleList.value[index].end_time = master.end_time
    scheduleList.value[index].location = master.location
    scheduleList.value[index].label = master.name
  }
}

async function handleSave() {
  submitting.value = true
  try {
    const payload = scheduleList.value.map(s => ({
      ...s,
      date: s.date ? new Date(s.date).toISOString() : null
    }))
    await compStore.update(editingItem.value.id, { schedules: payload }, editingItem.value.criteria)
    message.success('Jadwal diperbarui')
    showEditModal.value = false
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}

async function handleClear(row) {
  try {
    await compStore.update(row.id, { schedules: [] }, row.criteria)
    message.success('Jadwal dikosongkan')
  } catch (e) {
    message.error(e.message)
  }
}
</script>

<style scoped>
.text-bold { font-weight: 700; font-size: 13px; display: flex; align-items: center; }
.text-tiny { font-size: 11px; opacity: 0.7; display: flex; align-items: center; }
.text-small { font-size: 12px; display: flex; align-items: center; }
.session-edit-box {
  padding: 12px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
}
.session-preview {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.schedule-cell {
  background: var(--bg-surface);
  padding: 4px 8px;
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}
</style>

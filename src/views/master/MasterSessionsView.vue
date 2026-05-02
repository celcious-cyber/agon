<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Atur Sesi & Lokasi</h1>
        <p class="page-subtitle">Buat daftar paket waktu dan lokasi (template) untuk digunakan di jadwal lomba</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Sesi Baru
        </n-button>
      </div>
    </div>

    <n-card class="content-card">
      <n-data-table 
        :columns="columns" 
        :data="items" 
        :loading="loading"
      />
    </n-card>

    <n-modal v-model:show="showModal" preset="card" :title="editingId ? 'Edit Sesi' : 'Tambah Sesi Baru'" style="width: 500px">
      <n-form label-placement="top">
        <n-form-item label="Nama Sesi (Misal: Sesi 1 / Sesi Pagi)" required>
          <n-input v-model:value="form.name" placeholder="Contoh: Sesi 1" />
        </n-form-item>
        
        <n-form-item label="Lokasi / Venue" required>
          <n-input v-model:value="form.location" placeholder="Contoh: Gedung Serbaguna Lt. 1" />
        </n-form-item>

        <n-grid :cols="2" x-gap="12">
          <n-grid-item>
            <n-form-item label="Jam Mulai" required>
              <n-time-picker v-model:formatted-value="form.start_time" value-format="HH:mm:ss" format="HH:mm" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="Jam Selesai" required>
              <n-time-picker v-model:formatted-value="form.end_time" value-format="HH:mm:ss" format="HH:mm" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">Simpan Sesi</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { 
  NButton, NIcon, NCard, NDataTable, NModal, NForm, NFormItem, 
  NInput, NTimePicker, NSpace, NGrid, NGridItem, NPopconfirm, useMessage 
} from 'naive-ui'
import { AddOutline, TrashOutline, CreateOutline, TimeOutline, LocationOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'

const message = useMessage()
const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const submitting = ref(false)
const editingId = ref(null)
const form = ref({ name: '', location: '', start_time: '08:00:00', end_time: '10:00:00' })

onMounted(fetchData)

async function fetchData() {
  loading.value = true
  const { data, error } = await supabase.from('master_sessions').select('*').order('start_time')
  if (!error) items.value = data
  loading.value = false
}

const columns = [
  { title: 'Nama Sesi', key: 'name', minWidth: 150 },
  { 
    title: 'Lokasi', 
    key: 'location',
    render: (row) => h(NSpace, { align: 'center', size: 'small' }, { default: () => [
      h(NIcon, { component: LocationOutline, depth: 3 }),
      h('span', row.location || '-')
    ]})
  },
  { 
    title: 'Waktu', 
    key: 'time',
    render: (row) => h(NSpace, { align: 'center', size: 'small' }, { default: () => [
      h(NIcon, { component: TimeOutline, depth: 3 }),
      h('span', `${row.start_time.substring(0, 5)} - ${row.end_time.substring(0, 5)}`)
    ]})
  },
  {
    title: 'Aksi',
    key: 'actions',
    width: 150,
    render: (row) => h(NSpace, null, { default: () => [
      h(NButton, { size: 'small', quaternary: true, onClick: () => openEditModal(row) }, { icon: () => h(NIcon, { component: CreateOutline }) }),
      h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, { 
        trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { icon: () => h(NIcon, { component: TrashOutline }) }),
        default: () => 'Hapus sesi ini?'
      })
    ]})
  }
]

function openAddModal() {
  editingId.value = null
  form.value = { name: '', location: '', start_time: '08:00:00', end_time: '10:00:00' }
  showModal.value = true
}

function openEditModal(row) {
  editingId.value = row.id
  form.value = { name: row.name, location: row.location, start_time: row.start_time, end_time: row.end_time }
  showModal.value = true
}

async function handleSave() {
  submitting.value = true
  try {
    if (editingId.value) {
      await supabase.from('master_sessions').update(form.value).eq('id', editingId.value)
      message.success('Sesi diperbarui')
    } else {
      await supabase.from('master_sessions').insert(form.value)
      message.success('Sesi ditambahkan')
    }
    showModal.value = false
    fetchData()
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  await supabase.from('master_sessions').delete().eq('id', id)
  fetchData()
}
</script>

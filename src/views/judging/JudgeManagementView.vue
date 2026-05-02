<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Daftar Juri</h1>
        <p class="page-subtitle">Kelola database personil juri dan hubungkan dengan akun login mereka</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Juri
        </n-button>
      </div>
    </div>

    <!-- Alert Error untuk Debugging -->
    <n-alert v-if="fetchError" type="error" title="Gagal Memuat Data" closable @close="fetchError = null" style="margin-bottom: 20px">
      {{ fetchError }}
      <template #header-extra>
        <n-button size="tiny" quaternary @click="fetchData">Coba Lagi</n-button>
      </template>
    </n-alert>

    <n-card class="content-card">
      <n-data-table 
        :columns="columns" 
        :data="items" 
        :loading="loading"
      />
    </n-card>

    <n-modal v-model:show="showModal" preset="card" :title="editingId ? 'Edit Data Juri' : 'Tambah Juri Baru'" style="width: 500px">
      <n-form label-placement="top">
        <n-form-item label="Nama Lengkap" required>
          <n-input v-model:value="form.name" placeholder="Masukkan nama lengkap juri..." />
        </n-form-item>
        <n-form-item label="NIP (Opsional)">
          <n-input v-model:value="form.nip" placeholder="Contoh: 19850101 201001 1 001" />
        </n-form-item>
        <n-form-item label="Instansi Asal" required>
          <n-input v-model:value="form.address" placeholder="Masukkan nama sekolah atau organisasi..." />
        </n-form-item>
        
        <n-divider title-placement="left">Akses Login</n-divider>
        
        <n-form-item label="Hubungkan ke Akun Login">
          <n-select 
            v-model:value="form.user_id" 
            :options="userOptions" 
            placeholder="Pilih akun user untuk login juri..."
            clearable
            filterable
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">Simpan Data</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { 
  NButton, NIcon, NCard, NDataTable, NModal, NForm, NFormItem, 
  NInput, NSpace, NPopconfirm, NSelect, NDivider, NAlert, NTag, useMessage 
} from 'naive-ui'
import { AddOutline, TrashOutline, CreateOutline, PersonOutline, LocationOutline, FingerPrintOutline, ShieldCheckmarkOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'

const message = useMessage()
const items = ref([])
const users = ref([])
const loading = ref(false)
const fetchError = ref(null)
const showModal = ref(false)
const submitting = ref(false)
const editingId = ref(null)
const form = ref({ name: '', nip: '', address: '', user_id: null })

onMounted(() => {
  fetchData()
  fetchUsers()
})

async function fetchData() {
  loading.value = true
  fetchError.value = null
  try {
    const { data, error } = await supabase
      .from('judges')
      .select(`
        *,
        profiles:user_id(full_name)
      `)
      .order('name')
    
    if (error) throw error
    items.value = data || []
  } catch (e) {
    console.error('Fetch error:', e)
    fetchError.value = e.message
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  const { data } = await supabase.from('profiles').select('id, full_name').order('full_name')
  users.value = data || []
}

const userOptions = computed(() => 
  users.value.map(u => ({ label: u.full_name || 'Tanpa Nama', value: u.id }))
)

const columns = [
  { 
    title: 'Nama & NIP', 
    key: 'name',
    render: (row) => h(NSpace, { vertical: true, size: 2 }, { default: () => [
      h(NSpace, { align: 'center', size: 'small' }, { default: () => [
        h(NIcon, { component: PersonOutline, depth: 3 }),
        h('span', { style: 'font-weight: 600' }, row.name)
      ]}),
      row.nip ? h(NSpace, { align: 'center', size: 'small' }, { default: () => [
        h(NIcon, { component: FingerPrintOutline, size: 12, depth: 3 }),
        h('span', { style: 'font-size: 11px; opacity: 0.6' }, row.nip)
      ]}) : null
    ]})
  },
  { title: 'Instansi', key: 'address' },
  { 
    title: 'Status Login', 
    key: 'user_id',
    render: (row) => row.user_id 
      ? h(NTag, { type: 'success', size: 'small', ghost: true }, { 
          default: () => row.profiles?.full_name || 'Terhubung',
          icon: () => h(NIcon, { component: ShieldCheckmarkOutline })
        })
      : h(NTag, { type: 'default', size: 'small', disabled: true }, { default: () => 'Belum Terhubung' })
  },
  {
    title: 'Aksi',
    key: 'actions',
    width: 120,
    render: (row) => h(NSpace, null, { default: () => [
      h(NButton, { size: 'small', quaternary: true, onClick: () => openEditModal(row) }, { icon: () => h(NIcon, { component: CreateOutline }) }),
      h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, { 
        trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { icon: () => h(NIcon, { component: TrashOutline }) }),
        default: () => 'Hapus data juri ini?'
      })
    ]})
  }
]

function openAddModal() {
  editingId.value = null
  form.value = { name: '', nip: '', address: '', user_id: null }
  showModal.value = true
}

function openEditModal(row) {
  editingId.value = row.id
  form.value = { name: row.name, nip: row.nip, address: row.address, user_id: row.user_id }
  showModal.value = true
}

async function handleSave() {
  if (!form.value.name) return message.error('Nama wajib diisi')
  
  submitting.value = true
  try {
    if (editingId.value) {
      const { error } = await supabase.from('judges').update(form.value).eq('id', editingId.value)
      if (error) throw error
      message.success('Data juri diperbarui')
    } else {
      const { error } = await supabase.from('judges').insert(form.value)
      if (error) throw error
      message.success('Juri berhasil didaftarkan')
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
  const { error } = await supabase.from('judges').delete().eq('id', id)
  if (error) message.error(error.message)
  else {
    message.success('Data juri dihapus')
    fetchData()
  }
}
</script>

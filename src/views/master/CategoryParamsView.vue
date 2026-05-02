<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Pusat Referensi Kategori</h1>
        <p class="page-subtitle">Kelola daftar pilihan yang akan muncul pada form Pendaftaran dan Pembuatan Lomba</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal(activeTab)">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah {{ getActiveTabLabel }}
        </n-button>
      </div>
    </div>

    <n-card class="content-card">
      <n-tabs v-model:value="activeTab" type="line" animated size="large">
        <n-tab-pane v-for="type in types" :key="type.value" :name="type.value" :tab="type.label">
          <div class="tab-content">
            <n-alert :show-icon="false" type="info" class="mb-6">
              {{ type.desc }} Pilihan yang Anda buat di sini akan otomatis muncul sebagai opsi di menu lainnya.
            </n-alert>

            <div v-if="loading" style="padding: 40px; text-align: center;"><n-spin /></div>
            
            <n-data-table 
              v-else
              :columns="columns" 
              :data="getParamsByType(type.value)" 
              :pagination="{ pageSize: 10 }"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- Modal Form -->
    <n-modal v-model:show="showModal" preset="card" :title="isEdit ? 'Ubah Pilihan' : 'Tambah Pilihan Baru'" style="width: 450px">
      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top">
        <n-form-item label="Kategori" path="type">
          <n-select v-model:value="formValue.type" :options="typeOptions" disabled />
        </n-form-item>
        <n-form-item label="Nama Tampilan (Label)" path="label">
          <n-input v-model:value="formValue.label" placeholder="Contoh: SMA Negeri, Putra, dll" />
          <template #feedback>Ini adalah nama yang akan dilihat oleh user di pilihan menu.</template>
        </n-form-item>
        <n-form-item label="Kode Sistem (Value)" path="value">
          <n-input v-model:value="formValue.value" placeholder="Contoh: sma, male, dll" />
          <template #feedback>Gunakan huruf kecil tanpa spasi. Ini digunakan untuk identitas sistem.</template>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">Simpan Perubahan</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { 
  NTabs, NTabPane, NCard, NDataTable, NButton, NIcon, NModal, 
  NForm, NFormItem, NInput, NSelect, NAlert, NSpin, NSpace, NPopconfirm, useMessage 
} from 'naive-ui'
import { AddOutline, TrashOutline, CreateOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'

const message = useMessage()
const activeTab = ref('level')
const params = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref(null)

const types = [
  { value: 'level', label: 'Jenjang Pendidikan', desc: 'Menentukan tingkatan sekolah peserta.' },
  { value: 'gender', label: 'Gender / Kelamin', desc: 'Menentukan pengelompokan berdasarkan jenis kelamin.' },
  { value: 'scoring', label: 'Sistem Penilaian', desc: 'Menentukan metode penilaian dalam lomba.' }
]

const getActiveTabLabel = computed(() => types.find(t => t.value === activeTab.value)?.label || 'Item')
const typeOptions = types.map(t => ({ label: t.label, value: t.value }))

const columns = [
  { title: 'Nama Pilihan', key: 'label', width: '40%' },
  { title: 'Kode Sistem', key: 'value', width: '30%' },
  {
    title: 'Aksi',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => openEditModal(row) }, { icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) }),
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, { 
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
            default: () => 'Hapus pilihan ini?'
          })
        ]
      })
    }
  }
]

const formValue = ref({ type: 'level', label: '', value: '' })
const rules = {
  label: { required: true, message: 'Nama pilihan wajib diisi', trigger: 'blur' },
  value: { required: true, message: 'Kode sistem wajib diisi', trigger: 'blur' }
}

onMounted(fetchParams)

async function fetchParams() {
  loading.value = true
  try {
    const { data, error } = await supabase.from('category_params').select('*').order('label', { ascending: true })
    if (error) throw error
    params.value = data
  } catch (e) {
    message.error(e.message)
  } finally {
    loading.value = false
  }
}

function getParamsByType(type) {
  return params.value.filter(p => p.type === type)
}

function openAddModal(type) {
  isEdit.value = false
  editingId.value = null
  formValue.value = { type, label: '', value: '' }
  showModal.value = true
}

function openEditModal(param) {
  isEdit.value = true
  editingId.value = param.id
  formValue.value = { ...param }
  showModal.value = true
}

async function handleDelete(id) {
  try {
    const { error } = await supabase.from('category_params').delete().eq('id', id)
    if (error) throw error
    params.value = params.value.filter(p => p.id !== id)
    message.success('Berhasil dihapus')
  } catch (e) {
    message.error(e.message)
  }
}

async function handleSave() {
  submitting.value = true
  try {
    if (isEdit.value) {
      const { error } = await supabase.from('category_params').update(formValue.value).eq('id', editingId.value)
      if (error) throw error
      const idx = params.value.findIndex(p => p.id === editingId.value)
      if (idx !== -1) params.value[idx] = { ...params.value[idx], ...formValue.value }
      message.success('Berhasil diperbarui')
    } else {
      const { data, error } = await supabase.from('category_params').insert(formValue.value).select().single()
      if (error) throw error
      params.value.push(data)
      message.success('Berhasil ditambahkan')
    }
    showModal.value = false
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.mb-6 { margin-bottom: 24px; }
.tab-content { padding-top: 10px; }
</style>

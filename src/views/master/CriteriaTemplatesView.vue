<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Bank Kriteria Penilaian</h1>
        <p class="page-subtitle">Daftar seluruh kriteria penilaian yang bisa Anda pilih saat membuat lomba</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Kriteria Baru
        </n-button>
      </div>
    </div>

    <n-card class="content-card">
      <n-space vertical :size="20">
        <n-input
          v-model:value="searchQuery"
          placeholder="Cari kriteria..."
          clearable
          size="large"
        >
          <template #prefix><n-icon><search-outline /></n-icon></template>
        </n-input>

        <n-data-table
          :columns="columns"
          :data="filteredItems"
          :loading="loading"
          :pagination="{ pageSize: 12 }"
        />
      </n-space>
    </n-card>

    <!-- Modal Form -->
    <n-modal v-model:show="showModal" preset="card" :title="isEdit ? 'Ubah Kriteria' : 'Tambah Kriteria Baru'" style="width: 450px">
      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top">
        <n-form-item label="Nama Kriteria" path="name">
          <n-input v-model:value="formValue.name" placeholder="Contoh: Tajwid, Artikulasi, Power" />
        </n-form-item>
        <n-grid :cols="2" x-gap="12">
          <n-grid-item>
            <n-form-item label="Skor Minimal" path="min_score">
              <n-input-number v-model:value="formValue.min_score" :min="0" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="Skor Maksimal" path="max_score">
              <n-input-number v-model:value="formValue.max_score" :min="1" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="Bobot Default (%)" path="weight">
          <n-input-number v-model:value="formValue.weight" :min="1" :max="100" style="width: 100%" />
          <template #feedback>Ini adalah bobot awal, Anda bisa mengubahnya nanti saat membuat lomba.</template>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">Simpan</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { 
  NButton, NIcon, NCard, NInput, NDataTable, NSpace, NModal, 
  NForm, NFormItem, NInputNumber, NPopconfirm, useMessage, NTag 
} from 'naive-ui'
import { AddOutline, SearchOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'

const message = useMessage()
const items = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref(null)

const formValue = ref({ name: '', min_score: 0, max_score: 100, weight: 10 })
const rules = { name: { required: true, message: 'Nama kriteria wajib diisi', trigger: 'blur' } }

onMounted(fetchData)

async function fetchData() {
  loading.value = true
  try {
    const { data, error } = await supabase.from('master_criteria').select('*').order('name')
    if (error) throw error
    items.value = data
  } catch (e) {
    message.error(e.message)
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  return items.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const columns = [
  { title: 'Nama Kriteria', key: 'name', sorter: 'default' },
  { title: 'Min Skor', key: 'min_score', align: 'center' },
  { title: 'Max Skor', key: 'max_score', align: 'center' },
  { title: 'Bobot Default', key: 'weight', align: 'center', render: (row) => h(NTag, { size: 'small', type: 'info' }, { default: () => `${row.weight}%` }) },
  {
    title: 'Aksi',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, {}, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => handleEdit(row) }, { icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) }),
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, { 
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
            default: () => 'Hapus kriteria?'
          })
        ]
      })
    }
  }
]

function openAddModal() { isEdit.value = false; editingId.value = null; formValue.value = { name: '', min_score: 0, max_score: 100, weight: 10 }; showModal.value = true; }
function handleEdit(row) { isEdit.value = true; editingId.value = row.id; formValue.value = { ...row }; showModal.value = true; }

async function handleDelete(id) {
  try {
    const { error } = await supabase.from('master_criteria').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter(i => i.id !== id)
    message.success('Dihapus')
  } catch (e) {
    message.error(e.message)
  }
}

async function handleSave() {
  submitting.value = true
  try {
    if (isEdit.value) {
      const { error } = await supabase.from('master_criteria').update(formValue.value).eq('id', editingId.value)
      if (error) throw error
      message.success('Diperbarui')
    } else {
      const { data, error } = await supabase.from('master_criteria').insert(formValue.value).select().single()
      if (error) throw error
      items.value.push(data)
      message.success('Ditambahkan')
    }
    showModal.value = false; fetchData()
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}
</script>

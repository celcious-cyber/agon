<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Institusi</h1>
        <p class="page-subtitle">Kelola data institusi peserta (sekolah, klub, atau organisasi)</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Institusi
        </n-button>
      </div>
    </div>

    <n-card class="content-card">
      <n-space vertical :size="20">
        <n-input
          v-model:value="searchQuery"
          placeholder="Cari nama institusi..."
          clearable
          size="large"
        >
          <template #prefix><n-icon><search-outline /></n-icon></template>
        </n-input>

        <n-data-table
          :columns="columns"
          :data="filteredItems"
          :loading="store.loading"
          :pagination="{ pageSize: 10 }"
          remote
        />
      </n-space>
    </n-card>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="isEdit ? 'Edit Institusi' : 'Tambah Institusi'"
      style="width: 480px"
      :segmented="{ content: 'soft' }"
    >
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="Nama Institusi" path="name">
          <n-input v-model:value="formValue.name" placeholder="Contoh: SMA Negeri 1 Jakarta" />
        </n-form-item>
        <n-form-item label="Kontak Pendamping" path="contact">
          <n-input v-model:value="formValue.contact" placeholder="Nama guru atau pelatih" />
        </n-form-item>
        <n-form-item label="No. Telepon" path="phone">
          <n-input v-model:value="formValue.phone" placeholder="Contoh: 0812..." />
        </n-form-item>
        <n-form-item label="Alamat Institusi" path="address">
          <n-input
            v-model:value="formValue.address"
            type="textarea"
            placeholder="Masukkan alamat lengkap..."
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">
            Simpan
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { 
  NButton, NIcon, NCard, NInput, NDataTable, NSpace, 
  NModal, NForm, NFormItem, useMessage, NPopconfirm 
} from 'naive-ui'
import { AddOutline, SearchOutline } from '@vicons/ionicons5'
import { useInstitutionsStore } from '@/stores/institutions.js'

const store = useInstitutionsStore()
const message = useMessage()
const formRef = ref(null)

const searchQuery = ref('')
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref(null)

const formValue = ref({
  name: '',
  contact: '',
  phone: '',
  address: ''
})

const rules = {
  name: { required: true, message: 'Nama institusi wajib diisi', trigger: 'blur' }
}

onMounted(() => {
  store.fetch()
})

const filteredItems = computed(() => {
  if (!searchQuery.value) return store.items
  return store.items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const columns = [
  { title: 'Nama', key: 'name', sorter: 'default' },
  { title: 'Kontak', key: 'contact' },
  { title: 'No. Telepon', key: 'phone' },
  { title: 'Alamat', key: 'address', ellipsis: true },
  {
    title: 'Aksi',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, {}, {
        default: () => [
          h(
            NButton,
            { size: 'small', onClick: () => handleEdit(row) },
            { default: () => 'Edit' }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id) },
            {
              trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => 'Hapus' }),
              default: () => 'Yakin hapus institusi ini?'
            }
          )
        ]
      })
    }
  }
]

function openAddModal() {
  isEdit.value = false
  editingId.value = null
  formValue.value = { name: '', contact: '', phone: '', address: '' }
  showModal.value = true
}

function handleEdit(row) {
  isEdit.value = true
  editingId.value = row.id
  formValue.value = { ...row }
  showModal.value = true
}

async function handleDelete(id) {
  try {
    await store.remove(id)
    message.success('Institusi berhasil dihapus')
  } catch (e) {
    message.error(e.message || 'Gagal menghapus institusi')
  }
}

async function handleSave() {
  formRef.value?.validate(async (errors) => {
    if (errors) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await store.update(editingId.value, formValue.value)
        message.success('Institusi berhasil diperbarui')
      } else {
        await store.create(formValue.value)
        message.success('Institusi berhasil ditambahkan')
      }
      showModal.value = false
    } catch (e) {
      message.error(e.message || 'Terjadi kesalahan')
    } finally {
      submitting.value = false
    }
  })
}
</script>

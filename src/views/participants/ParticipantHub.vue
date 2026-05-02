<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Kepesertaan</h1>
        <p class="page-subtitle">Manajemen pendaftaran peserta dan distribusi mata lomba</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Peserta
        </n-button>
      </div>
    </div>

    <n-card class="content-card mb-6">
      <n-grid :cols="4" x-gap="12">
        <n-grid-item><n-select v-model:value="filters.institution_id" :options="institutionOptions" placeholder="Filter Institusi" clearable @update:value="handleFilter" /></n-grid-item>
        <n-grid-item><n-select v-model:value="filters.competition_id" :options="competitionOptions" placeholder="Filter Lomba" clearable @update:value="handleFilter" /></n-grid-item>
        <n-grid-item><n-select v-model:value="filters.gender" :options="[{label: 'Putra', value: 'male'}, {label: 'Putri', value: 'female'}]" placeholder="Filter Gender" clearable @update:value="handleFilter" /></n-grid-item>
        <n-grid-item><n-button block @click="resetFilters">Reset Filter</n-button></n-grid-item>
      </n-grid>
    </n-card>

    <n-card class="content-card">
      <n-data-table :columns="columns" :data="partStore.items" :loading="partStore.loading" :pagination="{ pageSize: 15 }" />
    </n-card>

    <n-modal v-model:show="showModal" preset="card" title="Pendaftaran Peserta" style="width: 650px" :segmented="{ content: 'soft' }">
      <n-space vertical :size="24">
        <div class="form-section">
          <h3 class="section-title">1. Profil Peserta</h3>
          <n-form label-placement="top">
            <n-grid :cols="2" x-gap="12">
              <n-grid-item :span="2"><n-form-item label="Nama Lengkap" required><n-input v-model:value="form.name" /></n-form-item></n-grid-item>
              <n-grid-item><n-form-item label="Gender" required><n-select v-model:value="form.gender" :options="[{label:'Putra', value:'male'}, {label:'Putri', value:'female'}]" /></n-form-item></n-grid-item>
              <n-grid-item><n-form-item label="Kelas"><n-input v-model:value="form.grade" /></n-form-item></n-grid-item>
            </n-grid>
          </n-form>
        </div>
        <div class="form-section">
          <h3 class="section-title">2. Asal Institusi</h3>
          <n-form-item label="Institusi"><n-select v-model:value="form.institution_id" :options="institutionOptions" filterable /></n-form-item>
        </div>
        <div class="form-section">
          <h3 class="section-title">3. Mata Lomba</h3>
          <n-form-item label="Lomba"><n-select v-model:value="selectedCompetitionIds" multiple :options="availableCompetitionOptions" :disabled="!form.gender" /></n-form-item>
        </div>
      </n-space>
      <template #footer><n-space justify="end"><n-button @click="showModal = false">Batal</n-button><n-button type="primary" :loading="submitting" @click="handleSave">Daftarkan Peserta</n-button></n-space></template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, reactive } from 'vue'
import { NButton, NIcon, NCard, NDataTable, NGrid, NGridItem, NSelect, NModal, NForm, NFormItem, NInput, NSpace, NTag, useMessage, NPopconfirm } from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import { useParticipantsStore } from '@/stores/participants.js'
import { useInstitutionsStore } from '@/stores/institutions.js'
import { useCompetitionsStore } from '@/stores/competitions.js'

const partStore = useParticipantsStore()
const instStore = useInstitutionsStore()
const compStore = useCompetitionsStore()
const message = useMessage()
const showModal = ref(false)
const submitting = ref(false)
const selectedCompetitionIds = ref([])
const filters = reactive({ institution_id: null, competition_id: null, gender: null })
const form = ref({ name: '', gender: null, grade: '', institution_id: null })

onMounted(() => { partStore.fetch(); instStore.fetch(); compStore.fetch(); })
const institutionOptions = computed(() => instStore.items.map(i => ({ label: i.name, value: i.id })))
const competitionOptions = computed(() => compStore.items.map(c => ({ label: c.name, value: c.id })))
const availableCompetitionOptions = computed(() => {
  if (!form.value.gender) return []
  
  // Ambil kode gender dari form (biasanya 'male' atau 'female')
  const userGender = form.value.gender
  
  return compStore.items.map(c => {
    // Cek kesesuaian: 
    // 1. Lomba 'mixed' (Campuran) bisa diikuti siapa saja.
    // 2. Jika tidak mixed, gender lomba harus sama dengan gender peserta.
    const isCompatible = c.gender === 'mixed' || c.gender === 'campuran' || c.gender === userGender || 
                        (userGender === 'male' && c.gender === 'putra') || 
                        (userGender === 'female' && c.gender === 'putri')

    return { 
      label: `${c.name} (${c.gender.toUpperCase()})`, 
      value: c.id, 
      disabled: !isCompatible 
    }
  })
})

const columns = [
  { title: 'Nama Peserta', key: 'name', sorter: 'default' },
  { title: 'Gender', key: 'gender', render: (row) => h(NTag, { size: 'small', type: row.gender === 'male' ? 'info' : 'error' }, { default: () => row.gender === 'male' ? 'L' : 'P' }) },
  { title: 'Institusi', key: 'institutions.name' },
  { title: 'Lomba', key: 'registrations', render: (row) => h(NSpace, { size: 'small' }, { default: () => row.registrations.map(r => h(NTag, { size: 'tiny', type: 'primary' }, { default: () => r.competitions.name })) }) },
  { title: 'Aksi', key: 'actions', render: (row) => h(NPopconfirm, { onPositiveClick: () => partStore.remove(row.id) }, { trigger: () => h(NButton, { size: 'small', type: 'error', ghost: true }, { default: () => h(NIcon, null, { default: () => h(TrashOutline) }) }), default: () => 'Hapus?' }) }
]

function handleFilter() { partStore.fetch(filters) }
function resetFilters() { Object.assign(filters, { institution_id: null, competition_id: null, gender: null }); partStore.fetch() }
function openAddModal() { form.value = { name: '', gender: null, grade: '', institution_id: null }; selectedCompetitionIds.value = []; showModal.value = true; }
async function handleSave() { submitting.value = true; try { await partStore.create(form.value, selectedCompetitionIds.value); message.success('Peserta didaftarkan'); showModal.value = false; } catch (e) { message.error(e.message); } finally { submitting.value = false; } }
</script>

<style scoped> .mb-6 { margin-bottom: 24px; } .section-title { font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 16px; } </style>

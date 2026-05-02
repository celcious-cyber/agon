<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Manajemen Peserta</h1>
        <p class="page-subtitle">Manajemen pendaftaran peserta individu maupun regu/tim</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddModal">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Peserta
        </n-button>
      </div>
    </div>

    <!-- Filter Bar -->
    <n-card class="content-card mb-6">
      <n-grid :cols="4" x-gap="12" responsive="screen">
        <n-grid-item><n-select v-model:value="filters.institution_id" :options="institutionOptions" placeholder="Filter Institusi" clearable @update:value="handleFilter" /></n-grid-item>
        <n-grid-item><n-select v-model:value="filters.competition_id" :options="competitionOptions" placeholder="Filter Lomba" clearable @update:value="handleFilter" /></n-grid-item>
        <n-grid-item><n-select v-model:value="filters.gender" :options="genderOptions" placeholder="Filter Gender" clearable @update:value="handleFilter" /></n-grid-item>
        <n-grid-item><n-button block @click="resetFilters">Reset Filter</n-button></n-grid-item>
      </n-grid>
    </n-card>

    <n-card class="content-card">
      <n-data-table :columns="columns" :data="partStore.items" :loading="partStore.loading" :pagination="{ pageSize: 15 }" />
    </n-card>

    <!-- Modal Pendaftaran -->
    <n-modal v-model:show="showModal" preset="card" :title="isRegu ? 'Pendaftaran Regu / Tim' : 'Pendaftaran Individu'" style="width: 800px" :segmented="{ content: 'soft' }">
      <n-space vertical :size="24">
        <!-- LANGKAH 1: PILIH LOMBA -->
        <div class="form-section highlight-section">
          <h3 class="section-title">1. Pilih Mata Lomba</h3>
          <n-form label-placement="top">
            <n-form-item label="Lomba yang Diikuti" required>
              <n-select 
                v-model:value="selectedCompetitionIds" 
                multiple 
                :options="availableCompetitionOptions" 
                placeholder="Pilih satu atau lebih lomba..."
                filterable
                @update:value="handleCompetitionSelection"
              />
            </n-form-item>
          </n-form>
        </div>

        <!-- LANGKAH 2: PROFIL -->
        <div v-if="selectedCompetitionIds.length > 0" class="form-section">
          <h3 class="section-title">2. Profil {{ isRegu ? 'Regu' : 'Peserta' }}</h3>
          <n-form label-placement="top">
            
            <!-- JIKA INDIVIDU: Nama, Kelas, Gender Satu Baris -->
            <div v-if="!isRegu">
              <n-grid :cols="12" x-gap="12" y-gap="12">
                <n-grid-item :span="12">
                  <n-form-item label="Asal Sekolah / Institusi" required>
                    <n-select v-model:value="form.institution_id" :options="institutionOptions" filterable placeholder="Pilih Institusi" />
                  </n-form-item>
                </n-grid-item>
                
                <n-grid-item :span="6">
                  <n-form-item label="Nama Peserta" required>
                    <n-input v-model:value="form.name" placeholder="Nama Lengkap" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="3">
                  <n-form-item label="Kelas">
                    <n-input v-model:value="form.grade" placeholder="7A" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="3">
                  <n-form-item label="Gender" required>
                    <n-select v-model:value="form.gender" :options="genderOptions" placeholder="L/P" />
                  </n-form-item>
                </n-grid-item>
              </n-grid>
            </div>

            <!-- JIKA REGU: Nama Regu - Instansi Baris 1, Kelas - Gender Baris 2 -->
            <div v-else>
              <n-grid :cols="12" x-gap="12" y-gap="12">
                <n-grid-item :span="6">
                  <n-form-item label="Nama Regu / Tim" required>
                    <n-input v-model:value="form.name" placeholder="Nama Regu" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="6">
                  <n-form-item label="Asal Sekolah / Institusi" required>
                    <n-select v-model:value="form.institution_id" :options="institutionOptions" filterable placeholder="Pilih Institusi" />
                  </n-form-item>
                </n-grid-item>

                <n-grid-item :span="6">
                  <n-form-item label="Kelas / Grade (Tim)">
                    <n-input v-model:value="form.grade" placeholder="Contoh: 7A" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="6">
                  <n-form-item label="Gender Dominan" required>
                    <n-select v-model:value="form.gender" :options="genderOptions" placeholder="Pilih Gender" />
                  </n-form-item>
                </n-grid-item>
              </n-grid>

              <div class="members-input-section">
                <n-divider title-placement="left">Daftar Anggota Regu (Nama Saja)</n-divider>
                <n-space vertical>
                  <div v-for="(member, idx) in form.members" :key="idx" class="member-input-row">
                    <n-input v-model:value="form.members[idx]" :placeholder="'Nama Anggota ' + (idx + 1)" style="flex:1" />
                    <n-button type="error" quaternary circle @click="form.members.splice(idx, 1)">
                      <template #icon><n-icon><trash-outline /></n-icon></template>
                    </n-button>
                  </div>
                  <n-button dashed block @click="form.members.push('')">+ Tambah Peserta Regu</n-button>
                </n-space>
              </div>
            </div>

          </n-form>
        </div>

        <n-alert v-else type="info">
          Silakan pilih Mata Lomba terlebih dahulu untuk melanjutkan pengisian data peserta.
        </n-alert>
      </n-space>
      
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" :disabled="selectedCompetitionIds.length === 0" @click="handleSave">
            Daftarkan Peserta
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, reactive, watch } from 'vue'
import { 
  NButton, NIcon, NCard, NDataTable, NGrid, NGridItem, NSelect, NModal, 
  NForm, NFormItem, NInput, NSpace, NTag, useMessage, NPopconfirm, NDivider, NTooltip, NAlert 
} from 'naive-ui'
import { AddOutline, TrashOutline, PeopleOutline } from '@vicons/ionicons5'
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

const form = reactive({ 
  name: '', 
  gender: null, 
  grade: '', 
  institution_id: null, 
  members: [] 
})

const genderOptions = [
  { label: 'Putra', value: 'male' },
  { label: 'Putri', value: 'female' }
]

const isRegu = computed(() => {
  return selectedCompetitionIds.value.some(id => {
    const comp = compStore.items.find(c => c.id === id)
    return comp?.is_group === true
  })
})

function handleCompetitionSelection(ids) {
  if (ids.length > 0) {
    const firstComp = compStore.items.find(c => c.id === ids[0])
    if (firstComp) {
      if (firstComp.gender === 'putra' || firstComp.gender === 'male') form.gender = 'male'
      if (firstComp.gender === 'putri' || firstComp.gender === 'female') form.gender = 'female'
    }
  }
}

watch(isRegu, (val) => {
  if (val && form.members.length === 0) {
    form.members = ['', '', '']
  } else if (!val) {
    form.members = []
  }
})

onMounted(() => { partStore.fetch(); instStore.fetch(); compStore.fetch(); })

const institutionOptions = computed(() => instStore.items.map(i => ({ label: i.name, value: i.id })))
const competitionOptions = computed(() => compStore.items.map(c => ({ label: c.name, value: c.id })))

const availableCompetitionOptions = computed(() => {
  return compStore.items.map(c => ({ 
    label: `${c.name} (${c.gender.toUpperCase()}) ${c.is_group ? '[REGU]' : '[INDIVIDU]'}`, 
    value: c.id
  }))
})

const columns = [
  { 
    title: 'Nama / Regu', 
    key: 'name', 
    render: (row) => h(NSpace, { vertical: true, size: 2 }, { default: () => [
      h('div', { style: 'font-weight: 700' }, row.name),
      row.members && row.members.length > 0 ? h(NTooltip, { trigger: 'hover' }, {
        trigger: () => h(NTag, { size: 'tiny', type: 'info', ghost: true }, { default: () => `${row.members.length} Anggota`, icon: () => h(NIcon, { component: PeopleOutline }) }),
        default: () => h('div', { style: 'padding: 4px' }, [
          h('div', { style: 'font-weight:bold; margin-bottom:4px' }, 'Daftar Anggota:'),
          ...row.members.map(m => h('div', { style: 'font-size:12px' }, 
            typeof m === 'string' ? m : m.name
          ))
        ])
      }) : null
    ]})
  },
  { title: 'Gender', key: 'gender', render: (row) => h(NTag, { size: 'small', type: row.gender === 'male' ? 'info' : 'error' }, { default: () => row.gender === 'male' ? 'L' : 'P' }) },
  { title: 'Institusi', key: 'institutions.name' },
  { title: 'Lomba', key: 'registrations', render: (row) => h(NSpace, { size: 'small' }, { default: () => row.registrations.map(r => h(NTag, { size: 'tiny', type: 'primary' }, { default: () => r.competitions.name })) }) },
  { title: 'Aksi', key: 'actions', render: (row) => h(NPopconfirm, { onPositiveClick: () => partStore.remove(row.id) }, { trigger: () => h(NButton, { size: 'small', type: 'error', ghost: true }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }), default: () => 'Hapus?' }) }
]

function handleFilter() { partStore.fetch(filters) }
function resetFilters() { Object.assign(filters, { institution_id: null, competition_id: null, gender: null }); partStore.fetch() }

function openAddModal() { 
  Object.assign(form, { name: '', gender: null, grade: '', institution_id: null, members: [] })
  selectedCompetitionIds.value = []
  showModal.value = true
}

async function handleSave() {
  if (!form.name) return message.error('Nama wajib diisi')
  if (!form.gender) return message.error('Gender wajib diisi')
  if (!form.institution_id) return message.error('Institusi wajib diisi')
  
  submitting.value = true
  try {
    const cleanedMembers = form.members.filter(m => {
      if (typeof m === 'string') return m.trim() !== ''
      return m.name && m.name.trim() !== ''
    })
    
    const finalForm = JSON.parse(JSON.stringify(form))
    finalForm.members = cleanedMembers
    
    await partStore.create(finalForm, selectedCompetitionIds.value)
    message.success('Peserta/Regu berhasil didaftarkan')
    showModal.value = false
    partStore.fetch()
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped> 
.mb-6 { margin-bottom: 24px; } 
.section-title { font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 16px; } 
.member-input-row { display: flex; gap: 8px; margin-bottom: 8px; }
.members-input-section { margin-top: 15px; padding: 15px; background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border); }
.highlight-section { 
  background: rgba(var(--primary-rgb, 100, 108, 255), 0.1); 
  padding: 20px; 
  border-radius: 16px; 
  border: 1px solid var(--primary); 
  margin-bottom: 20px; 
}
</style>

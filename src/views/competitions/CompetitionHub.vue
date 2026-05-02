<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Manajemen Lomba</h1>
        <p class="page-subtitle">Pusat kendali pembuatan dan pengaturan perlombaan</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="openAddWizard">
          <template #icon><n-icon><add-outline /></n-icon></template>
          Tambah Lomba
        </n-button>
      </div>
    </div>

    <n-card class="content-card">
      <n-data-table
        :columns="columns"
        :data="compStore.items"
        :loading="compStore.loading"
        :pagination="{ pageSize: 10 }"
      />
    </n-card>

    <!-- Wizard Modal -->
    <n-modal 
      v-model:show="showModal" 
      preset="card" 
      :title="isEdit ? 'Edit Lomba' : 'Tambah Lomba Baru'" 
      style="width: 700px" 
      :mask-closable="false" 
      :segmented="{ content: 'soft' }"
    >
      <n-steps :current="step" size="small" class="mb-8">
        <n-step title="Detail" />
        <n-step title="Parameter" />
        <n-step title="Sistem" />
        <n-step title="Kriteria" />
      </n-steps>
      
      <!-- Step 1: Detail -->
      <div v-if="step === 1" class="step-content">
        <n-form label-placement="top">
          <n-form-item label="Nama Mata Lomba" required><n-input v-model:value="form.name" placeholder="Tahfidz Juz 30" /></n-form-item>
          <n-grid :cols="2" x-gap="12">
            <n-grid-item><n-form-item label="Kuota (0 = Tanpa Batas)"><n-input-number v-model:value="form.quota" :min="0" style="width: 100%" /></n-form-item></n-grid-item>
            <n-grid-item><n-form-item label="Tipe Lomba"><n-select v-model:value="form.is_group" :options="[{label:'Individu', value:false}, {label:'Grup / Regu', value:true}]" /></n-form-item></n-grid-item>
          </n-grid>
        </n-form>
      </div>

      <!-- Step 2: Parameter -->
      <div v-if="step === 2" class="step-content">
        <n-form label-placement="top">
          <n-form-item label="Kategori Gender" required><n-select v-model:value="form.gender" :options="genderOptions" placeholder="Pilih Gender" /></n-form-item>
          <n-form-item label="Jenjang Pendidikan" required><n-select v-model:value="form.level" :options="levelOptions" placeholder="Pilih Jenjang" /></n-form-item>
        </n-form>
      </div>

      <!-- Step 3: Sistem -->
      <div v-if="step === 3" class="step-content">
        <n-form label-placement="top">
          <n-form-item label="Sistem Penilaian" required>
            <n-select v-model:value="form.scoring_type" :options="[{label:'Sistem Poin (Input Skor)', value:'point'}, {label:'Sistem Babak (Bagan / Bracket)', value:'bracket'}]" />
          </n-form-item>
          <n-alert type="info" :show-icon="false">
            {{ form.scoring_type === 'point' ? 'Sistem poin menggunakan akumulasi nilai dari juri berdasarkan kriteria.' : 'Sistem babak menggunakan bagan turnamen (Knockout).' }}
          </n-alert>
        </n-form>
      </div>

      <!-- Step 4: Kriteria -->
      <div v-if="step === 4" class="step-content">
        <div v-if="form.scoring_type === 'bracket'"><n-empty description="Sistem Bracket/Babak tidak memerlukan kriteria skor" /></div>
        <div v-else>
          <div class="bank-picker">
            <n-divider title-placement="left">Ambil dari Bank Kriteria</n-divider>
            <n-select 
              placeholder="Cari & Pilih kriteria dari Bank..." 
              filterable 
              :options="bankOptions" 
              @update:value="addFromBank"
              :value="null"
            />
          </div>

          <n-divider title-placement="left">Kriteria Penilaian Lomba</n-divider>
          <div v-if="criteriaItems.length === 0" style="padding: 20px; text-align:center; color: #666">Belum ada kriteria. Pilih dari bank di atas.</div>
          
          <div v-for="(item, index) in criteriaItems" :key="index" class="criteria-row">
            <n-grid :cols="12" x-gap="12" items-center>
              <n-grid-item span="5"><n-input v-model:value="item.name" placeholder="Nama Kriteria" /></n-grid-item>
              <n-grid-item span="2"><n-input-number v-model:value="item.min_score" placeholder="Min" /></n-grid-item>
              <n-grid-item span="2"><n-input-number v-model:value="item.max_score" placeholder="Max" /></n-grid-item>
              <n-grid-item span="2"><n-input-number v-model:value="item.weight" placeholder="Bobot %" /></n-grid-item>
              <n-grid-item span="1">
                <n-button type="error" quaternary circle @click="criteriaItems.splice(index, 1)">
                  <template #icon><n-icon><trash-outline /></n-icon></template>
                </n-button>
              </n-grid-item>
            </n-grid>
          </div>
          
          <n-button dashed block @click="criteriaItems.push({name:'', min_score:0, max_score:100, weight:10})" style="margin-top:12px">+ Tambah Kriteria Kustom</n-button>
          
          <div class="total-weight" :class="{ 'error': totalWeight !== 100 }">
             Total Bobot: <b>{{ totalWeight }}%</b> 
             <span v-if="totalWeight !== 100" class="weight-warn"> (Harus 100%)</span>
          </div>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button v-if="step > 1" @click="step--">Kembali</n-button>
          <n-button v-if="step < 4" type="primary" @click="step++">Lanjut</n-button>
          <n-button v-else type="primary" :loading="submitting" :disabled="totalWeight !== 100 && form.scoring_type === 'point'" @click="handleSave">
            {{ isEdit ? 'Update Lomba' : 'Simpan Lomba' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { 
  NButton, NIcon, NCard, NDataTable, NSteps, NStep, NModal, NForm, NFormItem, 
  NInput, NInputNumber, NSelect, NGrid, NGridItem, NSpace, NTag, NDivider, 
  NEmpty, NAlert, useMessage, NPopconfirm 
} from 'naive-ui'
import { AddOutline, TrashOutline, CreateOutline } from '@vicons/ionicons5'
import { useCompetitionsStore } from '@/stores/competitions.js'

const compStore = useCompetitionsStore()
const message = useMessage()
const showModal = ref(false)
const step = ref(1)
const isEdit = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const form = ref({ name: '', quota: 0, is_group: false, gender: null, level: null, scoring_type: 'point' })
const criteriaItems = ref([])

onMounted(() => { compStore.fetch(); compStore.fetchParams(); compStore.fetchMasterCriteria(); })

const genderOptions = computed(() => compStore.categoryParams.filter(p => p.type === 'gender').map(p => ({ label: p.label, value: p.value })))
const levelOptions = computed(() => compStore.categoryParams.filter(p => p.type === 'level').map(p => ({ label: p.label, value: p.value })))
const bankOptions = computed(() => compStore.masterCriteria.map(c => ({ label: `${c.name} (${c.min_score}-${c.max_score})`, value: c.id })))
const totalWeight = computed(() => criteriaItems.value.reduce((acc, i) => acc + (i.weight || 0), 0))

const columns = [
  { title: 'Nama Lomba', key: 'name', sorter: 'default', minWidth: 150 },
  { title: 'Gender', key: 'gender', render: (row) => row.gender?.toUpperCase() },
  { title: 'Jenjang', key: 'level' },
  { title: 'Sistem', key: 'scoring_type', render: (row) => h(NTag, { size: 'small', type: 'info', ghost: true }, { default: () => row.scoring_type === 'point' ? 'Poin' : 'Babak' }) },
  { title: 'Peserta', key: 'registrations', render: (row) => `${row.registrations?.[0]?.count || 0}${row.quota > 0 ? ' / ' + row.quota : ''}` },
  { title: 'Status', key: 'status', render: (row) => h('span', { class: `badge badge-${row.status}` }, [h('span', { class: 'badge-dot' }), row.status.toUpperCase()]) },
  { title: 'Aksi', key: 'actions', width: 220, render(row) { 
    return h(NSpace, { size: 'small' }, { default: () => [
      h(NButton, { size: 'small', quaternary: true, onClick: () => openEditWizard(row) }, { icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) }),
      h(NSelect, { size: 'small', value: row.status, options: [{ label: 'Buka', value: 'open' }, { label: 'Tutup', value: 'closed' }, { label: 'Selesai', value: 'finished' }], style: { width: '100px' }, onUpdateValue: (val) => compStore.updateStatus(row.id, val) }), 
      h(NPopconfirm, { onPositiveClick: () => compStore.remove(row.id) }, { trigger: () => h(NButton, { size: 'small', type: 'error', ghost: true }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }), default: () => 'Hapus lomba ini?' })
    ]}) 
  }}
]

function openAddWizard() { 
  step.value = 1; 
  isEdit.value = false;
  editingId.value = null;
  form.value = { name: '', quota: 0, is_group: false, gender: null, level: null, scoring_type: 'point' }; 
  criteriaItems.value = []; 
  showModal.value = true; 
}

function openEditWizard(row) {
  step.value = 1;
  isEdit.value = true;
  editingId.value = row.id;
  form.value = { 
    name: row.name, 
    quota: row.quota, 
    is_group: row.is_group, 
    gender: row.gender, 
    level: row.level, 
    scoring_type: row.scoring_type 
  };
  criteriaItems.value = row.criteria ? row.criteria.map(c => ({ ...c })) : [];
  showModal.value = true;
}

function addFromBank(id) {
  const master = compStore.masterCriteria.find(c => c.id === id)
  if (master) {
    criteriaItems.value.push({ name: master.name, min_score: master.min_score, max_score: master.max_score, weight: master.weight })
  }
}

async function handleSave() { 
  submitting.value = true; 
  try { 
    if (isEdit.value) {
      await compStore.update(editingId.value, form.value, criteriaItems.value);
      message.success('Perubahan lomba berhasil disimpan');
    } else {
      await compStore.create(form.value, criteriaItems.value); 
      message.success('Lomba berhasil dibuat'); 
    }
    showModal.value = false; 
  } catch (e) { 
    message.error(e.message); 
  } finally { 
    submitting.value = false; 
  } 
}
</script>

<style scoped> 
.mb-8 { margin-bottom: 32px; } 
.step-content { min-height: 350px; padding: 10px 0; } 
.criteria-row { margin-bottom: 12px; padding: 12px; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border); }
.total-weight { margin-top: 20px; text-align: right; font-size: 16px; padding: 10px; background: var(--bg-base); border-radius: 8px; }
.total-weight.error { color: var(--error); border: 1px solid var(--error); }
.weight-warn { font-size: 12px; font-weight: normal; }
</style>

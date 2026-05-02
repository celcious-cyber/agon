<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Plotting Juri</h1>
        <p class="page-subtitle">Daftar penugasan juri dan jadwal sesi untuk setiap mata lomba</p>
      </div>
    </div>

    <n-card class="content-card">
      <n-data-table 
        :columns="columns" 
        :data="displayData" 
        :loading="loading"
        :pagination="{ pageSize: 15 }"
      />
    </n-card>

    <!-- Modal Edit Plotting -->
    <n-modal v-model:show="showModal" preset="card" :title="'Penugasan Juri: ' + editingItem?.name" style="width: 550px">
      <n-space vertical :size="20">
        <n-alert type="info" :show-icon="false">
           Tentukan 3 juri yang akan menilai lomba ini. <br/>
           <b>Bobot:</b> Juri 1 (40%), Juri 2 (30%), Juri 3 (30%)
        </n-alert>

        <div v-for="pos in [1, 2, 3]" :key="pos" class="judge-slot">
          <div class="slot-header">
            <span class="slot-title">JURI {{ pos }}</span>
            <n-tag :type="pos === 1 ? 'info' : 'warning'" size="small" round>
               Bobot {{ pos === 1 ? '40%' : '30%' }}
            </n-tag>
          </div>
          <n-select 
            v-model:value="plottings[pos]" 
            :options="judgeOptions" 
            placeholder="Pilih juri..."
            filterable
            clearable
          />
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">Batal</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSave">Simpan Plotting</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { 
  NCard, NDataTable, NButton, NIcon, NSpace, NTag, NModal, 
  NSelect, NAlert, useMessage 
} from 'naive-ui'
import { CreateOutline, PeopleOutline, TimeOutline, LocationOutline } from '@vicons/ionicons5'
import { supabase } from '@/lib/supabase.js'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const editingItem = ref(null)

const competitions = ref([])
const judges = ref([])
const plottingList = ref([])

// State form modal
const plottings = ref({ 1: null, 2: null, 3: null })

onMounted(() => {
  fetchData()
  fetchJudges()
})

async function fetchData() {
  loading.value = true
  // Ambil lomba dan plotting juri sekaligus
  const [compRes, plotRes] = await Promise.all([
    supabase.from('competitions').select('*').order('name'),
    supabase.from('competition_judges').select('*, judges(name)')
  ])
  
  competitions.value = compRes.data || []
  plottingList.value = plotRes.data || []
  loading.value = false
}

async function fetchJudges() {
  const { data } = await supabase.from('judges').select('*').order('name')
  judges.value = data || []
}

const judgeOptions = computed(() => 
  judges.value.map(j => ({ label: j.name, value: j.id }))
)

const displayData = computed(() => {
  return competitions.value.map(c => {
    // Cari juri untuk lomba ini
    const cPlots = plottingList.value.filter(p => p.competition_id === c.id)
    return {
      ...c,
      juri1: cPlots.find(p => p.position === 1)?.judges?.name || '-',
      juri2: cPlots.find(p => p.position === 2)?.judges?.name || '-',
      juri3: cPlots.find(p => p.position === 3)?.judges?.name || '-'
    }
  })
})

const columns = [
  { title: 'Nama Lomba', key: 'name', minWidth: 150, sorter: 'default' },
  { 
    title: 'Juri 1 (40%)', 
    key: 'juri1',
    render: (row) => h('span', { class: row.juri1 === '-' ? 'text-muted' : 'text-bold' }, row.juri1)
  },
  { 
    title: 'Juri 2 (30%)', 
    key: 'juri2',
    render: (row) => h('span', { class: row.juri2 === '-' ? 'text-muted' : 'text-normal' }, row.juri2)
  },
  { 
    title: 'Juri 3 (30%)', 
    key: 'juri3',
    render: (row) => h('span', { class: row.juri3 === '-' ? 'text-muted' : 'text-normal' }, row.juri3)
  },
  {
    title: 'Sesi & Lokasi',
    key: 'schedule',
    render: (row) => {
      const sch = row.schedules?.[0] // Ambil sesi pertama jika ada
      if (!sch) return h('span', { class: 'text-muted' }, 'Belum diatur')
      return h(NSpace, { vertical: true, size: 0 }, { default: () => [
        h('div', { class: 'text-tiny' }, [
          h(NIcon, { component: TimeOutline, size: 12, style: 'margin-right:4px' }),
          h('span', `${sch.start_time?.substring(0,5)} - ${sch.end_time?.substring(0,5)}`)
        ]),
        h('div', { class: 'text-tiny' }, [
          h(NIcon, { component: LocationOutline, size: 12, style: 'margin-right:4px' }),
          h('span', sch.location)
        ])
      ]})
    }
  },
  {
    title: 'Aksi',
    key: 'actions',
    width: 80,
    render: (row) => h(NButton, { 
      size: 'small', 
      quaternary: true, 
      type: 'primary',
      onClick: () => openEdit(row) 
    }, { icon: () => h(NIcon, { component: CreateOutline }) })
  }
]

function openEdit(row) {
  editingItem.value = row
  const cPlots = plottingList.value.filter(p => p.competition_id === row.id)
  plottings.value = {
    1: cPlots.find(p => p.position === 1)?.judge_id || null,
    2: cPlots.find(p => p.position === 2)?.judge_id || null,
    3: cPlots.find(p => p.position === 3)?.judge_id || null
  }
  showModal.value = true
}

async function handleSave() {
  submitting.value = true
  try {
    // 1. Hapus plotting lama
    await supabase.from('competition_judges').delete().eq('competition_id', editingItem.value.id)

    // 2. Insert baru
    const newPlots = []
    if (plottings.value[1]) newPlots.push({ competition_id: editingItem.value.id, judge_id: plottings.value[1], position: 1, weight: 0.4 })
    if (plottings.value[2]) newPlots.push({ competition_id: editingItem.value.id, judge_id: plottings.value[2], position: 2, weight: 0.3 })
    if (plottings.value[3]) newPlots.push({ competition_id: editingItem.value.id, judge_id: plottings.value[3], position: 3, weight: 0.3 })

    if (newPlots.length > 0) {
      const { error } = await supabase.from('competition_judges').insert(newPlots)
      if (error) throw error
    }

    message.success('Plotting juri berhasil disimpan')
    showModal.value = false
    fetchData()
  } catch (e) {
    message.error(e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.text-bold { font-weight: 700; color: var(--primary); }
.text-normal { font-weight: 500; }
.text-muted { opacity: 0.4; font-style: italic; font-size: 12px; }
.text-tiny { font-size: 11px; display: flex; align-items: center; line-height: 1.4; }
.judge-slot {
  padding: 12px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
}
.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.slot-title { font-weight: 800; font-size: 12px; }
</style>

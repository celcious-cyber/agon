<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Manajemen Bracket</h1>
      </div>
      <div class="header-actions" v-if="selectedId">
        <n-button secondary type="primary" @click="handleGenerate">Generate Bracket</n-button>
      </div>
    </div>
    <n-card class="content-card mb-6">
      <n-form-item label="Pilih Lomba" label-placement="left">
        <n-select v-model:value="selectedId" :options="competitionOptions" placeholder="Sistem bracket..." filterable @update:value="loadBracketData" />
      </n-form-item>
    </n-card>
    <div v-if="selectedId" class="bracket-container">
      <div v-if="judgingStore.loading" style="text-align:center; padding: 50px"><n-spin /></div>
      <div v-else-if="judgingStore.brackets.length === 0" style="text-align:center; padding: 50px"><n-empty description="Belum diundi" /></div>
      <div v-else><BracketTree :brackets="judgingStore.brackets" :participants="competitionParticipants" :readonly="false" @winner-selected="handleWinnerSelected" /></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NButton, NCard, NSelect, NFormItem, NSpin, NEmpty, useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase.js'
import { useJudgingStore } from '@/stores/judging.js'
import { useCompetitionsStore } from '@/stores/competitions.js'
import BracketTree from '@/components/bracket/BracketTree.vue'

const judgingStore = useJudgingStore(); const compStore = useCompetitionsStore(); const message = useMessage()
const selectedId = ref(null); const competitionParticipants = ref([])

onMounted(() => { compStore.fetch() })
const competitionOptions = computed(() => compStore.items.filter(c => c.scoring_type === 'bracket').map(c => ({ label: c.name, value: c.id })))

async function loadBracketData(id) {
  const { data: p } = await supabase.from('participants').select('*, registrations!inner(competition_id)').eq('registrations.competition_id', id)
  competitionParticipants.value = p || []; await judgingStore.fetchBrackets(id)
}
async function handleGenerate() { try { await judgingStore.generateBrackets(selectedId.value, competitionParticipants.value); message.success('Generated'); } catch (e) { message.error(e.message) } }
async function handleWinnerSelected(bId, pId) { const b = judgingStore.brackets.find(x => x.id === bId); try { await judgingStore.setWinner(b, pId); message.success('Pemenang disimpan'); } catch (e) { message.error(e.message) } }
</script>

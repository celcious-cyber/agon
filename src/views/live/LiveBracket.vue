<template>
  <div class="page-container">
    <div class="page-header"><h1 class="page-title">Live Bracket</h1></div>
    <n-card class="content-card mb-6">
      <n-select v-model:value="selectedId" :options="competitionOptions" @update:value="liveStore.subscribe" />
    </n-card>
    <div v-if="selectedId" class="live-body">
      <BracketTree :brackets="liveStore.brackets" :participants="participantsForTree" :readonly="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NCard, NSelect } from 'naive-ui'
import { useLiveStore } from '@/stores/live.js'
import { useCompetitionsStore } from '@/stores/competitions.js'
import BracketTree from '@/components/bracket/BracketTree.vue'

const liveStore = useLiveStore(); const compStore = useCompetitionsStore(); const selectedId = ref(null)
onMounted(() => { compStore.fetch() }); onUnmounted(() => { liveStore.unsubscribe() })
const competitionOptions = computed(() => compStore.items.filter(c => c.scoring_type === 'bracket').map(c => ({ label: c.name, value: c.id })))
const participantsForTree = computed(() => {
  const map = {}; liveStore.brackets.forEach(b => {
    if (b.participant_a_data) map[b.participant_a] = { id: b.participant_a, name: b.participant_a_data.name }
    if (b.participant_b_data) map[b.participant_b] = { id: b.participant_b, name: b.participant_b_data.name }
  })
  return Object.values(map)
})
</script>

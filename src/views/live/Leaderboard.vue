<template>
  <div class="page-container" :class="{ 'live-fullscreen': isFullscreen }">
    <div class="page-header" v-if="!isFullscreen">
      <div class="header-content"><h1 class="page-title">Live Leaderboard</h1></div>
      <n-button @click="isFullscreen = !isFullscreen">Fullscreen</n-button>
    </div>
    <n-card class="content-card mb-6" v-if="!isFullscreen">
      <n-select v-model:value="selectedId" :options="competitionOptions" placeholder="Pilih Lomba" @update:value="liveStore.subscribe" />
    </n-card>
    <div v-if="selectedId" class="leaderboard-container">
      <TransitionGroup name="flip" tag="div" class="leaderboard-list">
        <div v-for="(entry, index) in liveStore.scores" :key="entry.participant_id" class="lb-row">
          <div class="lb-rank">#{{ index + 1 }}</div>
          <div class="lb-info"><div class="lb-name">{{ entry.participants?.name }}</div><div class="lb-inst">{{ entry.participants?.institutions?.name }}</div></div>
          <div class="lb-score">{{ entry.total_score.toFixed(1) }}</div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NCard, NSelect, NEmpty } from 'naive-ui'
import { useLiveStore } from '@/stores/live.js'
import { useCompetitionsStore } from '@/stores/competitions.js'

const liveStore = useLiveStore(); const compStore = useCompetitionsStore()
const selectedId = ref(null); const isFullscreen = ref(false)

onMounted(() => { compStore.fetch() })
onUnmounted(() => { liveStore.unsubscribe() })
const competitionOptions = computed(() => compStore.items.filter(c => c.scoring_type === 'point').map(c => ({ label: c.name, value: c.id })))
</script>

<style scoped> .lb-row { display: flex; align-items: center; padding: 16px; background: var(--bg-elevated); margin-bottom: 8px; border-radius: 8px; } .lb-rank { width: 40px; font-weight: 800; color: var(--primary); } .lb-info { flex: 1; } .lb-score { font-weight: 800; color: var(--success); } .flip-move { transition: transform 0.6s ease; } </style>

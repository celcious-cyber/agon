<template>
  <div class="bracket-scroll-container">
    <div class="bracket-tree-root" :style="{ position: 'relative', width: totalWidth + 'px', height: totalHeight + 'px' }">
      <svg :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }">
        <path v-for="line in connectionLines" :key="line.id" :d="line.d" fill="none" stroke="#252D40" stroke-width="2" />
      </svg>
      <MatchCard v-for="bracket in brackets" :key="bracket.id" :bracket="bracket" :participant-map="participantMap" :readonly="readonly" :style="{ position: 'absolute', left: cardLeft(bracket) + 'px', top: cardTop(bracket) + 'px' }" @winner-selected="(bId, pId) => emit('winner-selected', bId, pId)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'; import MatchCard from './MatchCard.vue'
const props = defineProps({ brackets: Array, participants: Array, readonly: Boolean }); const emit = defineEmits(['winner-selected'])
const CARD_W = 180; const CARD_H = 80; const H_GAP = 60; const V_GAP = 24
const participantMap = computed(() => { const map = {}; props.participants.forEach(p => { map[p.id] = p }); return map })
const maxRound = computed(() => props.brackets.length === 0 ? 1 : Math.max(...props.brackets.map(b => b.round)))
const byRound = computed(() => { const map = {}; props.brackets.forEach(b => { if (!map[b.round]) map[b.round] = []; map[b.round].push(b) }); return map })
const positions = computed(() => {
  const pos = {}; (byRound.value[1] || []).forEach((b, i) => { pos[b.id] = { x: 0, y: i * (CARD_H + V_GAP) } })
  for (let r = 2; r <= maxRound.value; r++) {
    const prev = byRound.value[r-1] || []; (byRound.value[r] || []).forEach(b => {
      const fA = prev.find(m => m.match_number === (b.match_number * 2 - 1)); const fB = prev.find(m => m.match_number === (b.match_number * 2))
      const yA = fA && pos[fA.id] ? pos[fA.id].y : 0; const yB = fB && pos[fB.id] ? pos[fB.id].y : yA + CARD_H + V_GAP; pos[b.id] = { x: (r - 1) * (CARD_W + H_GAP), y: (yA + yB) / 2 }
    })
  }
  return pos
})
const totalWidth = computed(() => maxRound.value * (CARD_W + H_GAP) - H_GAP + 40); const totalHeight = computed(() => Math.max(400, (byRound.value[1] || []).length * (CARD_H + V_GAP) + 100))
function cardLeft(b) { return positions.value[b.id]?.x || 0 }; function cardTop(b) { return positions.value[b.id]?.y || 0 }
const connectionLines = computed(() => {
  const lines = []; for (let r = 2; r <= maxRound.value; r++) {
    const prev = byRound.value[r-1] || []; (byRound.value[r] || []).forEach(b => {
      const bPos = positions.value[b.id]; if (!bPos) return
      const fA = prev.find(m => m.match_number === (b.match_number * 2 - 1)); const fB = prev.find(m => m.match_number === (b.match_number * 2))
      const midX = bPos.x - H_GAP/2; const bMidY = bPos.y + CARD_H/2
      if (fA && positions.value[fA.id]) lines.push({ id: `${b.id}-a`, d: `M${positions.value[fA.id].x + CARD_W},${positions.value[fA.id].y + CARD_H/2} H${midX} V${bMidY} H${bPos.x}` })
      if (fB && positions.value[fB.id]) lines.push({ id: `${b.id}-b`, d: `M${positions.value[fB.id].x + CARD_W},${positions.value[fB.id].y + CARD_H/2} H${midX} V${bMidY} H${bPos.x}` })
    })
  }
  return lines
})
</script>

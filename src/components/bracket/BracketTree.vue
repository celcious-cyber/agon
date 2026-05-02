<template>
  <div class="bracket-scroll-container">
    <div v-if="brackets.length > 0" class="bracket-tree-root" :style="{ position: 'relative', width: totalWidth + 'px', height: totalHeight + 'px' }">
      <svg :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }">
        <path v-for="line in connectionLines" :key="line.id" :d="line.d" fill="none" stroke="#252D40" stroke-width="2" />
      </svg>
      
      <MatchCard 
        v-for="bracket in brackets" 
        :key="bracket.id" 
        :bracket="bracket" 
        :participant-map="participantMap" 
        :readonly="readonly" 
        :style="{ 
          position: 'absolute', 
          left: cardLeft(bracket) + 'px', 
          top: cardTop(bracket) + 'px',
          zIndex: 5
        }" 
        @winner-selected="(bId, pId) => emit('winner-selected', bId, pId)" 
        @reset-match="(bId) => emit('reset-match', bId)"
      />
    </div>
    <div v-else class="p-10 text-center text-gray-500">
      Data bagan tidak ditemukan atau gagal dimuat.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'; 
import MatchCard from './MatchCard.vue'

const props = defineProps({ 
  brackets: { type: Array, default: () => [] }, 
  participants: { type: Array, default: () => [] }, 
  readonly: Boolean 
}); 

const emit = defineEmits(['winner-selected', 'reset-match'])

const CARD_W = 180; 
const H_GAP = 80; 
const V_GAP = 40;

const participantMap = computed(() => { 
  const map = {}; 
  props.participants.forEach(p => { map[p.id] = p }); 
  return map 
})

const teamsPerMatch = computed(() => {
  if (!props.brackets || props.brackets.length === 0) return 2
  // Ambil rata-rata atau dari match pertama
  return props.brackets[0].participants?.length || 2
})

const byRound = computed(() => { 
  const map = {}; 
  props.brackets.forEach(b => { 
    if (!map[b.round]) map[b.round] = []; 
    map[b.round].push(b) 
  }); 
  return map 
})

const maxRound = computed(() => {
  const rounds = Object.keys(byRound.value).map(Number)
  return rounds.length > 0 ? Math.max(...rounds) : 1
})

function getCardHeight(bracket) {
  const pCount = bracket.participants?.length || 2
  return 20 + (pCount * 38) + ((pCount - 1) * 1)
}

const positions = computed(() => {
  const pos = {};
  const N = teamsPerMatch.value

  // Ronde 1
  const round1 = byRound.value[1] || []
  round1.forEach((b, i) => { 
    const h = getCardHeight(b)
    pos[b.id] = { x: 20, y: i * (h + V_GAP) + 20 } 
  })

  // Ronde Selanjutnya
  for (let r = 2; r <= maxRound.value; r++) {
    const currentMatches = byRound.value[r] || []
    const prevMatches = byRound.value[r-1] || []
    
    currentMatches.forEach(b => {
      const feeders = prevMatches.filter(m => Math.ceil(m.match_number / N) === b.match_number)
      
      let yPos = 0
      if (feeders.length > 0 && feeders.every(f => pos[f.id])) {
        const yStart = pos[feeders[0].id].y
        const yEnd = pos[feeders[feeders.length - 1].id].y
        yPos = (yStart + yEnd) / 2
      } else {
        yPos = (b.match_number - 1) * 300 + 100
      }
      
      pos[b.id] = { x: (r - 1) * (CARD_W + H_GAP) + 20, y: yPos } 
    })
  }
  return pos
})

const totalWidth = computed(() => maxRound.value * (CARD_W + H_GAP) + 100)
const totalHeight = computed(() => {
  const round1 = byRound.value[1] || []
  if (round1.length === 0) return 600
  return round1.length * 200 + 100
})

function cardLeft(b) { return positions.value[b.id]?.x || 0 }
function cardTop(b) { return positions.value[b.id]?.y || 0 }

const connectionLines = computed(() => {
  const lines = []; 
  const N = teamsPerMatch.value

  for (let r = 2; r <= maxRound.value; r++) {
    const currentMatches = byRound.value[r] || []
    const prevMatches = byRound.value[r-1] || []

    currentMatches.forEach(b => {
      const bPos = positions.value[b.id]; 
      if (!bPos) return

      const feeders = prevMatches.filter(m => Math.ceil(m.match_number / N) === b.match_number)
      const midX = bPos.x - H_GAP/2; 
      const bMidY = bPos.y + getCardHeight(b)/2

      feeders.forEach(f => {
        const fPos = positions.value[f.id]
        if (fPos) {
          lines.push({ 
            id: `${b.id}-${f.id}`, 
            d: `M${fPos.x + CARD_W},${fPos.y + getCardHeight(f)/2} H${midX} V${bMidY} H${bPos.x}` 
          })
        }
      })
    })
  }
  return lines
})
</script>

<style scoped>
.bracket-scroll-container {
  overflow: auto;
  width: 100%;
  height: 100%;
  min-height: 500px;
}
.bracket-tree-root {
  background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
  background-size: 40px 40px;
}
</style>

<template>
  <div class="match-card" :class="{ 'has-winner': bracket.winner_id }">
    <div class="match-header">Match {{ bracket.match_number }}</div>
    
    <!-- Render semua peserta yang ada di array participants -->
    <div v-for="(pId, idx) in bracket.participants" :key="idx" class="slot-wrapper">
      <div 
        class="match-slot" 
        :class="{ 
          'winner': bracket.winner_id === pId && pId, 
          'bye': !pId, 
          'clickable': !readonly && !bracket.winner_id && pId 
        }" 
        @click="selectWinner(pId)"
      >
        <div class="slot-name">
          {{ participantMap[pId]?.name || (pId ? '...' : 'BYE') }}
        </div>
        <div v-if="bracket.winner_id === pId && pId" class="trophy">🏆</div>
      </div>
      
      <!-- VS Divider (hanya di antara peserta, bukan di akhir) -->
      <div v-if="idx < bracket.participants.length - 1" class="match-vs-line"></div>
    </div>

    <!-- Tombol Reset jika sudah ada pemenang -->
    <div v-if="bracket.winner_id && !readonly" class="edit-overlay">
      <n-button 
        circle 
        size="small" 
        type="primary" 
        @click.stop="emit('reset-match', bracket.id)"
      >
        <template #icon><n-icon><create-outline /></n-icon></template>
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { NButton, NIcon } from 'naive-ui'
import { CreateOutline } from '@vicons/ionicons5'

const props = defineProps({ 
  bracket: Object, 
  participantMap: Object, 
  readonly: Boolean 
})

const emit = defineEmits(['winner-selected', 'reset-match'])

function selectWinner(pId) { 
  if (props.readonly || props.bracket.winner_id || !pId) return
  emit('winner-selected', props.bracket.id, pId) 
}
</script>

<style scoped> 
.match-card { 
  width: 180px; 
  background: var(--bg-surface); 
  border: 1px solid var(--border); 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
} 

.match-header {
  font-size: 9px;
  text-align: center;
  padding: 4px 0;
  background: rgba(0,0,0,0.1);
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.match-card.has-winner {
  border-color: var(--primary);
}

.match-slot { 
  min-height: 38px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 12px; 
  font-size: 11px; 
  transition: all 0.2s ease; 
  font-weight: 500;
} 

.match-slot.clickable:hover { 
  background: rgba(var(--primary-rgb, 100, 108, 255), 0.15);
  cursor: pointer; 
} 

.match-slot.winner { 
  background: rgba(32, 212, 160, 0.15); 
  color: #20d4a0; 
  font-weight: 700; 
} 

.match-slot.bye { 
  color: #555; 
  background: rgba(0, 0, 0, 0.05); 
  font-style: italic;
} 

.match-vs-line { 
  height: 1px; 
  background: var(--border); 
  opacity: 0.5;
} 

.edit-overlay {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.match-card:hover .edit-overlay {
  opacity: 1;
}

.trophy {
  font-size: 14px;
}
</style>

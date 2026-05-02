<template>
  <div class="match-card">
    <div class="match-slot" :class="{ 'winner': bracket.winner_id === bracket.participant_a && bracket.participant_a, 'bye': !bracket.participant_a, 'clickable': !readonly && !bracket.winner_id && bracket.participant_a }" @click="selectWinner(bracket.participant_a)">
      <div class="slot-name">{{ participantMap[bracket.participant_a]?.name || (bracket.participant_a ? '...' : 'BYE') }}</div>
      <div v-if="bracket.winner_id === bracket.participant_a && bracket.participant_a">🏆</div>
    </div>
    <div class="match-vs">VS</div>
    <div class="match-slot" :class="{ 'winner': bracket.winner_id === bracket.participant_b && bracket.participant_b, 'bye': !bracket.participant_b, 'clickable': !readonly && !bracket.winner_id && bracket.participant_b }" @click="selectWinner(bracket.participant_b)">
      <div class="slot-name">{{ participantMap[bracket.participant_b]?.name || (bracket.participant_b ? '...' : 'BYE') }}</div>
      <div v-if="bracket.winner_id === bracket.participant_b && bracket.participant_b">🏆</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ bracket: Object, participantMap: Object, readonly: Boolean }); const emit = defineEmits(['winner-selected'])
function selectWinner(pId) { if (props.readonly || props.bracket.winner_id || !pId) return; emit('winner-selected', props.bracket.id, pId) }
</script>

<style scoped> .match-card { width: 180px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; } .match-slot { height: 40px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 13px; transition: all 0.2s ease; } .match-slot.clickable { cursor: pointer; } .match-slot.winner { background: rgba(32, 212, 160, 0.1); color: var(--success); font-weight: 700; } .match-slot.bye { color: #444; background: rgba(0, 0, 0, 0.2); } .match-vs { height: 1px; background: var(--border); position: relative; display: flex; align-items: center; justify-content: center; font-size: 8px; } .match-vs::before { content: 'VS'; background: var(--bg-surface); padding: 0 4px; position: absolute; top: -5px; } </style>

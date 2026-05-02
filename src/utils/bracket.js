export function generateBracket(participants) {
  const shuffled = [...participants].sort(() => Math.random() - 0.5)
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(shuffled.length, 2))))
  while (shuffled.length < size) { shuffled.push(null) }
  const brackets = []; const totalRounds = Math.log2(size)
  for (let i = 0; i < size; i += 2) {
    const pA = shuffled[i]; const pB = shuffled[i + 1]; const matchNumber = (i / 2) + 1
    let winnerId = null; let status = 'pending'
    if (pA === null && pB !== null) { winnerId = pB.id; status = 'done' }
    else if (pA !== null && pB === null) { winnerId = pA.id; status = 'done' }
    else if (pA === null && pB === null) { status = 'done' }
    brackets.push({ round: 1, match_number: matchNumber, participant_a: pA?.id || null, participant_b: pB?.id || null, winner_id: winnerId, status: status })
  }
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = size / Math.pow(2, r)
    for (let m = 1; m <= matchCount; m++) { brackets.push({ round: r, match_number: m, participant_a: null, participant_b: null, winner_id: null, status: 'pending' }) }
  }
  return brackets
}
export function getNextRoundSlot(currentBracket) {
  const nextMatchNumber = Math.ceil(currentBracket.match_number / 2); const isSlotA = currentBracket.match_number % 2 !== 0
  return { round: currentBracket.round + 1, match_number: nextMatchNumber, slot: isSlotA ? 'participant_a' : 'participant_b' }
}

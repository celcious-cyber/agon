export function generateBracket(participants, sizePerMatch = 2) {
  const shuffled = [...participants].sort(() => Math.random() - 0.5)
  
  // Hitung total ronde yang dibutuhkan berdasarkan log_N (N = sizePerMatch)
  const rounds = Math.ceil(Math.log(Math.max(shuffled.length, 2)) / Math.log(sizePerMatch)) || 1
  const totalSlots = Math.pow(sizePerMatch, rounds)
  
  // Padding dengan NULL (BYE) agar jumlahnya pas dengan kelipatan pangkat sizePerMatch
  while (shuffled.length < totalSlots) {
    shuffled.push(null)
  }
  
  const brackets = []

  // Generate Babak 1
  for (let i = 0; i < totalSlots; i += sizePerMatch) {
    const matchParticipants = shuffled.slice(i, i + sizePerMatch)
    const matchNumber = (i / sizePerMatch) + 1
    
    // Cek Auto-Winner jika hanya ada 1 peserta asli (sisanya BYE)
    const nonNulls = matchParticipants.filter(p => p !== null)
    let winnerId = null
    let status = 'pending'
    
    if (nonNulls.length === 1) {
      winnerId = nonNulls[0].id
      status = 'done'
    } else if (nonNulls.length === 0) {
      status = 'done'
    }

    brackets.push({
      round: 1,
      match_number: matchNumber,
      participants: matchParticipants.map(p => p?.id || null),
      winner_id: winnerId,
      status: status
    })
  }

  // Generate Babak Selanjutnya (Slot Kosong)
  for (let r = 2; r <= rounds; r++) {
    const matchCount = totalSlots / Math.pow(sizePerMatch, r)
    for (let m = 1; m <= matchCount; m++) {
      brackets.push({
        round: r,
        match_number: m,
        participants: new Array(sizePerMatch).fill(null),
        winner_id: null,
        status: 'pending'
      })
    }
  }

  return brackets
}

export function getNextRoundSlot(currentBracket, sizePerMatch = 2) {
  const nextMatchNumber = Math.ceil(currentBracket.match_number / sizePerMatch)
  const slotIndex = (currentBracket.match_number - 1) % sizePerMatch
  
  return { 
    round: currentBracket.round + 1, 
    match_number: nextMatchNumber, 
    slotIndex: slotIndex 
  }
}

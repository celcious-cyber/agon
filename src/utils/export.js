import jsPDF from 'jspdf'; import autoTable from 'jspdf-autotable'; import * as XLSX from 'xlsx'
export function exportScoresPDF(competition, scores, criteria) {
  const doc = new jsPDF(); doc.setFontSize(18); doc.setTextColor(124, 107, 255); doc.text('AGON — Result', 14, 20)
  doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.text(competition.name, 14, 30)
  const headers = ['#', 'Nama', 'Institusi', 'Total']; const rows = scores.map((s, i) => [i + 1, s.participants?.name || '-', s.participants?.institutions?.name || '-', s.total_score?.toFixed(1) || '0'])
  autoTable(doc, { head: [headers], body: rows, startY: 40, theme: 'grid' }); doc.save(`rekap-${competition.name}.pdf`)
}
export function exportParticipantsExcel(participants) {
  const data = participants.map((p, i) => ({ 'No': i + 1, 'Nama': p.name, 'Gender': p.gender, 'Institusi': p.institutions?.name || '-' }))
  const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Peserta'); XLSX.writeFile(wb, `peserta-agon.xlsx`)
}

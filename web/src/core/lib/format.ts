export const AVATAR_COLORS = [
  '#1d4ed8', '#7c3aed', '#0f766e', '#b45309', '#be185d',
  '#15803d', '#0369a1', '#9333ea',
]

/** Short date: "May 10" — null/undefined returns "—" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Long date with year: "May 10, 2026" — null returns "No deadline" */
export function formatDeadline(d: string | null | undefined): string {
  if (!d) return 'No deadline'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Deterministic color from any ID string, drawn from AVATAR_COLORS */
export function colorForId(id: string | null | undefined): string {
  if (!id) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/** First character of a name, uppercased — returns "?" if empty */
export function initialForName(name: string | null | undefined): string {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase()
}

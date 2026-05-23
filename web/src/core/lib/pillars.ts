/**
 * The five regenerative pillars used as circles for projects.
 * A "circle" is a categorical bucket — a project belongs to exactly one,
 * and circle_lead users can be assigned to lead one or more.
 */

export const PILLARS = ['ecology', 'hardware', 'humanware', 'economy', 'tech'] as const
export type Pillar = typeof PILLARS[number]

export const PILLAR_META: Record<Pillar, { label: string; color: string; emoji: string }> = {
  ecology:   { label: 'Ecology',   color: '#15803d', emoji: '🌱' },
  hardware:  { label: 'Hardware',  color: '#b45309', emoji: '🔧' },
  humanware: { label: 'Humanware', color: '#be185d', emoji: '🤝' },
  economy:   { label: 'Economy',   color: '#0369a1', emoji: '💱' },
  tech:      { label: 'Tech',      color: '#7c3aed', emoji: '⚙️' },
}

export function isPillar(value: string | null | undefined): value is Pillar {
  return !!value && (PILLARS as readonly string[]).includes(value)
}

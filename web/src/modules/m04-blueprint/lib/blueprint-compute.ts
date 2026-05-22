import { FW_DATA } from './wizard-data'

export type Values = Record<string, unknown>

const PILLAR_MAP: Record<string, string[]> = {
  ecology:    ['site_water', 'site_climate', 'eco_assessment', 'c_water', 'c_waste', 'c_energy', 'metrics'],
  social:     ['team_trust', 'team_diversity', 'culture_strength', 'rituals', 'onboarding', 'culture_carriers'],
  economy:    ['biz_resilience', 'biz_clarity', 'fund_realism', 'fund_alignment', 'cap_close', 'revenue_streams'],
  hardware:   ['site_access', 'c_buildings', 'c_roads', 'c_connectivity', 'mp_integration', 'practice_ready'],
  governance: ['intention_clarity', 'vision_alignment', 'structure_explicit', 'self_clarity', 'ops_smooth', 'gov_health', 'evo_capacity'],
}

export function computePillarScores(values: Values): Record<string, number> {
  const result: Record<string, number> = {}
  Object.entries(PILLAR_MAP).forEach(([pillar, ids]) => {
    let sum = 0, count = 0
    ids.forEach(id => {
      const v = values[id]
      if (typeof v === 'number') { sum += v; count++ }
      else if (typeof v === 'boolean' && v) { sum += 8; count++ }
    })
    result[pillar] = count > 0 ? sum / count : 0
  })
  return result
}

export function computeOverallReadiness(values: Values): number {
  const scores = computePillarScores(values)
  const vals = Object.values(scores)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function computeGatesPassed(values: Values): number {
  let passed = 0
  FW_DATA.phases.forEach(p => {
    p.steps.forEach(s => {
      if (s.kind === 'gate' && s.criteria) {
        const met = s.criteria.filter(c => {
          const v = values[c.metric]
          if (typeof v === 'boolean') return v
          if (typeof v === 'number') return v >= 6
          return false
        }).length
        if (met / s.criteria.length >= 0.8) passed++
      }
    })
  })
  return passed
}

export function computePhaseProgress(values: Values) {
  return FW_DATA.phases.map(p => {
    const nonGateSteps = p.steps.filter(s => s.kind !== 'gate')
    let answered = 0
    nonGateSteps.forEach(s => {
      const hasFields  = (s.fields    ?? []).some(f  => values[f.id]  && String(values[f.id]).length > 5)
      const hasSliders = (s.sliders   ?? []).some(sl => values[sl.id] != null)
      const hasChecks  = (s.checklist ?? []).some(c  => values[c.id])
      if (hasFields || hasSliders || hasChecks) answered++
    })
    return {
      id:       p.id,
      name:     p.name,
      answered,
      total:    nonGateSteps.length,
      ratio:    nonGateSteps.length > 0 ? answered / nonGateSteps.length : 0,
    }
  })
}

export type Bio = {
  values_list?: string[]
  skills?: string[]
  interests?: string[]
  mbti?: string | null
  ocean_openness?: number
  ocean_conscientiousness?: number
  ocean_extraversion?: number
  ocean_agreeableness?: number
  ocean_neuroticism?: number
} | null

export type MatchResult = { score: number; reasons: string[] }

// Cognitive function complement pairs — dominant/auxiliary functions directly complement
// each other (e.g. INTJ Ni-Te <-> ENFP Ne-Fi share the Te-Fi axis).
const MBTI_IDEAL_PAIRS: Record<string, string[]> = {
  INTJ: ['ENFP', 'ENTP'], INTP: ['ENTJ', 'ENFJ'],
  INFJ: ['ENFP', 'ENTP'], INFP: ['ENFJ', 'ENTJ'],
  ISTJ: ['ESFP', 'ESTP'], ISTP: ['ESFJ', 'ESTJ'],
  ISFJ: ['ESFP', 'ESTP'], ISFP: ['ESFJ', 'ESTJ'],
  ENTJ: ['INTP', 'INFP'], ENTP: ['INTJ', 'INFJ'],
  ENFJ: ['INFP', 'INTP'], ENFP: ['INTJ', 'INFJ'],
  ESTJ: ['ISTP', 'ISFP'], ESTP: ['ISTJ', 'ISFJ'],
  ESFJ: ['ISFP', 'ISTP'], ESFP: ['ISTJ', 'ISFJ'],
}

// NT Analysts, NF Diplomats, SJ Sentinels, SP Explorers
const MBTI_TEMPERAMENT: Record<string, string> = {
  INTJ: 'NT', INTP: 'NT', ENTJ: 'NT', ENTP: 'NT',
  INFJ: 'NF', INFP: 'NF', ENFJ: 'NF', ENFP: 'NF',
  ISTJ: 'SJ', ISFJ: 'SJ', ESTJ: 'SJ', ESFJ: 'SJ',
  ISTP: 'SP', ISFP: 'SP', ESTP: 'SP', ESFP: 'SP',
}

function mbtiCompat(a: string | null | undefined, b: string | null | undefined): { points: number; label: string | null } {
  if (!a || !b) return { points: 0, label: null }
  if (a === b) return { points: 12, label: 'Same type' }
  if (MBTI_IDEAL_PAIRS[a]?.[0] === b || MBTI_IDEAL_PAIRS[b]?.[0] === a)
    return { points: 22, label: 'Ideal MBTI pair' }
  if (MBTI_IDEAL_PAIRS[a]?.includes(b))
    return { points: 16, label: 'MBTI complement' }
  if (MBTI_TEMPERAMENT[a] === MBTI_TEMPERAMENT[b])
    return { points: 10, label: 'Same temperament' }
  const shared = [...a].filter((ch, i) => ch === b[i]).length
  if (shared >= 2) return { points: 5, label: null }
  return { points: 0, label: null }
}

// Score breakdown (max 100):
//   Values shared    → up to 30 (5 pts each)
//   Skills shared    → up to 16 (4 pts each)
//   Interests shared → up to 14 (2 pts each)
//   OCEAN similarity → up to 18 (euclidean distance)
//   MBTI compat      → up to 22
export function computeMatch(mine: Bio, theirs: Bio): MatchResult {
  if (!mine || !theirs) return { score: 0, reasons: [] }
  const reasons: string[] = []
  let score = 0

  const sharedValues = (mine.values_list ?? []).filter(v => (theirs.values_list ?? []).includes(v))
  if (sharedValues.length) {
    score += Math.min(sharedValues.length * 5, 30)
    reasons.push(`${sharedValues.length} shared value${sharedValues.length > 1 ? 's' : ''}`)
  }

  const sharedSkills = (mine.skills ?? []).filter(s => (theirs.skills ?? []).includes(s))
  if (sharedSkills.length) {
    score += Math.min(sharedSkills.length * 4, 16)
    reasons.push(`${sharedSkills.length} shared skill${sharedSkills.length > 1 ? 's' : ''}`)
  }

  const sharedInterests = (mine.interests ?? []).filter(i => (theirs.interests ?? []).includes(i))
  if (sharedInterests.length) {
    score += Math.min(sharedInterests.length * 2, 14)
    reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`)
  }

  const oceanKeys = [
    'ocean_openness', 'ocean_conscientiousness', 'ocean_extraversion',
    'ocean_agreeableness', 'ocean_neuroticism',
  ] as const
  const avgDiff = oceanKeys.reduce((sum, k) => sum + Math.abs((mine[k] ?? 5) - (theirs[k] ?? 5)), 0) / 5
  score += Math.round((1 - avgDiff / 9) * 18)
  if (avgDiff <= 2) reasons.push('Similar personality')

  const { points: mbtiPts, label: mbtiLabel } = mbtiCompat(mine.mbti, theirs.mbti)
  score += mbtiPts
  if (mbtiLabel) reasons.push(mbtiLabel)

  return { score: Math.min(Math.round(score), 100), reasons }
}

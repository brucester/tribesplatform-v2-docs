export type Bio = {
  skills?: string[] | null
  interests?: string[] | null
  personality_details?: {
    myersBriggs?: string | null
    ocean?: {
      openness?: number | null
      conscientiousness?: number | null
      extraversion?: number | null
      agreeableness?: number | null
      neuroticism?: number | null
    } | null
  } | null
} | null

export type MatchResult = { score: number; reasons: string[] }

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

const MBTI_TEMPERAMENT: Record<string, string> = {
  INTJ: 'NT', INTP: 'NT', ENTJ: 'NT', ENTP: 'NT',
  INFJ: 'NF', INFP: 'NF', ENFJ: 'NF', ENFP: 'NF',
  ISTJ: 'SJ', ISFJ: 'SJ', ESTJ: 'SJ', ESFJ: 'SJ',
  ISTP: 'SP', ISFP: 'SP', ESTP: 'SP', ESFP: 'SP',
}

function mbtiCompat(a?: string | null, b?: string | null): { points: number; label: string | null } {
  if (!a || !b) return { points: 0, label: null }
  if (a === b) return { points: 12, label: 'Same MBTI type' }
  if (MBTI_IDEAL_PAIRS[a]?.[0] === b || MBTI_IDEAL_PAIRS[b]?.[0] === a)
    return { points: 25, label: 'Ideal MBTI pair' }
  if (MBTI_IDEAL_PAIRS[a]?.includes(b))
    return { points: 18, label: 'MBTI complement' }
  if (MBTI_TEMPERAMENT[a] === MBTI_TEMPERAMENT[b])
    return { points: 10, label: 'Same temperament' }
  const shared = [...a].filter((ch, i) => ch === b[i]).length
  if (shared >= 2) return { points: 5, label: null }
  return { points: 0, label: null }
}

// Score breakdown (max 100):
//   Skills shared    → up to 30 (5 pts each, max 6)
//   Interests shared → up to 20 (4 pts each, max 5)
//   OCEAN similarity → up to 25 (euclidean distance, 0-100 scale)
//   MBTI compat      → up to 25
export function computeMatch(mine: Bio, theirs: Bio): MatchResult {
  if (!mine || !theirs) return { score: 0, reasons: [] }
  const reasons: string[] = []
  let score = 0

  const sharedSkills = (mine.skills ?? []).filter(s => (theirs.skills ?? []).includes(s))
  if (sharedSkills.length) {
    score += Math.min(sharedSkills.length * 5, 30)
    reasons.push(`${sharedSkills.length} shared skill${sharedSkills.length > 1 ? 's' : ''}`)
  }

  const sharedInterests = (mine.interests ?? []).filter(i => (theirs.interests ?? []).includes(i))
  if (sharedInterests.length) {
    score += Math.min(sharedInterests.length * 4, 20)
    reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`)
  }

  const mOcean = mine.personality_details?.ocean
  const tOcean = theirs.personality_details?.ocean
  if (mOcean && tOcean) {
    const keys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const
    const avgDiff = keys.reduce((sum, k) => sum + Math.abs((mOcean[k] ?? 50) - (tOcean[k] ?? 50)), 0) / 5
    const oceanPts = Math.round((1 - avgDiff / 100) * 25)
    score += oceanPts
    if (avgDiff <= 15) reasons.push('Similar personality traits')
  }

  const { points: mbtiPts, label: mbtiLabel } = mbtiCompat(
    mine.personality_details?.myersBriggs,
    theirs.personality_details?.myersBriggs
  )
  score += mbtiPts
  if (mbtiLabel) reasons.push(mbtiLabel)

  return { score: Math.min(Math.round(score), 100), reasons }
}

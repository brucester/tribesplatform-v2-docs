'use client'
import { useState, useMemo } from 'react'

const STATUS_LABELS: Record<string, string> = {
  looking: 'Actively looking', open: 'Open to connections',
  building: 'Building now', traveling: 'Traveling', settled: 'Settled',
}

const USER_TYPES = [
  'Founder / Co-creator', 'Community builder', 'Investor', 'Skilled contributor',
  'Land steward', 'Community seeker', 'Digital nomad', 'Facilitator / Coach',
  'Artist / Creative', 'Healer / Therapist', 'Teacher / Educator', 'Researcher',
]

const MBTI_LABELS: Record<string, string> = {
  INTJ: 'Architect', INTP: 'Logician', INFJ: 'Advocate', INFP: 'Mediator',
  ISTJ: 'Logistician', ISTP: 'Virtuoso', ISFJ: 'Defender', ISFP: 'Adventurer',
  ENTJ: 'Commander', ENTP: 'Debater', ENFJ: 'Protagonist', ENFP: 'Campaigner',
  ESTJ: 'Executive', ESTP: 'Entrepreneur', ESFJ: 'Consul', ESFP: 'Entertainer',
}

// Cognitive function complement pairs — each type's dom/aux functions directly
// complement the other's dom/aux (e.g. INTJ Ni-Te ↔ ENFP Ne-Fi share the Te-Fi axis)
// These are the "golden pairs" most consistently cited across MBTI research.
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

// Same temperament group — share core values & worldview orientation.
// NT (Analysts), NF (Diplomats), SJ (Sentinels), SP (Explorers)
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
    return { points: 22, label: '✦ Ideal MBTI pair' }
  if (MBTI_IDEAL_PAIRS[a]?.includes(b))
    return { points: 16, label: 'MBTI complement' }
  if (MBTI_TEMPERAMENT[a] === MBTI_TEMPERAMENT[b])
    return { points: 10, label: 'Same temperament' }
  // Share 2 letters — broadly compatible
  const shared = [...a].filter((ch, i) => ch === b[i]).length
  if (shared >= 2) return { points: 5, label: null }
  return { points: 0, label: null }
}

type Bio = {
  values_list?: string[]; skills?: string[]; interests?: string[]
  archetypes?: string[]; mbti?: string | null
  ocean_openness?: number; ocean_conscientiousness?: number
  ocean_extraversion?: number; ocean_agreeableness?: number; ocean_neuroticism?: number
} | null

type Member = {
  id: string; username: string; display_name: string | null
  pronouns: string | null; avatar_url: string | null
  bio: string | null; current_location: string | null
  status: string; user_bio: Bio
  [key: string]: any
}

type MatchResult = { score: number; reasons: string[] }

// Score breakdown (max 100):
//   Values shared   → up to 30
//   Skills shared   → up to 16
//   Interests shared→ up to 14
//   OCEAN similarity→ up to 18
//   MBTI compat     → up to 22
function computeMatch(mine: Bio, theirs: Bio): MatchResult {
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

  const oceanKeys = ['ocean_openness', 'ocean_conscientiousness', 'ocean_extraversion', 'ocean_agreeableness', 'ocean_neuroticism'] as const
  const oceanDiffs = oceanKeys.map(k => Math.abs((mine[k] ?? 5) - (theirs[k] ?? 5)))
  const avgDiff = oceanDiffs.reduce((a, b) => a + b, 0) / 5
  const oceanScore = Math.round((1 - avgDiff / 9) * 18)
  score += oceanScore
  if (avgDiff <= 2) reasons.push('Similar personality')

  const { points: mbtiPts, label: mbtiLabel } = mbtiCompat(mine.mbti, theirs.mbti)
  score += mbtiPts
  if (mbtiLabel) reasons.push(mbtiLabel)

  return { score: Math.min(Math.round(score), 100), reasons }
}

export default function DiscoverClient({ members, myBio, isLoggedIn }: {
  members: Member[]
  myBio: Bio
  isLoggedIn: boolean
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return members.filter(m => {
      if (q) {
        const haystack = [
          m.display_name, m.username, m.bio, m.current_location,
          ...(m.user_bio?.skills ?? []), ...(m.user_bio?.interests ?? []),
          ...(m.user_bio?.values_list ?? []),
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (statusFilter && m.status !== statusFilter) return false
      if (typeFilter && !(m.user_types ?? []).includes(typeFilter)) return false
      return true
    })
  }, [members, search, statusFilter, typeFilter])

  const scored = useMemo(() => {
    return filtered
      .map(m => ({ ...m, match: myBio ? computeMatch(myBio, m.user_bio) : null }))
      .sort((a, b) => {
        if (!a.match || !b.match) return 0
        return b.match.score - a.match.score
      })
  }, [filtered, myBio])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 400, marginBottom: 6 }}>
          Discover members
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
          {members.length} people building regenerative lives
          {isLoggedIn && myBio && ' · sorted by match'}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28,
        padding: '16px 18px', background: 'var(--surface)',
        border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)',
        alignItems: 'center',
      }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, interest, location…"
          style={{ flex: '1 1 220px', minWidth: 0 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ flex: '0 1 180px' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ flex: '0 1 200px' }}>
          <option value="">All types</option>
          {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || statusFilter || typeFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}
            style={{ fontSize: 12.5, color: 'var(--ink-3)', background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      {(search || statusFilter || typeFilter) && (
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
          {scored.length} result{scored.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {scored.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 15 }}>No members found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {scored.map(m => (
            <MemberCard key={m.id} member={m} match={m.match} showMatch={isLoggedIn && !!myBio} />
          ))}
        </div>
      )}

      {!isLoggedIn && (
        <div style={{
          marginTop: 40, padding: '20px 24px',
          background: 'var(--accent-soft)', border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center',
        }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
            Join to see your compatibility score with each member
          </div>
          <a href="/auth/signup" style={{
            display: 'inline-block', marginTop: 8,
            background: 'var(--accent)', color: '#fff',
            fontWeight: 600, fontSize: 13, padding: '9px 20px',
            borderRadius: 'var(--radius)',
          }}>Create your profile →</a>
        </div>
      )}
    </div>
  )
}

function MemberCard({ member: m, match, showMatch }: {
  member: Member & { user_bio: Bio }
  match: MatchResult | null
  showMatch: boolean
}) {
  const userTypes: string[] = m.user_types ?? []
  const archetypes: string[] = m.user_bio?.archetypes ?? []
  const skills: string[] = m.user_bio?.skills ?? []
  const mbti = m.user_bio?.mbti ?? null

  const matchColor = match
    ? match.score >= 65 ? 'var(--accent)'
      : match.score >= 40 ? 'var(--warn)'
      : 'var(--ink-4)'
    : 'var(--ink-4)'

  return (
    <a href={`/u/${m.username}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rule)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
        cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
        height: '100%', display: 'flex', flexDirection: 'column', gap: 12,
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
      >
        {/* Top row: avatar + name + match */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-soft)', border: '1.5px solid var(--rule)',
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, color: 'var(--accent)',
          }}>
            {m.avatar_url
              ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (m.display_name?.[0] ?? m.username[0]).toUpperCase()
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>
                {m.display_name ?? m.username}
              </span>
              {mbti && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)',
                  padding: '1px 6px', borderRadius: 5,
                  background: 'rgba(139,92,246,0.12)', color: 'var(--rcos)',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}>{mbti}</span>
              )}
            </div>
            {m.pronouns && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 1 }}>{m.pronouns}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span className={`status-badge status-${m.status}`}>
                {STATUS_LABELS[m.status]}
              </span>
              {m.current_location && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>📍 {m.current_location}</span>
              )}
            </div>
          </div>

          {/* Match score */}
          {showMatch && match && match.score > 0 && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: matchColor, lineHeight: 1 }}>
                {match.score}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                match
              </div>
            </div>
          )}
        </div>

        {/* Bio excerpt */}
        {m.bio && (
          <p style={{
            fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{m.bio}</p>
        )}

        {/* User types */}
        {userTypes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {userTypes.slice(0, 3).map(t => (
              <span key={t} style={{
                fontSize: 10.5, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>{t}</span>
            ))}
            {userTypes.length > 3 && (
              <span style={{ fontSize: 10.5, color: 'var(--ink-4)', padding: '2px 4px' }}>
                +{userTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Archetypes */}
        {archetypes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {archetypes.map(a => (
              <span key={a} style={{
                fontSize: 10.5, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(139,92,246,0.1)', color: 'var(--rcos)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}>{a}</span>
            ))}
          </div>
        )}

        {/* Skills preview */}
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {skills.slice(0, 4).map(s => (
              <span key={s} style={{
                fontSize: 10.5, color: 'var(--ink-3)', padding: '2px 7px',
                borderRadius: 20, border: '1px solid var(--rule)',
                background: 'var(--bg)',
              }}>{s}</span>
            ))}
            {skills.length > 4 && (
              <span style={{ fontSize: 10.5, color: 'var(--ink-4)', padding: '2px 4px' }}>
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Match reasons */}
        {showMatch && match && match.reasons.length > 0 && (
          <div style={{
            fontSize: 11.5, color: matchColor,
            borderTop: '1px solid var(--rule)', paddingTop: 10,
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {match.reasons.map(r => (
              <span key={r} style={{
                background: match.score >= 65 ? 'var(--accent-soft)' : match.score >= 40 ? 'var(--warn-soft)' : 'var(--bg-2)',
                padding: '2px 7px', borderRadius: 20, fontWeight: 500,
              }}>{r}</span>
            ))}
          </div>
        )}
      </div>
    </a>
  )
}

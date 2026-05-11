'use client'

const ARCHETYPES = [
  'Visionary', 'Builder', 'Healer', 'Weaver', 'Guardian',
  'Teacher', 'Artist', 'Catalyst', 'Nurturer', 'Activist',
]

const MBTI_TYPES: { code: string; label: string }[] = [
  { code: 'INTJ', label: 'Architect' },  { code: 'INTP', label: 'Logician' },
  { code: 'INFJ', label: 'Advocate' },   { code: 'INFP', label: 'Mediator' },
  { code: 'ISTJ', label: 'Logistician' },{ code: 'ISTP', label: 'Virtuoso' },
  { code: 'ISFJ', label: 'Defender' },   { code: 'ISFP', label: 'Adventurer' },
  { code: 'ENTJ', label: 'Commander' },  { code: 'ENTP', label: 'Debater' },
  { code: 'ENFJ', label: 'Protagonist' },{ code: 'ENFP', label: 'Campaigner' },
  { code: 'ESTJ', label: 'Executive' },  { code: 'ESTP', label: 'Entrepreneur' },
  { code: 'ESFJ', label: 'Consul' },     { code: 'ESFP', label: 'Entertainer' },
]

interface Props {
  archetypes: string[]; setArchetypes: (v: string[]) => void
  mbti: string | null; setMbti: (v: string | null) => void
}

export default function IdentitySection({ archetypes, setArchetypes, mbti, setMbti }: Props) {
  const toggleArchetype = (a: string) =>
    setArchetypes(archetypes.includes(a)
      ? archetypes.filter(x => x !== a)
      : archetypes.length < 3 ? [...archetypes, a] : archetypes
    )

  return (
    <div>
      <Card title="Archetypes" hint="Choose up to 3 that feel most true to you">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ARCHETYPES.map(a => {
            const selected = archetypes.includes(a)
            const maxed = !selected && archetypes.length >= 3
            return (
              <button key={a} type="button" onClick={() => toggleArchetype(a)} disabled={maxed} style={{
                padding: '7px 14px', borderRadius: 20, cursor: maxed ? 'default' : 'pointer',
                border: `1.5px solid ${selected ? 'var(--rcos)' : 'var(--rule)'}`,
                background: selected ? 'rgba(139,92,246,0.1)' : 'transparent',
                color: selected ? 'var(--rcos)' : maxed ? 'var(--ink-4)' : 'var(--ink-3)',
                fontWeight: selected ? 600 : 400, fontSize: 12.5, transition: 'all 0.1s',
                opacity: maxed ? 0.5 : 1,
              }}>{a}</button>
            )
          })}
        </div>
        {archetypes.length >= 3 && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 10 }}>
            Max 3 selected. Remove one to pick a different archetype.
          </div>
        )}
      </Card>

      <Card title="Myers-Briggs type" hint="Select the type that fits you best">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {MBTI_TYPES.map(({ code, label }) => {
            const selected = mbti === code
            return (
              <button key={code} type="button"
                onClick={() => setMbti(selected ? null : code)}
                style={{
                  padding: '10px 8px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  border: `1.5px solid ${selected ? 'var(--rcos)' : 'var(--rule)'}`,
                  background: selected ? 'rgba(139,92,246,0.1)' : 'var(--surface)',
                  textAlign: 'center', transition: 'all 0.1s',
                }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                  color: selected ? 'var(--rcos)' : 'var(--ink)',
                }}>{code}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{label}</div>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '22px', marginBottom: 20,
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

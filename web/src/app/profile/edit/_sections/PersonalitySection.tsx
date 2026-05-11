'use client'

const OCEAN_TRAITS = [
  { key: 'ocean_openness',          label: 'Openness',            low: 'Conventional',          high: 'Curious & creative' },
  { key: 'ocean_conscientiousness', label: 'Conscientiousness',   low: 'Spontaneous',            high: 'Organised & disciplined' },
  { key: 'ocean_extraversion',      label: 'Extraversion',        low: 'Introvert',              high: 'Extravert' },
  { key: 'ocean_agreeableness',     label: 'Agreeableness',       low: 'Direct & independent',   high: 'Harmony-seeking' },
  { key: 'ocean_neuroticism',       label: 'Emotional intensity', low: 'Calm & stable',          high: 'Emotionally intense' },
] as const

type OceanKey = typeof OCEAN_TRAITS[number]['key']

type OceanState = { [K in OceanKey]: number }

interface Props {
  ocean: OceanState
  setOcean: (v: OceanState) => void
}

export default function PersonalitySection({ ocean, setOcean }: Props) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '22px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
        Personality — OCEAN model
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 24 }}>
        Used in compatibility matching. Be honest — there is no wrong answer.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {OCEAN_TRAITS.map(trait => {
          const val = ocean[trait.key]
          const pct = ((val - 1) / 9) * 100
          return (
            <div key={trait.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{trait.label}</span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                  {val <= 3 ? trait.low : val >= 8 ? trait.high : 'Balanced'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>{trait.low}</span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="range" min={1} max={10} value={val}
                    onChange={e => setOcean({ ...ocean, [trait.key]: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                  <div style={{
                    position: 'absolute', top: -20, left: `${pct}%`,
                    transform: 'translateX(-50%)',
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    pointerEvents: 'none',
                  }}>{val}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap', minWidth: 90 }}>{trait.high}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

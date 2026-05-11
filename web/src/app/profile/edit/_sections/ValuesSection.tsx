'use client'

const VALUES_LIST = [
  'Ecological regeneration', 'Community & belonging', 'Simplicity & sufficiency',
  'Spiritual growth', 'Creative expression', 'Social justice', 'Economic justice',
  'Education & learning', 'Health & wellbeing', 'Autonomy & sovereignty',
  'Collaboration', 'Indigenous wisdom', 'Systems thinking', 'Place-based living',
  'Nonviolence', 'Food sovereignty', 'Open source', 'Decentralisation',
]

interface Props {
  valuesList: string[]; setValuesList: (v: string[]) => void
  lifePrinciples: string; setLifePrinciples: (v: string) => void
}

export default function ValuesSection({ valuesList, setValuesList, lifePrinciples, setLifePrinciples }: Props) {
  const toggle = (v: string) =>
    setValuesList(valuesList.includes(v) ? valuesList.filter(x => x !== v) : [...valuesList, v])

  return (
    <div>
      <Card title="Core values" hint="Select all that resonate with your life orientation">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {VALUES_LIST.map(v => {
            const selected = valuesList.includes(v)
            return (
              <button key={v} type="button" onClick={() => toggle(v)} style={{
                padding: '7px 13px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${selected ? 'var(--alchemy)' : 'var(--rule)'}`,
                background: selected ? 'rgba(249,115,22,0.1)' : 'transparent',
                color: selected ? 'var(--alchemy)' : 'var(--ink-3)',
                fontWeight: selected ? 600 : 400, fontSize: 12.5, transition: 'all 0.1s',
              }}>{v}</button>
            )
          })}
        </div>
      </Card>

      <Card title="Life principles" hint="How do you try to live? A short personal credo, in your own words.">
        <textarea
          value={lifePrinciples}
          onChange={e => setLifePrinciples(e.target.value)}
          rows={5}
          placeholder="e.g. I try to leave every place better than I found it. I believe in radical honesty and slow living..."
        />
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

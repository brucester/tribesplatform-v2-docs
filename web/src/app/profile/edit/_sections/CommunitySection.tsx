'use client'

interface Props {
  idealCommunityVibe: string; setIdealCommunityVibe: (v: string) => void
  dealBreakers: string; setDealBreakers: (v: string) => void
  openToTravel: boolean; setOpenToTravel: (v: boolean) => void
  travelStyle: string; setTravelStyle: (v: string) => void
}

export default function CommunitySection(p: Props) {
  return (
    <div>
      <Card title="Community fit">
        <Field label="Ideal community vibe" hint="Describe the feeling, culture, and pace of your ideal place">
          <textarea value={p.idealCommunityVibe} onChange={e => p.setIdealCommunityVibe(e.target.value)} rows={4}
            placeholder="e.g. A small community of 20-30 people with a strong ecology focus, regular shared meals, and a commitment to non-hierarchical governance..." />
        </Field>
        <Field label="Deal breakers" hint="What would make a community not the right fit for you?">
          <textarea value={p.dealBreakers} onChange={e => p.setDealBreakers(e.target.value)} rows={3}
            placeholder="e.g. Strong religious dogma, top-down leadership, no children policy..." />
        </Field>
      </Card>

      <Card title="Travel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: p.openToTravel ? 20 : 0 }}>
          <button type="button" onClick={() => p.setOpenToTravel(!p.openToTravel)} style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            background: 'none', border: 'none', padding: 0,
          }}>
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: p.openToTravel ? 'var(--accent)' : 'var(--rule)',
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: p.openToTravel ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-2)' }}>
              Open to visiting communities
            </span>
          </button>
        </div>
        {p.openToTravel && (
          <Field label="Travel style" hint="How do you like to visit communities?">
            <input value={p.travelStyle} onChange={e => p.setTravelStyle(e.target.value)}
              placeholder="e.g. Short visits (1-2 weeks), prefer to work-exchange, open to solo or with partner..." />
          </Field>
        )}
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '22px', marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--ink-2)' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, marginTop: 5, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
  )
}

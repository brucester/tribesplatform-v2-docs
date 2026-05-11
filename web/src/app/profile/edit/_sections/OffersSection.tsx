'use client'

type EditOffer = { id?: string; category: string; title: string; description: string }
type EditRequest = { id?: string; category: string; title: string; description: string }
type EditTravel = { id?: string; location: string; date_from: string; date_to: string; description: string }

const OFFER_CATEGORIES = ['skills', 'resources', 'funding', 'space', 'labor', 'expertise']
const REQUEST_CATEGORIES = ['community', 'connection', 'skill', 'resource', 'opportunity']

interface Props {
  offers: EditOffer[]; setOffers: (v: EditOffer[]) => void
  requests: EditRequest[]; setRequests: (v: EditRequest[]) => void
  travel: EditTravel[]; setTravel: (v: EditTravel[]) => void
}

export default function OffersSection({ offers, setOffers, requests, setRequests, travel, setTravel }: Props) {
  return (
    <div>
      <ListCard
        title="What you offer" emoji="🌱"
        onAdd={() => setOffers([...offers, { category: 'skills', title: '', description: '' }])}>
        {offers.map((o, i) => (
          <ItemCard key={i}
            categories={OFFER_CATEGORIES} category={o.category} title={o.title} description={o.description}
            titlePlaceholder="e.g. Permaculture design, natural building, facilitation..."
            onCategoryChange={v => setOffers(offers.map((x, j) => j === i ? { ...x, category: v } : x))}
            onTitleChange={v => setOffers(offers.map((x, j) => j === i ? { ...x, title: v } : x))}
            onDescChange={v => setOffers(offers.map((x, j) => j === i ? { ...x, description: v } : x))}
            onRemove={() => setOffers(offers.filter((_, j) => j !== i))}
          />
        ))}
      </ListCard>

      <ListCard
        title="What you seek" emoji="🔍"
        onAdd={() => setRequests([...requests, { category: 'community', title: '', description: '' }])}>
        {requests.map((r, i) => (
          <ItemCard key={i}
            categories={REQUEST_CATEGORIES} category={r.category} title={r.title} description={r.description}
            titlePlaceholder="e.g. Co-founders for Costa Rica, land partner, investors..."
            onCategoryChange={v => setRequests(requests.map((x, j) => j === i ? { ...x, category: v } : x))}
            onTitleChange={v => setRequests(requests.map((x, j) => j === i ? { ...x, title: v } : x))}
            onDescChange={v => setRequests(requests.map((x, j) => j === i ? { ...x, description: v } : x))}
            onRemove={() => setRequests(requests.filter((_, j) => j !== i))}
          />
        ))}
      </ListCard>

      <ListCard
        title="Travel plans" emoji="✈️"
        onAdd={() => setTravel([...travel, { location: '', date_from: '', date_to: '', description: '' }])}>
        {travel.map((t, i) => (
          <div key={i} style={{
            background: 'var(--bg)', border: '1px solid var(--rule)',
            borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 8 }}>
              <input value={t.location} placeholder="Location or region"
                onChange={e => setTravel(travel.map((x, j) => j === i ? { ...x, location: e.target.value } : x))} />
              <input type="date" value={t.date_from}
                onChange={e => setTravel(travel.map((x, j) => j === i ? { ...x, date_from: e.target.value } : x))} />
              <input type="date" value={t.date_to}
                onChange={e => setTravel(travel.map((x, j) => j === i ? { ...x, date_to: e.target.value } : x))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={t.description} placeholder="Notes (optional)" style={{ flex: 1 }}
                onChange={e => setTravel(travel.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <button type="button" onClick={() => setTravel(travel.filter((_, j) => j !== i))} style={{
                background: 'none', border: '1px solid var(--rule)', borderRadius: 'var(--radius)',
                color: 'var(--ink-3)', padding: '0 10px', cursor: 'pointer', fontSize: 13,
              }}>Remove</button>
            </div>
          </div>
        ))}
      </ListCard>
    </div>
  )
}

function ListCard({ title, emoji, onAdd, children }: {
  title: string; emoji: string; onAdd: () => void; children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '22px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          {emoji} {title}
        </div>
        <button type="button" onClick={onAdd} style={{
          fontSize: 12.5, fontWeight: 600, color: 'var(--accent)',
          background: 'var(--accent-soft)', border: 'none',
          padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
        }}>+ Add</button>
      </div>
      {children}
    </div>
  )
}

function ItemCard({ categories, category, title, description, titlePlaceholder,
  onCategoryChange, onTitleChange, onDescChange, onRemove }: {
  categories: string[]; category: string; title: string; description: string
  titlePlaceholder: string
  onCategoryChange: (v: string) => void
  onTitleChange: (v: string) => void
  onDescChange: (v: string) => void
  onRemove: () => void
}) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8 }}>
        <select value={category} onChange={e => onCategoryChange(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={title} placeholder={titlePlaceholder} onChange={e => onTitleChange(e.target.value)} />
        <button type="button" onClick={onRemove} style={{
          background: 'none', border: '1px solid var(--rule)', borderRadius: 'var(--radius)',
          color: 'var(--ink-3)', padding: '0 10px', cursor: 'pointer', fontSize: 13,
        }}>Remove</button>
      </div>
      <input value={description} placeholder="A bit more detail (optional)"
        onChange={e => onDescChange(e.target.value)} />
    </div>
  )
}

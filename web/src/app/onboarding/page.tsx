'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserStatus } from '@/types/database'

const STATUS_OPTIONS: { value: UserStatus; label: string; desc: string }[] = [
  { value: 'looking',   label: 'Actively looking',    desc: 'Seeking a community to join or build' },
  { value: 'open',      label: 'Open to connections', desc: 'Not urgently searching, but open' },
  { value: 'building',  label: 'Building now',        desc: 'Actively starting or building a community' },
  { value: 'traveling', label: 'Traveling',           desc: 'On the road, visiting communities' },
  { value: 'settled',   label: 'Settled',             desc: 'Living in a community already' },
]

const OFFER_CATEGORIES = ['skills', 'resources', 'funding', 'space', 'labor', 'expertise']
const REQUEST_CATEGORIES = ['community', 'connection', 'skill', 'resource', 'opportunity']

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<UserStatus>('open')
  const [usernameError, setUsernameError] = useState('')

  const [offers, setOffers] = useState([{ category: 'skills', title: '', description: '' }])
  const [requests, setRequests] = useState([{ category: 'community', title: '', description: '' }])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUserId(data.user.id)
      const emailName = data.user.email?.split('@')[0] ?? ''
      setDisplayName(emailName)
      setUsername(emailName.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    })
  }, [])

  const checkUsername = async (val: string) => {
    if (!val || val.length < 3) { setUsernameError('Must be at least 3 characters'); return }
    if (!/^[a-z0-9_]+$/.test(val)) { setUsernameError('Only lowercase letters, numbers, underscores'); return }
    const { data } = await supabase.from('user_profiles').select('username').eq('username', val).maybeSingle()
    setUsernameError(data ? 'Username is taken' : '')
  }

  const saveProfile = async () => {
    if (!userId || usernameError) return
    setLoading(true)
    await supabase.from('user_profiles').upsert({
      id: userId, username, display_name: displayName,
      pronouns: pronouns || null, bio: bio || null,
      current_location: location || null, status,
    })
    setStep(2)
    setLoading(false)
  }

  const saveOffersRequests = async () => {
    if (!userId) return
    setLoading(true)
    const validOffers = offers.filter(o => o.title.trim())
    const validRequests = requests.filter(r => r.title.trim())
    if (validOffers.length)
      await supabase.from('user_offers').insert(validOffers.map(o => ({ ...o, user_id: userId })))
    if (validRequests.length)
      await supabase.from('user_requests').insert(validRequests.map(r => ({ ...r, user_id: userId })))
    router.push(`/u/${username}`)
  }

  return (
    <div style={{ minHeight: '80vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step >= n ? 'var(--accent)' : 'var(--rule)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>Create your profile</h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 32 }}>
              This is your public presence in the MyCoNet.
            </p>

            <Field label="Display name" required>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Username" required hint={usernameError || 'Your public URL: /u/username'} error={!!usernameError}>
              <input value={username}
                onChange={e => { setUsername(e.target.value); checkUsername(e.target.value) }}
                placeholder="your_username" />
            </Field>
            <Field label="Pronouns">
              <input value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="they/them, she/her, he/him..." />
            </Field>
            <Field label="Current location">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, country or region" />
            </Field>
            <Field label="Status" hint="How are you showing up right now?">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} type="button" onClick={() => setStatus(s.value)} style={{
                    padding: '12px 14px', borderRadius: 'var(--radius)', textAlign: 'left', cursor: 'pointer',
                    border: `2px solid ${status === s.value ? 'var(--accent)' : 'var(--rule)'}`,
                    background: status === s.value ? 'var(--accent-soft)' : 'var(--surface)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: status === s.value ? 'var(--accent)' : 'var(--ink)' }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Bio" hint="What brings you to regenerative living?">
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                placeholder="A few sentences about who you are and where you're heading..." />
            </Field>
            <button onClick={saveProfile} disabled={loading || !displayName || !username || !!usernameError}
              style={{
                width: '100%', background: 'var(--accent)', color: '#fff',
                fontWeight: 600, fontSize: 15, padding: '13px',
                borderRadius: 'var(--radius)', border: 'none', marginTop: 8,
                opacity: (loading || !displayName || !username || !!usernameError) ? 0.5 : 1,
              }}>
              {loading ? 'Saving...' : 'Next: Offers & requests'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>Offers & requests</h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 32 }}>
              These are the heart of the matching system. You can always edit later.
            </p>

            {/* Offers */}
            <ListSection label="What you offer" emoji="🌱" sub="Skills, resources, land, funding, expertise..."
              onAdd={() => setOffers(o => [...o, { category: 'skills', title: '', description: '' }])}>
              {offers.map((o, i) => (
                <ItemRow key={i}
                  categories={OFFER_CATEGORIES} category={o.category}
                  title={o.title} description={o.description}
                  titlePlaceholder="e.g. Permaculture design"
                  onCategoryChange={v => setOffers(arr => arr.map((x, j) => j === i ? { ...x, category: v } : x))}
                  onTitleChange={v => setOffers(arr => arr.map((x, j) => j === i ? { ...x, title: v } : x))}
                  onDescChange={v => setOffers(arr => arr.map((x, j) => j === i ? { ...x, description: v } : x))}
                />
              ))}
            </ListSection>

            {/* Requests */}
            <ListSection label="What you seek" emoji="🔍" sub="Community, skills, co-founders, resources..."
              onAdd={() => setRequests(r => [...r, { category: 'community', title: '', description: '' }])}>
              {requests.map((r, i) => (
                <ItemRow key={i}
                  categories={REQUEST_CATEGORIES} category={r.category}
                  title={r.title} description={r.description}
                  titlePlaceholder="e.g. Co-founders for Costa Rica"
                  onCategoryChange={v => setRequests(arr => arr.map((x, j) => j === i ? { ...x, category: v } : x))}
                  onTitleChange={v => setRequests(arr => arr.map((x, j) => j === i ? { ...x, title: v } : x))}
                  onDescChange={v => setRequests(arr => arr.map((x, j) => j === i ? { ...x, description: v } : x))}
                />
              ))}
            </ListSection>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{
                padding: '12px 20px', borderRadius: 'var(--radius)',
                border: '1px solid var(--rule)', background: 'var(--surface)',
                color: 'var(--ink-2)', fontWeight: 500, fontSize: 14,
              }}>Back</button>
              <button onClick={saveOffersRequests} disabled={loading} style={{
                flex: 1, background: 'var(--accent)', color: '#fff',
                fontWeight: 600, fontSize: 15, padding: '13px',
                borderRadius: 'var(--radius)', border: 'none', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Saving...' : 'View my profile'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12 }}>
              You can skip this and add offers/requests from your profile later.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children, hint, required, error }: {
  label: string; children: React.ReactNode; hint?: string; required?: boolean; error?: boolean
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--ink-2)' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, marginTop: 5, color: error ? '#ef4444' : 'var(--ink-3)' }}>{hint}</div>}
    </div>
  )
}

function ListSection({ label, emoji, sub, onAdd, children }: {
  label: string; emoji: string; sub: string; onAdd: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{emoji} {label}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{sub}</div>
        </div>
        <button onClick={onAdd} style={{
          fontSize: 12.5, color: 'var(--accent)', background: 'var(--accent-soft)',
          border: 'none', padding: '5px 12px', borderRadius: 20, fontWeight: 600,
        }}>+ Add</button>
      </div>
      {children}
    </div>
  )
}

function ItemRow({ categories, category, title, description, titlePlaceholder,
  onCategoryChange, onTitleChange, onDescChange }: {
  categories: string[]; category: string; title: string; description: string
  titlePlaceholder: string
  onCategoryChange: (v: string) => void
  onTitleChange: (v: string) => void
  onDescChange: (v: string) => void
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius)', padding: '16px', marginBottom: 12,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
        <select value={category} onChange={e => onCategoryChange(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={title} placeholder={titlePlaceholder} onChange={e => onTitleChange(e.target.value)} />
      </div>
      <input value={description} placeholder="A bit more detail (optional)" onChange={e => onDescChange(e.target.value)} />
    </div>
  )
}

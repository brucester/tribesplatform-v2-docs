'use client'
import type { RefObject, ChangeEvent } from 'react'
import type { UserStatus } from '@/types/database'

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'looking',   label: 'Actively looking' },
  { value: 'open',      label: 'Open to connections' },
  { value: 'building',  label: 'Building now' },
  { value: 'traveling', label: 'Traveling' },
  { value: 'settled',   label: 'Settled' },
]

const USER_TYPES = [
  'Founder / Co-creator', 'Community builder', 'Investor', 'Skilled contributor',
  'Land steward', 'Community seeker', 'Digital nomad', 'Facilitator / Coach',
  'Artist / Creative', 'Healer / Therapist', 'Teacher / Educator', 'Researcher',
]

interface Props {
  avatarUrl: string | null
  avatarUploading: boolean
  fileRef: RefObject<HTMLInputElement | null>
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void
  displayName: string; setDisplayName: (v: string) => void
  pronouns: string; setPronouns: (v: string) => void
  location: string; setLocation: (v: string) => void
  status: UserStatus; setStatus: (v: UserStatus) => void
  bio: string; setBio: (v: string) => void
  websiteUrl: string; setWebsiteUrl: (v: string) => void
  instagram: string; setInstagram: (v: string) => void
  userTypes: string[]; setUserTypes: (v: string[]) => void
}

export default function BasicSection(p: Props) {
  const toggle = (arr: string[], item: string, set: (v: string[]) => void) =>
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])

  return (
    <div>
      <input ref={p.fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={p.onAvatarChange} />
      <Card title="Avatar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-soft)', border: '2px solid var(--rule)',
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, color: 'var(--accent)',
          }}>
            {p.avatarUrl
              ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (p.displayName?.[0] ?? '?').toUpperCase()
            }
          </div>
          <div>
            <button type="button" onClick={() => p.fileRef.current?.click()}
              disabled={p.avatarUploading}
              style={{
                fontSize: 13, fontWeight: 500, padding: '7px 14px',
                borderRadius: 'var(--radius)', border: '1px solid var(--rule)',
                background: 'var(--surface)', color: 'var(--ink-2)', cursor: 'pointer',
                opacity: p.avatarUploading ? 0.6 : 1,
              }}>
              {p.avatarUploading ? 'Uploading...' : 'Upload photo'}
            </button>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>
              JPG, PNG or WebP. Max 5MB.
            </div>
          </div>
        </div>
      </Card>

      <Card title="Identity">
        <TwoCol>
          <Field label="Display name">
            <input value={p.displayName} onChange={e => p.setDisplayName(e.target.value)} />
          </Field>
          <Field label="Pronouns">
            <input value={p.pronouns} onChange={e => p.setPronouns(e.target.value)} placeholder="they/them, she/her..." />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Current location">
            <input value={p.location} onChange={e => p.setLocation(e.target.value)} placeholder="City, country or region" />
          </Field>
          <Field label="Status">
            <select value={p.status} onChange={e => p.setStatus(e.target.value as UserStatus)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </TwoCol>
        <Field label="Bio" hint="What brings you to regenerative living?">
          <textarea value={p.bio} rows={4} onChange={e => p.setBio(e.target.value)}
            placeholder="A few sentences about who you are and where you're heading..." />
        </Field>
        <TwoCol>
          <Field label="Website">
            <input value={p.websiteUrl} onChange={e => p.setWebsiteUrl(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Instagram">
            <input value={p.instagram} onChange={e => p.setInstagram(e.target.value)} placeholder="@handle" />
          </Field>
        </TwoCol>
      </Card>

      <Card title="I am a...">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {USER_TYPES.map(t => (
            <Toggle key={t} label={t}
              selected={p.userTypes.includes(t)}
              onClick={() => toggle(p.userTypes, t, p.setUserTypes)}
            />
          ))}
        </div>
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
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 18 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>{children}</div>
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

function Toggle({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5,
      border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--rule)'}`,
      background: selected ? 'var(--accent-soft)' : 'transparent',
      color: selected ? 'var(--accent)' : 'var(--ink-3)',
      fontWeight: selected ? 600 : 400, transition: 'all 0.1s',
    }}>{label}</button>
  )
}

'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { computeMatch, type Bio } from '@/lib/match-score'

const STATUS_OPTIONS = ['All', 'explorer', 'building', 'settled', 'visiting']
const TYPE_LABELS: Record<string, string> = {
  founder: 'Founder', builder: 'Builder', investor: 'Investor',
  designer: 'Designer', technologist: 'Technologist', farmer: 'Farmer',
  educator: 'Educator', healer: 'Healer', artist: 'Artist',
  researcher: 'Researcher', parent: 'Parent', elder: 'Elder',
}

interface Profile {
  user_id: string
  username: string
  display_name: string | null
  pronouns: string | null
  location: string | null
  status: string | null
  bio: string | null
  avatar_url: string | null
  user_types: string[] | null
}

interface Props {
  profiles: Profile[]
  bioMap: Record<string, NonNullable<Bio>>
  myBio: Bio
  myUsername: string | null
  isLoggedIn: boolean
}

export default function DiscoverClient({ profiles, bioMap, myBio, isLoggedIn }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('')

  const members = useMemo(() => {
    let list = profiles.map(p => {
      const bio = bioMap[p.user_id] ?? null
      const { score, reasons } = computeMatch(myBio, bio)
      return { profile: p, bio, score, reasons }
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(({ profile: p, bio }) =>
        (p.display_name ?? '').toLowerCase().includes(q) ||
        (p.username ?? '').toLowerCase().includes(q) ||
        (p.location ?? '').toLowerCase().includes(q) ||
        (p.bio ?? '').toLowerCase().includes(q) ||
        (bio?.skills ?? []).some(s => s.toLowerCase().includes(q)) ||
        (bio?.interests ?? []).some(i => i.toLowerCase().includes(q))
      )
    }

    if (statusFilter !== 'All') {
      list = list.filter(({ profile: p }) => p.status === statusFilter)
    }

    if (typeFilter) {
      list = list.filter(({ profile: p }) => (p.user_types ?? []).includes(typeFilter))
    }

    return list.sort((a, b) => b.score - a.score)
  }, [profiles, bioMap, myBio, search, statusFilter, typeFilter])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 6px' }}>Community Network</h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, margin: 0 }}>
          {profiles.length} {profiles.length === 1 ? 'member' : 'members'} building regenerative communities
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, location, skills..."
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 130 }}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Member grid */}
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-3)', fontSize: 14 }}>
          No members match your filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {members.map(({ profile: p, bio, score, reasons }) => (
            <MemberCard key={p.user_id} profile={p} bio={bio} score={score} reasons={reasons} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}

      {!isLoggedIn && (
        <div style={{
          marginTop: 48, padding: '28px', borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-soft)', border: '1px solid rgba(16,185,129,0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 8 }}>
            Join to see compatibility scores
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 18 }}>
            Create a profile to discover your best community matches.
          </div>
          <Link href="/auth/signup" style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 'var(--radius)',
            background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13.5,
            textDecoration: 'none',
          }}>Create profile</Link>
        </div>
      )}
    </div>
  )
}

function MemberCard({ profile: p, bio, score, reasons, isLoggedIn }: {
  profile: Profile; bio: NonNullable<Bio> | null; score: number; reasons: string[]; isLoggedIn: boolean
}) {
  const initial = (p.display_name ?? p.username ?? '?')[0].toUpperCase()

  return (
    <Link href={`/u/${p.username}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rule)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
            }}>{initial}</div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.display_name ?? p.username}
            </div>
            {p.pronouns && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginBottom: 2 }}>{p.pronouns}</div>
            )}
            {p.location && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>📍 {p.location}</div>
            )}
          </div>
        </div>

        {p.bio && (
          <p style={{
            fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 14px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{p.bio}</p>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(p.user_types ?? []).slice(0, 3).map(t => (
            <span key={t} style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 20,
              background: 'var(--surface)', border: '1px solid var(--rule)',
              color: 'var(--ink-3)', fontWeight: 500,
            }}>{TYPE_LABELS[t] ?? t}</span>
          ))}
          {p.status && (
            <span className={`status-badge status-${p.status}`}>{p.status}</span>
          )}
        </div>

        {isLoggedIn && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 12, borderTop: '1px solid var(--rule)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {reasons[0] ?? 'No overlap yet'}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: score >= 60 ? 'var(--accent)' : score >= 30 ? 'var(--warn)' : 'var(--ink-3)',
            }}>{score}%</div>
          </div>
        )}
      </div>
    </Link>
  )
}

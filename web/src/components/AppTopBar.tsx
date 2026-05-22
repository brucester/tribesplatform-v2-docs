'use client'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useProfileCompletion } from '@/contexts/ProfileCompletion'

function computeCompletion(
  p: { first_name?: string | null; avatar_url?: string | null; headline?: string | null; city?: string | null; user_types?: string[] | null } | null,
  b: { values_principles?: string | null; skills?: string[] | null; goals?: string | null; places_traveling?: unknown[] | null } | null,
  offerCount: number,
  requestCount: number,
): number {
  const checks = [
    !!p?.avatar_url,
    !!p?.first_name,
    !!p?.headline,
    !!p?.city,
    (p?.user_types?.length ?? 0) > 0,
    !!b?.values_principles,
    (b?.skills?.length ?? 0) > 0,
    !!b?.goals,
    offerCount > 0,
    requestCount > 0,
    (b?.places_traveling?.length ?? 0) > 0,
  ]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

export default function AppTopBar() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const { pct: profilePct, setPct: setProfilePct } = useProfileCompletion()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        Promise.all([
          supabase.from('user_profiles')
            .select('first_name, last_name, avatar_url, headline, city, user_types')
            .eq('id', data.user.id).single(),
          supabase.from('user_bio')
            .select('values_principles, skills, goals, places_traveling')
            .eq('user_id', data.user.id).maybeSingle(),
          supabase.from('user_offers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', data.user.id).eq('is_active', true),
          supabase.from('user_requests')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', data.user.id).eq('is_active', true),
        ]).then(([profileRes, bioRes, offersRes, requestsRes]) => {
          const p = profileRes.data
          if (p) {
            setDisplayName([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Member')
            setAvatarUrl(p.avatar_url ?? null)
          }
          const pct = computeCompletion(
            p,
            bioRes.data,
            offersRes.count ?? 0,
            requestsRes.count ?? 0,
          )
          setProfilePct(pct)
        })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setDisplayName(''); setAvatarUrl(null); setProfilePct(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const initials = displayName.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  const showBar = user && profilePct !== null && profilePct < 100

  return (
    <header style={{
      gridColumn: '1 / -1',
      display: 'flex',
      flexDirection: 'column',
      borderBottom: '1px solid var(--rule)',
      background: 'var(--surface)',
      zIndex: 10,
      flexShrink: 0,
    }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', flex: 1 }}>
      {/* Brand */}
      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: 'radial-gradient(circle at 30% 30%, var(--accent-color), color-mix(in srgb, var(--accent-color) 60%, #000))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>MyCoNet</span>
            <span style={{ color: 'var(--ink-4)', fontWeight: 400, fontSize: 14 }}>/</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
              MyCommunityNetwork
            </span>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
            v3.01
          </span>
        </div>
      </Link>

      {/* Search */}
      <div style={{
        flex: 1,
        maxWidth: 360,
        marginLeft: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        border: '1px solid var(--rule)',
        borderRadius: 999,
        background: 'var(--bg-2)',
        color: 'var(--ink-3)',
        fontSize: 12.5,
        cursor: 'text',
        userSelect: 'none',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" />
          <line x1="20" y1="20" x2="16.6" y2="16.6" />
        </svg>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Search residents, projects, proposals…
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)', padding: '1px 5px', border: '1px solid var(--rule)', borderRadius: 4, flexShrink: 0 }}>⌘K</span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
        {/* Bell */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          background: 'var(--bg-2)', color: 'var(--ink-2)',
          position: 'relative', cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
          <div style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--m9)', border: '2px solid var(--surface)' }} />
        </div>

        {/* User pill */}
        {user ? (
          <Link href="/profile/edit" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 10px 4px 4px', borderRadius: 999, background: 'var(--bg-2)',
            fontSize: 12, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', flexShrink: 0,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--m1), var(--m4))',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontSize: 10.5, fontWeight: 700, overflow: 'hidden',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <span>{displayName || 'Member'}</span>
          </Link>
        ) : (
          <Link href="/auth/login" style={{
            fontSize: 13, color: 'var(--ink-2)', padding: '5px 12px',
            borderRadius: 8, border: '1px solid var(--rule)',
            fontWeight: 500, textDecoration: 'none',
          }}>
            Sign in
          </Link>
        )}
      </div>
      </div>

      {/* Profile completion bar */}
      {showBar && (
        <Link href="/profile/edit" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ position: 'relative', height: 22, background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', cursor: 'pointer' }}>
            {/* Fill */}
            <div style={{
              position: 'absolute', inset: '0 auto 0 0',
              width: `${profilePct}%`,
              background: profilePct! >= 80
                ? 'color-mix(in srgb, var(--m1) 30%, transparent)'
                : 'color-mix(in srgb, var(--accent-color) 22%, transparent)',
              transition: 'width 600ms ease',
            }} />
            {/* Label */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
              color: 'var(--ink-3)', letterSpacing: '0.04em',
            }}>
              <span style={{
                width: 22, height: 22,
                borderRadius: '50%', background: 'var(--accent-color)',
                color: '#fff', display: 'grid', placeItems: 'center',
                fontSize: 8, fontWeight: 800, flexShrink: 0,
              }}>{profilePct}%</span>
              profile complete — finish it →
            </div>
          </div>
        </Link>
      )}
    </header>
  )
}

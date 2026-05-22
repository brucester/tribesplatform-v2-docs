'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/core/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from '@/core/components/ThemeToggle'
import { MODULES } from '@/core/lib/modules'

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('user_profiles')
          .select('username, avatar_url, first_name')
          .eq('id', data.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) { setUsername(p.username); setAvatarUrl(p.avatar_url); setDisplayName(p.first_name) }
          })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setUsername(null); setAvatarUrl(null); setDisplayName(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Landing page has its own nav bar
  if (pathname === '/') return null

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleModuleClick = (m: typeof MODULES[0]) => {
    setOpen(false)
    if (!m.href) {
      // Scroll to card on home page
      if (pathname === '/') {
        const el = document.getElementById(`module-${m.num}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        router.push(`/#module-${m.num}`)
      }
    }
  }

  return (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--rule)',
      position: 'sticky', top: 0, zIndex: 100,
    }} ref={menuRef}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 16px',
        height: 52, display: 'flex', alignItems: 'center', gap: 8,
      }}>

        {/* Brand */}
        <Link href={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700,
          }}>M</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1 }}>MyCoNet</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MyCommunityNetwork</div>
          </div>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Auth — desktop only */}
        <div className="nav-auth-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--ink-2)', padding: '5px 10px', borderRadius: 'var(--radius)', fontWeight: 500 }}>Dashboard</Link>
              {username && (
                <Link href={`/u/${username}`} style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 'var(--radius)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-soft)', border: '1.5px solid var(--rule)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--accent)' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (displayName?.[0] ?? username[0]).toUpperCase()}
                  </div>
                </Link>
              )}
              <button onClick={signOut} style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '5px 10px', borderRadius: 'var(--radius)', background: 'none', border: 'none' }}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" style={{ fontSize: 13, color: 'var(--ink-2)', padding: '5px 10px', borderRadius: 'var(--radius)', fontWeight: 500 }}>Sign in</Link>
              <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--primary)', padding: '7px 16px', borderRadius: 'var(--radius)' }}>Join</Link>
            </>
          )}
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            gap: 5, width: 36, height: 36, background: open ? 'var(--bg-2)' : 'none',
            border: '1px solid var(--rule)', borderRadius: 'var(--radius)',
            cursor: 'pointer', padding: 8, flexShrink: 0,
          }}
        >
          <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink-2)', borderRadius: 2, transition: 'transform 200ms, opacity 200ms', transform: open ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink-2)', borderRadius: 2, transition: 'opacity 200ms', opacity: open ? 0 : 1 }} />
          <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink-2)', borderRadius: 2, transition: 'transform 200ms, opacity 200ms', transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute', top: 52, left: 0, right: 0,
          background: 'var(--surface)', borderBottom: '1px solid var(--rule)',
          boxShadow: 'var(--shadow-lg)', zIndex: 99,
          maxHeight: 'calc(100vh - 52px)', overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}>

            {/* Module grid */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 10 }}>
                Modules
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
                {MODULES.map(m => {
                  const isExternal = m.external
                  const content = (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 'var(--radius)',
                      border: `1px solid var(--rule)`, borderLeft: `3px solid ${m.color}`,
                      background: 'var(--bg)', cursor: m.href ? 'pointer' : 'default',
                      transition: 'background 100ms',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: m.color, fontWeight: 700 }}>M{m.num}</span>
                          {m.live && (
                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', background: m.version ? m.color : 'var(--accent)', padding: '1px 5px', borderRadius: 10 }}>
                              {m.version ?? 'Live'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      </div>
                      {m.href && (
                        <span style={{ color: 'var(--ink-4)', fontSize: 10, flexShrink: 0 }}>
                          {isExternal ? '↗' : '→'}
                        </span>
                      )}
                    </div>
                  )

                  if (m.href) {
                    return (
                      <a key={m.num} href={m.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        onClick={() => setOpen(false)}
                        style={{ textDecoration: 'none', display: 'block' }}
                        className="nav-module-link">
                        {content}
                      </a>
                    )
                  }
                  return (
                    <button key={m.num}
                      onClick={() => handleModuleClick(m)}
                      style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, width: '100%' }}
                      className="nav-module-link">
                      {content}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--rule)', margin: '12px 0' }} />

            {/* Bottom row: changelog + auth */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Link href="/changelog" onClick={() => setOpen(false)} style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                📋 Changelog
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThemeToggle />
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>Dashboard</Link>
                    {username && <Link href={`/u/${username}`} onClick={() => setOpen(false)} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>Profile</Link>}
                    <Link href="/profile/edit" onClick={() => setOpen(false)} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>Edit profile</Link>
                    <button onClick={signOut} style={{ fontSize: 13, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setOpen(false)} style={{ fontSize: 13, color: 'var(--ink-2)', padding: '6px 12px', borderRadius: 'var(--radius)', fontWeight: 500, border: '1px solid var(--rule)' }}>Sign in</Link>
                    <Link href="/auth/signup" onClick={() => setOpen(false)} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--primary)', padding: '6px 14px', borderRadius: 'var(--radius)' }}>Join</Link>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </nav>
  )
}

'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

const MODULE_LINKS = [
  { href: '/network', label: 'Network' },
  { href: '/blueprint', label: 'Blueprint' },
]

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('user_profiles')
          .select('username, avatar_url, display_name')
          .eq('id', data.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) {
              setUsername(p.username)
              setAvatarUrl(p.avatar_url)
              setDisplayName(p.display_name)
            }
          })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setUsername(null); setAvatarUrl(null); setDisplayName(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--rule)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: 52, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 12, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700,
          }}>T</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1 }}>
              Tribes Platform
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              v2
            </div>
          </div>
        </Link>

        {/* Module links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {MODULE_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : 'var(--ink-2)',
                padding: '5px 10px', borderRadius: 'var(--radius)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                transition: 'all 0.1s',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {user ? (
            <>
              {username && (
                <Link href={`/u/${username}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 10px', borderRadius: 'var(--radius)',
                  color: 'var(--ink-2)', fontSize: 13, fontWeight: 500,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--accent-soft)', border: '1.5px solid var(--rule)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, color: 'var(--accent)', flexShrink: 0,
                  }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (displayName?.[0] ?? username[0]).toUpperCase()
                    }
                  </div>
                  <span style={{ display: 'none' }}>Profile</span>
                </Link>
              )}
              <Link href="/profile/edit" style={{
                fontSize: 13, color: 'var(--ink-2)', padding: '5px 10px',
                borderRadius: 'var(--radius)', fontWeight: 500,
              }}>
                Edit
              </Link>
              <ThemeToggle />
              <button onClick={signOut} style={{
                fontSize: 12.5, color: 'var(--ink-3)', padding: '5px 10px',
                borderRadius: 'var(--radius)', background: 'none', border: 'none',
              }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/auth/login" style={{
                fontSize: 13, color: 'var(--ink-2)', padding: '5px 10px',
                borderRadius: 'var(--radius)', fontWeight: 500,
              }}>
                Sign in
              </Link>
              <Link href="/auth/signup" style={{
                fontSize: 13, fontWeight: 600, color: '#fff',
                background: 'var(--accent)', padding: '7px 16px',
                borderRadius: 'var(--radius)',
              }}>
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

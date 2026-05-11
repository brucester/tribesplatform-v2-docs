'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
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
      if (!session?.user) setUsername(null)
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
      background: 'var(--surface)',
      borderBottom: '1px solid var(--rule)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: 52, display: 'flex', alignItems: 'center',
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <img src="/regen-logo.png" alt="Regen Tribe"
            style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1 }}>
              Regen Neighborhood
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Network v1
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {user ? (
            <>
              <NavLink href="/discover">Discover</NavLink>
              {username && (
                <a href={`/u/${username}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 500 }}>
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
                  My Profile
                </a>
              )}
              <NavLink href="/profile/edit">Edit</NavLink>
              <ThemeToggle />
              <button onClick={signOut} style={{
                fontSize: 12.5, color: 'var(--ink-3)', padding: '5px 10px',
                borderRadius: 'var(--radius)', background: 'none', border: 'none',
                marginLeft: 4,
              }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink href="/discover">Discover</NavLink>
              <ThemeToggle />
              <NavLink href="/auth/login">Sign in</NavLink>
              <Link href="/auth/signup" style={{
                fontSize: 13, fontWeight: 600, color: '#fff',
                background: 'var(--accent)', padding: '7px 16px',
                borderRadius: 'var(--radius)', marginLeft: 4,
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      fontSize: 13, color: 'var(--ink-2)', padding: '5px 10px',
      borderRadius: 'var(--radius)', fontWeight: 500,
    }}>
      {children}
    </Link>
  )
}

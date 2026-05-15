import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Gift, HelpCircle, Search, ArrowRight } from 'lucide-react'

export default async function NetworkDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [memberCountRes, recentRes, offersRes, seeksRes, profileRes] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles')
      .select('id, username, first_name, last_name, avatar_url, user_types, city, country')
      .order('created_at', { ascending: false })
      .limit(8),
    user ? supabase.from('user_offers').select('id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    user ? supabase.from('user_requests').select('id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    user ? supabase.from('user_profiles').select('first_name, last_name').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])

  const memberCount = memberCountRes.count ?? 0
  const recentUsers = (recentRes.data ?? []).filter(u => u.id !== user?.id)
  const offersCount = (offersRes as any).data?.length ?? 0
  const seeksCount = (seeksRes as any).data?.length ?? 0
  const profile = (profileRes as any).data
  const displayName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Explorer' : null

  const stats = user
    ? [
        { label: 'Network Members', value: memberCount, icon: User,       description: 'Total members' },
        { label: 'Active Offers',   value: offersCount, icon: Gift,       description: 'You provide' },
        { label: 'Active Requests', value: seeksCount,  icon: HelpCircle, description: 'Help you seek' },
        { label: 'Connections',     value: '—',         icon: Search,     description: 'Coming soon' },
      ]
    : [
        { label: 'Network Members', value: memberCount, icon: User,       description: 'Growing community' },
        { label: 'Skill Offers',    value: '—',         icon: Gift,       description: 'Sign in to post' },
        { label: 'Help Requests',   value: '—',         icon: HelpCircle, description: 'Sign in to post' },
        { label: 'Connections',     value: '—',         icon: Search,     description: 'Coming soon' },
      ]

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

      {/* Guest banner */}
      {!user && (
        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
            You're browsing the network as a guest. <strong>Join free</strong> to post your offers, make requests, and connect with people.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/auth/signup" style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--accent)', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>
              Join free
            </Link>
            <Link href="/auth/login" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', padding: '5px 4px' }}>
              Sign in
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {user && displayName ? `Welcome back, ${displayName}!` : 'Community Network'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user ? "Here's what's happening in your regenerative network" : 'Browse the people building regenerative neighborhoods'}
          </p>
        </div>
        <Button asChild>
          <Link href="/network/discover"><Search className="mr-2 h-4 w-4" />Explore Network</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>New in the Network</span>
          <Link href="/network/discover" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {recentUsers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {recentUsers.map((u: any) => {
              const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
              const init = name[0]?.toUpperCase() ?? '?'
              const loc = [u.city, u.country].filter(Boolean).join(', ')
              return (
                <Link key={u.id} href={`/u/${u.username}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-lg)', padding: '18px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    textAlign: 'center', transition: 'box-shadow 120ms, transform 120ms',
                  }} className="hover-elevate">
                    {/* Avatar */}
                    <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--rule)' }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{init}</span>
                      }
                    </div>
                    <div style={{ minWidth: 0, width: '100%' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                      {loc && <p style={{ fontSize: 11, color: 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc}</p>}
                    </div>
                    {(u.user_types ?? []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                        {(u.user_types ?? []).slice(0, 2).map((t: string) => (
                          <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'var(--bg-2)', color: 'var(--ink-3)', border: '1px solid var(--rule)' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>
            No members yet. Be the first to complete your profile!
          </div>
        )}
      </div>
    </div>
  )
}

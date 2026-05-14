import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

      <Card className="border-card-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">New in the Network</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/network/discover">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentUsers.length > 0 ? recentUsers.map((u: any) => {
            const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
            const init = name[0]?.toUpperCase() ?? '?'
            const loc = [u.city, u.country].filter(Boolean).join(', ')
            return (
              <Link key={u.id} href={`/u/${u.username}`}>
                <div className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{init}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{loc || `@${u.username}`}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {(u.user_types ?? []).slice(0, 2).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              </Link>
            )
          }) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No members yet. Be the first to complete your profile!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

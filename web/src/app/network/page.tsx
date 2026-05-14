import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  User, Gift, HelpCircle, Search, ArrowRight,
  Pencil, CheckCircle2, Circle, Sparkles,
} from 'lucide-react'

export default async function NetworkDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, bioRes, offersRes, seeksRes, recentRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_offers').select('id').eq('user_id', user.id),
    supabase.from('user_requests').select('id').eq('user_id', user.id),
    supabase.from('user_profiles')
      .select('id, username, first_name, last_name, avatar_url, user_types, city, country')
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileRes.data
  const bio = bioRes.data
  const offersCount = offersRes.data?.length ?? 0
  const seeksCount = seeksRes.data?.length ?? 0
  const recentUsers = recentRes.data ?? []

  const pd = bio?.personality_details as any

  const steps = [
    { label: 'Name',        complete: !!(profile?.first_name) },
    { label: 'Headline',    complete: !!(profile?.headline) },
    { label: 'Values',      complete: !!(bio?.values_principles) },
    { label: 'Personality', complete: !!(pd?.myersBriggs) },
    { label: 'Skills',      complete: (bio?.skills?.length || 0) > 0 },
    { label: 'Goals',       complete: !!(bio?.goals) },
    { label: 'Offers',      complete: offersCount > 0 },
  ]
  const completed = steps.filter(s => s.complete).length
  const completeness = Math.round((completed / steps.length) * 100)

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Explorer'

  const stats = [
    { label: 'Network Members', value: recentUsers.length + 1, icon: User,       description: 'Total members' },
    { label: 'Active Offers',   value: offersCount,            icon: Gift,       description: 'You provide' },
    { label: 'Active Requests', value: seeksCount,             icon: HelpCircle, description: 'Help you seek' },
    { label: 'Connections',     value: '—',                    icon: Search,     description: 'Coming soon' },
  ]

  const quickActions = [
    { title: 'Search the Network', description: 'Find people who match your interests', href: '/network/discover', icon: Search },
    { title: 'Complete Your Profile', description: 'Fill in your wizard steps',        href: '/profile/edit',     icon: Pencil },
    { title: 'View Your Matches',   description: 'See your best community matches',   href: '/network/matches',  icon: Sparkles },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {completeness < 60 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Complete your profile to unlock match features</p>
                <p className="text-sm text-muted-foreground mt-1">Add your values, personality, and skills to find your best community matches.</p>
              </div>
              <Button size="sm" asChild>
                <Link href="/profile/edit">Complete Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your regenerative network</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
                  No other members yet. Be the first to complete your profile!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Profile Completeness
              </CardTitle>
              <CardDescription>Complete your profile to improve visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{completed} of {steps.length} complete</span>
                  <span className="font-medium">{completeness}%</span>
                </div>
                <Progress value={completeness} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {steps.map(step => (
                  <div key={step.label} className="flex items-center gap-2 text-sm">
                    {step.complete
                      ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={step.complete ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
                  </div>
                ))}
              </div>
              {completeness < 100 && (
                <Button className="w-full" asChild>
                  <Link href="/profile/edit"><Pencil className="mr-2 h-4 w-4" />Complete Your Profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map(action => (
                <Link key={action.href} href={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

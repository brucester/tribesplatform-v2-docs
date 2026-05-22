import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { computeOverallReadiness, computeGatesPassed, computePhaseProgress, type Values } from '@/app/blueprint/blueprint-compute'

const ROLE_LABELS: Record<string, string> = {
  explorer:     'Explorer',
  joining:      'Joining',
  resident:     'Resident',
  circle_lead:  'Circle Lead',
  project_lead: 'Project Lead',
  admin:        'Admin',
}

const ROLE_ORDER = ['explorer', 'joining', 'resident', 'circle_lead', 'project_lead', 'admin']
const roleRank = (r: string) => ROLE_ORDER.indexOf(r)
function atLeast(userRole: string, minRole: string) {
  return roleRank(userRole) >= roleRank(minRole)
}

type ModuleCard = {
  num: string
  name: string
  desc: string
  color: string
  href: string
  locked: boolean
  cta?: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/home')

  const [
    profileRes, blueprintRes, memberCountRes, projectsRes,
    recentMembersRes, recentProjectsRes, applicationRes,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('blueprints').select('answers, flags, updated_at').eq('is_community', true).maybeSingle(),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('user_profiles')
      .select('id, first_name, last_name, username, avatar_url, created_at')
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('projects')
      .select('id, title, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(2),
    supabase.from('applications').select('status, created_at').eq('user_id', user.id).maybeSingle(),
  ])

  const profile = profileRes.data
  const blueprint = blueprintRes.data as { answers: unknown; flags: unknown; updated_at: string } | null
  const memberCount = memberCountRes.count ?? 0
  const activeProjects = projectsRes.count ?? 0
  const recentMembers = recentMembersRes.data ?? []
  const recentProjects = recentProjectsRes.data ?? []
  const application = applicationRes.data

  const role = (profile as any)?.role ?? 'explorer'
  const displayName = profile?.first_name || 'Explorer'
  const roleLabel = ROLE_LABELS[role] ?? role

  const bpAnswers = (blueprint?.answers ?? {}) as Values
  const overall = blueprint ? computeOverallReadiness(bpAnswers) : null
  const gatesPassed = blueprint ? computeGatesPassed(bpAnswers) : null
  const phaseProgress = blueprint ? computePhaseProgress(bpAnswers) : null
  const currentPhase = phaseProgress?.find(p => p.ratio < 1)?.name ?? 'SPARK'
  const projectName = (bpAnswers.project_name as string) || 'Our Community'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const locked = (minRole: string) => !atLeast(role, minRole)

  const modules: ModuleCard[] = [
    {
      num: '01', name: 'Community Network',
      desc: `${memberCount} members · explore profiles and match`,
      color: 'var(--m1)', href: '/network', locked: false,
    },
    {
      num: '04', name: 'Blueprint',
      desc: overall !== null
        ? `${overall.toFixed(1)}/10 readiness · ${gatesPassed}/4 gates · ${currentPhase} phase`
        : 'Community blueprint not started',
      color: 'var(--m4)', href: '/blueprint', locked: false,
    },
    {
      num: '05', name: 'Join',
      desc: application
        ? `Application ${application.status}`
        : '3 steps · sign the values to become a member',
      color: 'var(--m5)', href: '/join', locked: false,
      cta: application ? undefined : 'Start',
    },
    {
      num: '06', name: 'Agreements',
      desc: `${activeProjects} open project${activeProjects !== 1 ? 's' : ''} · propose collaboration`,
      color: 'var(--m6)', href: '/agreements', locked: locked('joining'),
    },
    {
      num: '07', name: 'Operations',
      desc: `${activeProjects} active project${activeProjects !== 1 ? 's' : ''} · deliverables & sprints`,
      color: 'var(--m7)', href: '/ops', locked: locked('joining'),
    },
    {
      num: '08', name: 'Contributions',
      desc: 'Track points, badges, and logged effort',
      color: 'var(--m8)', href: '/contributions', locked: locked('resident'),
    },
    {
      num: '09', name: 'Governance',
      desc: 'Proposals, consent rounds, and decisions',
      color: 'var(--m9)', href: '/governance', locked: locked('resident'),
    },
  ]

  // Build activity feed from real data
  type FeedItem = { who: string; act: string; when: string; color: string }
  const feed: FeedItem[] = []
  for (const m of recentMembers) {
    const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.username || 'Member'
    const ago = timeAgo(new Date(m.created_at))
    feed.push({ who: name, act: 'joined the community', when: ago, color: 'var(--m5)' })
  }
  for (const p of recentProjects) {
    const ago = timeAgo(new Date(p.created_at))
    feed.push({ who: 'A member', act: `created project "${p.title}"`, when: ago, color: 'var(--m7)' })
  }
  feed.sort((a, b) => 0) // keep as-is (already time-ordered from query)

  const showNextStep = !atLeast(role, 'joining')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 80px' }}>

      {/* Page head */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 8 }}>
          M00 · Dashboard
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(20px, 3vw, 28px)', color: 'var(--ink)', lineHeight: 1.1, margin: '0 0 6px' }}>
              {greeting}, {displayName}.
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              You're {roleLabel === 'Explorer' ? 'an' : 'a'} <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{roleLabel}</span>
              {' '}at <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{projectName}</span>
              {' '}· {memberCount} member{memberCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <Link href="/blueprint" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', padding: '7px 14px', border: '1px solid var(--rule)', borderRadius: 8, textDecoration: 'none', background: 'var(--surface)' }}>
              View blueprint
            </Link>
            {!atLeast(role, 'joining') && (
              <Link href="/join" style={{ fontSize: 13, fontWeight: 700, color: '#fff', padding: '7px 16px', border: 'none', borderRadius: 8, textDecoration: 'none', background: 'var(--m5)' }}>
                Begin joining →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Members" value={String(memberCount)} delta="+4 this week" />
        <StatCard
          label="Blueprint readiness"
          value={overall !== null ? `${overall.toFixed(1)}` : '—'}
          suffix={overall !== null ? '/10' : ''}
          delta={currentPhase + ' phase'}
          deltaColor="var(--m4)"
        />
        <StatCard label="Open projects" value={String(activeProjects)} delta={activeProjects > 0 ? `${Math.min(activeProjects, 2)} need help` : 'None yet'} />
        <StatCard label="Open proposals" value="—" delta="Governance coming soon" deltaColor="var(--m9)" />
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, alignItems: 'start' }}>

        {/* Left — module grid */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>
            Jump into a module
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {modules.map(c => (
              <ModCard key={c.num + c.name} {...c} />
            ))}
          </div>
        </div>

        {/* Right — activity + next step */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Activity feed */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Activity</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>Last 7 days</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feed.length > 0 ? feed.slice(0, 5).map((a, i) => (
                <FeedRow key={i} {...a} />
              )) : (
                <p style={{ fontSize: 12.5, color: 'var(--ink-4)', margin: 0 }}>No recent activity yet.</p>
              )}
            </div>
          </div>

          {/* Next step card */}
          {showNextStep && (
            <div style={{
              background: 'color-mix(in srgb, var(--m5) 6%, var(--surface))',
              border: '1px dashed color-mix(in srgb, var(--m5) 30%, var(--rule))',
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--m5)', letterSpacing: '0.08em', marginBottom: 5 }}>
                NEXT STEP
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>
                {application ? 'Application under review' : 'Sign the community values'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55, marginBottom: 12 }}>
                {application
                  ? 'Your application has been submitted. The admin team will review it and reach out.'
                  : '3 simple steps move you from Explorer to Joining. Unlocks Agreements, Operations, Contributions and Governance.'}
              </div>
              {!application && (
                <Link href="/join" style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--m5)', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
                  Start joining →
                </Link>
              )}
            </div>
          )}

          {/* Member tip if already joined */}
          {atLeast(role, 'joining') && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                Welcome, {roleLabel}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                Agreements, Operations, and more are unlocked. Explore them in the left nav.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, suffix, delta, deltaColor }: {
  label: string; value: string; suffix?: string; delta: string; deltaColor?: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
        {value}
        {suffix && <span style={{ fontSize: 16, color: 'var(--ink-4)' }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: deltaColor ?? 'var(--ink-4)' }}>
        {delta}
      </div>
    </div>
  )
}

function ModCard({ num, name, desc, color, href, locked, cta }: ModuleCard) {
  const inner = (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10,
      padding: '14px 16px', opacity: locked ? 0.55 : 1,
      transition: locked ? 'none' : 'box-shadow 140ms, transform 140ms',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em' }}>
          M{num}
        </span>
        {cta && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: color, padding: '2px 8px', borderRadius: 20 }}>
            {cta}
          </span>
        )}
        {locked && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)' }}>🔒 Resident</span>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  )

  if (locked) return <div style={{ cursor: 'default' }}>{inner}</div>

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  )
}

function FeedRow({ who, act, when, color }: { who: string; act: string; when: string; color: string }) {
  const initials = who.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: color, display: 'grid', placeItems: 'center',
        color: '#fff', fontSize: 9.5, fontWeight: 700,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
          <strong style={{ color: 'var(--ink)' }}>{who}</strong>{' '}{act}
        </div>
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}>{when}</span>
    </div>
  )
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

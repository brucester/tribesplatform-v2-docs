import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { computeOverallReadiness, computeGatesPassed, computePhaseProgress, type Values } from '@/app/blueprint/blueprint-compute'
import ModuleHeader from '@/components/ModuleHeader'
import DashCardTooltip from '@/components/DashCardTooltip'
import { MODULE_META } from '@/lib/module-meta'

const ROLE_LABELS: Record<string, string> = {
  explorer: 'Explorer',
  joining: 'Joining',
  resident: 'Resident',
  circle_lead: 'Circle Lead',
  project_lead: 'Project Lead',
  admin: 'Admin',
}

const ROLE_ORDER = ['explorer', 'joining', 'resident', 'circle_lead', 'project_lead', 'admin']
const roleRank = (r: string) => ROLE_ORDER.indexOf(r)

function atLeast(userRole: string, minRole: string) {
  return roleRank(userRole) >= roleRank(minRole)
}

const PHASE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guest view — community overview without personal data
  if (!user) {
    const [blueprintRes, memberCountRes, projectsRes, recentMembersRes, agreementsRes] = await Promise.all([
      supabase.from('blueprints').select('answers, updated_at').eq('is_community', true).maybeSingle(),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('user_profiles')
        .select('id, username, first_name, last_name, avatar_url, user_types, city, country')
        .order('created_at', { ascending: false }).limit(4),
      supabase.from('collaboration_agreements').select('id', { count: 'exact', head: true }),
    ])
    const bp = blueprintRes.data as { answers: unknown; updated_at: string } | null
    const bpAnswers = (bp?.answers ?? {}) as Values
    const overall = bp ? computeOverallReadiness(bpAnswers) : null
    const gatesPassed = bp ? computeGatesPassed(bpAnswers) : null
    const phaseProgress = bp ? computePhaseProgress(bpAnswers) : null
    const projectName = (bpAnswers.project_name as string) || null
    const memberCount = memberCountRes.count ?? 0
    const activeProjectCount = projectsRes.count ?? 0
    const recentMembers = recentMembersRes.data ?? []
    const agreementsCount = agreementsRes.count ?? 0

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.08em', marginBottom: 16 }}>v2.05</div>
        <ModuleHeader num="00" />

        {/* Guest banner */}
        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px' }}>You're viewing a community preview</p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Create a free account to see your personal dashboard, post offers, apply to join, and collaborate.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--accent)', padding: '8px 18px', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
              Join free
            </Link>
            <Link href="/auth/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', padding: '8px 4px', textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--ink)', lineHeight: 1.1, marginBottom: 6 }}>
            Community Dashboard
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>A look at what's happening inside MyCoNet right now.</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>Live modules</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>

            {/* M01 Network */}
            <DashCardTooltip desc={MODULE_META['01'].desc} color="#92400e">
              <Link href="/network" style={{ textDecoration: 'none' }}>
                <div className="dash-card" style={{ borderTop: '3px solid #92400e' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#92400e', fontWeight: 700, marginBottom: 3 }}>M01</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 10 }}>Network</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{memberCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>community members</div>
                  {recentMembers.length > 0 && (
                    <div style={{ display: 'flex', marginTop: 14, gap: 4 }}>
                      {recentMembers.slice(0, 4).map((m: any) => {
                        const init = (m.first_name?.[0] || m.username?.[0] || '?').toUpperCase()
                        return (
                          <div key={m.id} style={{ width: 28, height: 28, borderRadius: '50%', background: '#92400e20', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#92400e' }}>
                            {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : init}
                          </div>
                        )
                      })}
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', alignSelf: 'center', marginLeft: 4 }}>Recently joined</div>
                    </div>
                  )}
                </div>
              </Link>
            </DashCardTooltip>

            {/* M04 Blueprint */}
            <DashCardTooltip desc={MODULE_META['04'].desc} color="#ca8a04">
              <Link href="/blueprint" style={{ textDecoration: 'none' }}>
                <div className="dash-card" style={{ borderTop: '3px solid #ca8a04' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#ca8a04', fontWeight: 700, marginBottom: 3 }}>M04</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 10 }}>Blueprint</div>
                  {bp ? (
                    <>
                      {projectName && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, fontStyle: 'italic' }}>{projectName}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{overall?.toFixed(1)}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>/ 10 readiness</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#ca8a04', fontWeight: 600 }}>{gatesPassed}/4 gates</span>
                      </div>
                      {phaseProgress?.map((ph, i) => (
                        <div key={ph.id} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{ph.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{ph.answered}/{ph.total}</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: 'var(--rule)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${ph.ratio * 100}%`, background: PHASE_COLORS[i] ?? '#94a3b8', borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--ink-4)' }}>Blueprint not yet started.</p>
                  )}
                </div>
              </Link>
            </DashCardTooltip>

            {/* M07 Ops */}
            <DashCardTooltip desc={MODULE_META['07'].desc} color="#4338ca">
              <Link href="/ops" style={{ textDecoration: 'none' }}>
                <div className="dash-card" style={{ borderTop: '3px solid #4338ca' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#4338ca', fontWeight: 700, marginBottom: 3 }}>M07</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 10 }}>Operations</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{activeProjectCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>active community projects</div>
                </div>
              </Link>
            </DashCardTooltip>

            {/* M06 Agreements */}
            <DashCardTooltip desc={MODULE_META['06'].desc} color="#1d4ed8">
              <Link href="/agreements" style={{ textDecoration: 'none' }}>
                <div className="dash-card" style={{ borderTop: '3px solid #1d4ed8' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#1d4ed8', fontWeight: 700, marginBottom: 3 }}>M06</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 10 }}>Agreements</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{agreementsCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>collaboration proposals</div>
                  <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 500 }}>Browse projects →</span>
                </div>
              </Link>
            </DashCardTooltip>

          </div>
        </div>
      </div>
    )
  }

  const [profileRes, bioRes, blueprintRes, offersRes, seeksRes, memberCountRes, recentMembersRes, applicationRes, projectsRes, myAgreementsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_bio').select('skills, interests, values_principles, goals, personality_details').eq('user_id', user.id).maybeSingle(),
    supabase.from('blueprints').select('answers, flags, updated_at').eq('is_community', true).maybeSingle(),
    supabase.from('user_offers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('user_requests').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles')
      .select('id, username, first_name, last_name, avatar_url, user_types, city, country')
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('applications').select('status, created_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('collaboration_agreements').select('id, status').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const bio = bioRes.data
  const blueprint = blueprintRes.data as { answers: unknown; flags: unknown; updated_at: string } | null
  const offersCount = offersRes.count ?? 0
  const seeksCount = seeksRes.count ?? 0
  const memberCount = memberCountRes.count ?? 0
  const recentMembers = recentMembersRes.data ?? []
  const application = applicationRes.data
  const activeProjectCount = projectsRes.count ?? 0
  const myAgreements = myAgreementsRes.data ?? []
  const myActiveAgreements = myAgreements.filter(a => ['accepted', 'active'].includes(a.status)).length

  const role = (profile as any)?.role ?? 'explorer'
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Explorer'

  // Blueprint stats — same logic as the blueprint's own DashboardView
  const bpAnswers = (blueprint?.answers ?? {}) as Values
  const overall = computeOverallReadiness(bpAnswers)
  const gatesPassed = computeGatesPassed(bpAnswers)
  const phaseProgress = computePhaseProgress(bpAnswers)
  const projectName = (bpAnswers.project_name as string) || null
  const blueprintUpdated = blueprint?.updated_at
    ? new Date(blueprint.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const hasBlueprint = blueprint !== null

  // Profile completeness
  const pd = (bio?.personality_details ?? {}) as any
  const profileSteps = [
    !!(profile?.first_name),
    !!(profile?.headline),
    !!(bio?.values_principles),
    !!(pd?.myersBriggs || pd?.mbti),
    (bio?.skills?.length ?? 0) > 0,
    !!(bio?.goals),
    offersCount > 0,
  ]
  const profileComplete = profileSteps.filter(Boolean).length
  const profilePct = Math.round((profileComplete / profileSteps.length) * 100)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Version */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.08em', marginBottom: 16 }}>
        v2.05
      </div>
      <ModuleHeader num="00" />

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--ink)', lineHeight: 1.1 }}>
            {greeting}, {displayName}
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--accent)', background: 'var(--accent-soft)',
            padding: '3px 10px', borderRadius: 20, flexShrink: 0,
          }}>
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>
        <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
          Your MyCoNet — all your community information in one place.
        </p>
      </div>

      {/* All active modules — numeric order */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
          Modules
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>

          {/* M01 — Network */}
          <DashCardTooltip desc={MODULE_META['01'].desc} color="#92400e">
          <Link href="/network" style={{ textDecoration: 'none' }}>
            <div className="dash-card" style={{ borderTop: '3px solid #92400e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#92400e', fontWeight: 700, marginBottom: 3 }}>M01</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)' }}>Network</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--bg-2)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--rule)' }}>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Profile completeness</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{profilePct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--rule)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${profilePct}%`, background: '#92400e', borderRadius: 3, transition: 'width 400ms ease' }} />
                </div>
              </div>
              {recentMembers.length > 0 && (
                <div style={{ display: 'flex', marginBottom: 14 }}>
                  {recentMembers.slice(0, 4).map((m: any, i: number) => {
                    const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.username
                    return (
                      <div key={m.id} style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--surface)', background: 'var(--accent-soft)', marginLeft: i > 0 ? -6 : 0, zIndex: 4 - i, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden' }}>
                        {m.avatar_url ? <img src={m.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
                      </div>
                    )
                  })}
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 10, alignSelf: 'center' }}>
                    {memberCount > 1 ? `${memberCount - 1} other${memberCount > 2 ? 's' : ''}` : 'Just you'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{offersCount > 0 ? `${offersCount} offer${offersCount > 1 ? 's' : ''} · ${seeksCount} seek${seeksCount !== 1 ? 's' : ''}` : 'Add your offers + seeks'}</span>
                <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>Open →</span>
              </div>
            </div>
          </Link>
          </DashCardTooltip>

          {/* M04 — Blueprint */}
          <DashCardTooltip desc={MODULE_META['04'].desc} color="#ca8a04">
          <Link href="/blueprint" style={{ textDecoration: 'none' }}>
            <div className="dash-card" style={{ borderTop: '3px solid #ca8a04' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#ca8a04', fontWeight: 700, marginBottom: 3 }}>M04</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)' }}>Blueprint</div>
                  {projectName && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{projectName}</div>}
                </div>
                {hasBlueprint && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#ca8a04', background: '#ca8a0415', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {overall.toFixed(1)} / 10
                  </span>
                )}
              </div>
              {hasBlueprint ? (
                <>
                  {/* Phase progress bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    {phaseProgress.map((p, i) => (
                      <div key={p.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 500 }}>{p.name}</span>
                          <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{p.answered}/{p.total}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--rule)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.ratio * 100}%`, background: PHASE_COLORS[i], borderRadius: 2, transition: 'width 400ms ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{gatesPassed}/4 gates · {blueprintUpdated ? `Updated ${blueprintUpdated}` : 'In progress'}</span>
                    <span style={{ fontSize: 12, color: '#ca8a04', fontWeight: 500 }}>Open →</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Not started yet</span>
                  <span style={{ fontSize: 12, color: '#ca8a04', fontWeight: 500 }}>Open →</span>
                </div>
              )}
            </div>
          </Link>
          </DashCardTooltip>

          {/* M05 — Join */}
          <DashCardTooltip desc={MODULE_META['05'].desc} color="#15803d">
            <JoinCard application={application} userRole={role} />
          </DashCardTooltip>

          {/* M06 — Agreements */}
          <DashCardTooltip desc={MODULE_META['06'].desc} color="#1d4ed8">
            <LiveModuleCard
              num="M06" name="Agreements" color="#1d4ed8"
              href="/agreements"
              stat={myAgreements.length > 0 ? `${myAgreements.length} proposal${myAgreements.length > 1 ? 's' : ''}` : 'No proposals yet'}
              cta="Browse projects →"
              locked={false}
            />
          </DashCardTooltip>

          {/* M07 — Operations */}
          <DashCardTooltip desc={MODULE_META['07'].desc} color="#4338ca">
            <LiveModuleCard
              num="M07" name="Operations" color="#4338ca"
              href="/ops"
              stat={activeProjectCount > 0 ? `${activeProjectCount} active project${activeProjectCount > 1 ? 's' : ''}` : 'No projects yet'}
              cta="View projects →"
              locked={false}
            />
          </DashCardTooltip>

        </div>
      </div>

      {/* Coming soon */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
          Coming soon
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {/* M02 + M03 — v1 external, v2 coming to this app */}
          <DashCardTooltip desc={MODULE_META['02'].desc} color="#b91c1c">
            <a href="https://tribesplatform.app/neighborhoods/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="dash-card dash-card-soon" style={{ borderTop: '3px solid #b91c1c' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#b91c1c', fontWeight: 700, marginBottom: 4 }}>M02</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>Neighborhood Directory</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>Live map of regenerative neighborhoods.</div>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#b91c1c', background: '#b91c1c15', padding: '2px 8px', borderRadius: 20 }}>v1 available ↗</span>
              </div>
            </a>
          </DashCardTooltip>
          <DashCardTooltip desc={MODULE_META['03'].desc} color="#ea580c">
            <a href="https://tribesplatform.app/hive/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="dash-card dash-card-soon" style={{ borderTop: '3px solid #ea580c' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#ea580c', fontWeight: 700, marginBottom: 4 }}>M03</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>Resources & Tools</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>Curated regenerative guides, tools, and templates.</div>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ea580c', background: '#ea580c15', padding: '2px 8px', borderRadius: 20 }}>v1 available ↗</span>
              </div>
            </a>
          </DashCardTooltip>
          <DashCardTooltip desc={MODULE_META['08'].desc} color="#8b5cf6">
            <ComingSoonCard
              num="M08" name="Contributions" color="#8b5cf6"
              desc="Points and badges that make regenerative action visible."
              unlockAt="Resident"
              userRole={role}
              minRole="resident"
            />
          </DashCardTooltip>
          <DashCardTooltip desc={MODULE_META['09'].desc} color="#db2777">
            <ComingSoonCard
              num="M09" name="Governance" color="#db2777"
              desc="AI-facilitated decisions — propose, discuss, vote."
              unlockAt="Resident"
              userRole={role}
              minRole="resident"
            />
          </DashCardTooltip>
        </div>
      </div>

      {/* Admin panel (placeholder) */}
      {atLeast(role, 'admin') && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
            Admin
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            <div className="dash-card dash-card-soon" style={{ borderTop: '3px solid #6366f1' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#6366f1', fontWeight: 700, marginBottom: 4 }}>M00</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>Member Management</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Invite links, role assignment, onboarding approvals.
              </div>
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6366f1', background: '#6366f115', padding: '2px 8px', borderRadius: 20 }}>
                  Building soon
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function LiveModuleCard({ num, name, color, href, stat, cta, locked }: {
  num: string; name: string; color: string; href: string
  stat: string; cta: string; locked: boolean
}) {
  if (locked) {
    return (
      <div className="dash-card dash-card-soon" style={{ borderTop: `3px solid ${color}`, opacity: 0.65 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>{num}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>{stat}</div>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, background: `${color}15`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}40` }}>
          Complete M05 to unlock
        </span>
      </div>
    )
  }
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="dash-card" style={{ borderTop: `3px solid ${color}` }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>{num}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>{stat}</div>
        <span style={{ fontSize: 12, color, fontWeight: 500 }}>{cta}</span>
      </div>
    </Link>
  )
}

const APP_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Under review', color: '#f59e0b' },
  reviewing: { label: 'Reviewing',    color: '#3b82f6' },
  accepted:  { label: 'Accepted',     color: '#22c55e' },
  rejected:  { label: 'Not a fit',    color: '#ef4444' },
}

function JoinCard({ application, userRole }: {
  application: { status: string; created_at: string } | null
  userRole: string
}) {
  const color = '#15803d'
  if (application) {
    const s = APP_STATUS[application.status] ?? APP_STATUS.pending
    const date = new Date(application.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return (
      <Link href="/join" style={{ textDecoration: 'none' }}>
        <div className="dash-card" style={{ borderTop: `3px solid ${s.color}` }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>M05</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>Join</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{s.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Submitted {date}</span>
            <span style={{ fontSize: 12, color, fontWeight: 500 }}>View →</span>
          </div>
        </div>
      </Link>
    )
  }

  if (atLeast(userRole, 'joining')) {
    return (
      <div className="dash-card dash-card-soon" style={{ borderTop: `3px solid ${color}` }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>M05</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>Join</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>Onboarding complete</div>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, background: `${color}15`, padding: '2px 8px', borderRadius: 20 }}>Done</span>
      </div>
    )
  }

  return (
    <Link href="/join" style={{ textDecoration: 'none' }}>
      <div className="dash-card" style={{ borderTop: `3px solid ${color}` }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>M05</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>Join</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 14 }}>
          Fill out your application to become a community member.
        </div>
        <span style={{ fontSize: 12, color, fontWeight: 600 }}>Apply now →</span>
      </div>
    </Link>
  )
}

function ComingSoonCard({ num, name, color, desc, unlockAt, userRole, minRole }: {
  num: string, name: string, color: string, desc: string,
  unlockAt: string, userRole: string, minRole: string
}) {
  const unlocked = atLeast(userRole, minRole)
  return (
    <div className="dash-card dash-card-soon" style={{ borderTop: `3px solid ${unlocked ? color : 'var(--rule)'}`, opacity: unlocked ? 1 : 0.6 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: unlocked ? color : 'var(--ink-4)', fontWeight: 700, marginBottom: 4 }}>{num}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
      <div>
        {unlocked ? (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, background: `${color}15`, padding: '2px 8px', borderRadius: 20 }}>
            Building soon
          </span>
        ) : (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', background: 'var(--bg-2)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--rule)' }}>
            Unlocks at {unlockAt}
          </span>
        )}
      </div>
    </div>
  )
}

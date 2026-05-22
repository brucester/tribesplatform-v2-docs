import { createClient } from '@/lib/supabase/server'
import { computeOverallReadiness, computeGatesPassed, computePhaseProgress, type Values } from '@/app/blueprint/blueprint-compute'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    blueprintRes,
    memberCountRes,
    membersRes,
    valuesRes,
    projectsRes,
    activeProjectCountRes,
    deliverablesRes,
  ] = await Promise.all([
    supabase.from('blueprints').select('answers, updated_at').eq('is_community', true).maybeSingle(),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles')
      .select('id, first_name, last_name, username, headline, city, country, avatar_url, user_types')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('community_values').select('id, title, description, sort_order').order('sort_order'),
    supabase.from('projects')
      .select('id, title, description, needs, open_for_collaborators, status')
      .eq('status', 'active')
      .limit(3),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('deliverables')
      .select('id, title, status, due_date, project_id, user_profiles(username)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const bp = blueprintRes.data as { answers: unknown; updated_at: string } | null
  const bpAnswers = (bp?.answers ?? {}) as Values
  const overall = bp ? computeOverallReadiness(bpAnswers) : null
  const gatesPassed = bp ? computeGatesPassed(bpAnswers) : null
  const phaseProgress = bp ? computePhaseProgress(bpAnswers) : []
  const communityName = (bpAnswers.project_name as string) || 'Our Community'
  const communityPurpose = (bpAnswers.purpose as string) || null
  const memberCount = memberCountRes.count ?? 0
  const activeProjectCount = activeProjectCountRes.count ?? 0

  // User-specific data
  let firstName: string | null = null
  let hasApplied = false
  let isFullMember = false

  if (user) {
    const [profileRes, appRes] = await Promise.all([
      supabase.from('user_profiles').select('first_name, role').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('status').eq('user_id', user.id).maybeSingle(),
    ])
    firstName = profileRes.data?.first_name ?? null
    hasApplied = !!appRes.data
    const role = profileRes.data?.role ?? 'explorer'
    isFullMember = ['resident', 'circle_lead', 'project_lead', 'admin'].includes(role)
  }

  return (
    <HomeClient
      firstName={firstName}
      communityName={communityName}
      communityPurpose={communityPurpose}
      phaseProgress={phaseProgress}
      overall={overall}
      gatesPassed={gatesPassed}
      memberCount={memberCount}
      members={(membersRes.data ?? []) as any[]}
      communityValues={(valuesRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      activeProjectCount={activeProjectCount}
      deliverables={(deliverablesRes.data ?? []) as any[]}
      isLoggedIn={!!user}
      hasApplied={hasApplied}
      isFullMember={isFullMember}
    />
  )
}

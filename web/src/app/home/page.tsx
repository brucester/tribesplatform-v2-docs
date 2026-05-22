import { createClient } from '@/lib/supabase/server'
import { computeOverallReadiness, computeGatesPassed, computePhaseProgress, type Values } from '@/app/blueprint/blueprint-compute'
import { computeMatch } from '@/lib/match-score'
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
  let role = 'explorer'
  let applicationStatus: string | null = null
  let joiningRewardNew = false
  let matchScores: Record<string, { score: number; reasons: string[] }> = {}

  if (user) {
    const memberIds = (membersRes.data ?? []).map((m: any) => m.id)
    const [profileRes, appRes, myBioRes, memberBiosRes] = await Promise.all([
      supabase.from('user_profiles').select('first_name, role').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('status').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle(),
      memberIds.length > 0
        ? supabase.from('user_bio').select('*').in('user_id', memberIds)
        : Promise.resolve({ data: [] }),
    ])
    firstName = profileRes.data?.first_name ?? null
    hasApplied = !!appRes.data
    role = profileRes.data?.role ?? 'explorer'
    applicationStatus = appRes.data?.status ?? null
    isFullMember = ['resident', 'circle_lead', 'project_lead', 'admin'].includes(role)

    // Award "Community Joiner" badge the first time we see a joining+ role
    if (['joining', 'resident', 'circle_lead', 'project_lead', 'admin'].includes(role)) {
      const { error } = await supabase.from('user_achievements').upsert(
        { user_id: user.id, achievement_key: 'community_joiner', achievement_name: 'Community Joiner' },
        { onConflict: 'user_id,achievement_key', ignoreDuplicates: true }
      )
      joiningRewardNew = !error
    }

    const myBio = myBioRes.data ?? null
    for (const b of (memberBiosRes as any).data ?? []) {
      matchScores[b.user_id] = computeMatch(myBio, b)
    }
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
      role={role}
      applicationStatus={applicationStatus}
      joiningRewardNew={joiningRewardNew}
      matchScores={matchScores}
    />
  )
}

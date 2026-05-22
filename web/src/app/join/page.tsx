import { createClient } from '@/lib/supabase/server'
import JoinClient from './JoinClient'
import JoinAdminClient from './JoinAdminClient'
import ModuleHeader from '@/components/ModuleHeader'

export default async function JoinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Read join questions from the most complete blueprint
  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('answers, updated_at')
    .order('updated_at', { ascending: false })

  const communityBlueprint = blueprints?.find(
    b => (b.answers as any)?.join_application_questions
  )
  const rawQuestions: string = (communityBlueprint?.answers as any)?.join_application_questions ?? ''
  const questions = rawQuestions
    .split('\n')
    .map((q: string) => q.trim())
    .filter((q: string) => q.length > 0)

  // Check role
  let role = 'explorer'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? 'explorer'
  }

  const isAdmin = ['admin', 'circle_lead', 'project_lead'].includes(role)

  // Admin: show all applications for review
  if (isAdmin) {
    const { data: apps } = await supabase
      .from('applications')
      .select('id, user_id, status, answers, admin_notes, created_at')
      .order('created_at', { ascending: false })

    // Fetch applicant profile info
    const userIds = (apps ?? []).map(a => a.user_id)
    const { data: profiles } = userIds.length > 0
      ? await supabase
          .from('user_profiles')
          .select('id, first_name, username')
          .in('id', userIds)
      : { data: [] }

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    const enriched = (apps ?? []).map(a => ({
      ...a,
      answers: (a.answers as Record<string, string>) ?? {},
      admin_notes: a.admin_notes ?? null,
      first_name: profileMap[a.user_id]?.first_name ?? null,
      username: profileMap[a.user_id]?.username ?? null,
    }))

    return (
      <>
        <ModuleHeader num="05" standalone />
        <JoinAdminClient applications={enriched} questions={questions} />
      </>
    )
  }

  // Regular user: fetch all data needed for the multi-step flow
  let existingApplication: { status: string; answers: Record<string, string>; created_at: string } | null = null
  let userProfile: { first_name: string | null; last_name: string | null; headline: string | null; city: string | null; country: string | null } | null = null
  let communityValues: { id: string; title: string; description: string; sort_order: number }[] = []
  let signedValueIds: string[] = []
  let buddyProfiles: { id: string; first_name: string | null; headline: string | null; city: string | null }[] = []

  if (user) {
    const [appRes, profileRes, valuesRes, signaturesRes, buddiesRes] = await Promise.all([
      supabase
        .from('applications')
        .select('status, answers, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('first_name, last_name, headline, city, country')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('community_values')
        .select('id, title, description, sort_order')
        .order('sort_order'),
      supabase
        .from('value_signatures')
        .select('value_id')
        .eq('user_id', user.id),
      supabase
        .from('user_profiles')
        .select('id, first_name, headline, city')
        .neq('id', user.id)
        .limit(3),
    ])

    existingApplication = appRes.data as any
    userProfile = profileRes.data as any
    communityValues = (valuesRes.data ?? []) as any
    signedValueIds = (signaturesRes.data ?? []).map((s: any) => s.value_id)
    buddyProfiles = (buddiesRes.data ?? []) as any
  }

  return (
    <JoinClient
      userId={user?.id ?? null}
      existingApplication={existingApplication}
      userProfile={userProfile}
      communityValues={communityValues}
      initialSignedValueIds={signedValueIds}
      buddyProfiles={buddyProfiles}
    />
  )
}

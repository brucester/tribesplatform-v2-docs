import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinClient from './JoinClient'
import JoinAdminClient from './JoinAdminClient'

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

    return <JoinAdminClient applications={enriched} questions={questions} />
  }

  // Regular user: show own application or form
  let existingApplication: { status: string; answers: Record<string, string>; created_at: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('applications')
      .select('status, answers, created_at')
      .eq('user_id', user.id)
      .maybeSingle()
    existingApplication = data as any
  }

  return (
    <JoinClient
      questions={questions}
      userId={user?.id ?? null}
      existingApplication={existingApplication}
      hasQuestionsConfigured={questions.length > 0}
    />
  )
}

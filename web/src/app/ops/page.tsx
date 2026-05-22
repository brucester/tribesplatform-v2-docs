import { createClient } from '@/core/lib/supabase/server'
import OpsClient from '@/modules/m07-ops/OpsClient'
import { isOpsAdmin } from '@/core/lib/roles'
import { promoteToMemberIfEligible } from '@/core/lib/promotions'

export default async function OpsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let userRole = 'explorer'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? 'explorer'
    isAdmin = isOpsAdmin(userRole)

    userRole = await promoteToMemberIfEligible(supabase, user.id, userRole)
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, description, status, open_for_collaborators, needs, deadline, sprint_name, created_at')
    .order('created_at', { ascending: false })

  const { data: deliverablesRaw } = await supabase
    .from('deliverables')
    .select('id, project_id, title, assignee_id, due_date, status, progress, user_profiles(username)')
    .order('due_date', { ascending: true })

  const deliverables = (deliverablesRaw ?? []).map((d: any) => ({
    id: d.id as string,
    project_id: d.project_id as string,
    title: d.title as string,
    assignee_id: d.assignee_id as string | null,
    due_date: d.due_date as string | null,
    status: (d.status as string) ?? 'backlog',
    progress: d.progress as number | null,
    assignee_username: d.user_profiles?.username ?? null,
  }))

  const { data: updatesRaw } = await supabase
    .from('project_updates')
    .select('id, project_id, user_id, content, created_at, user_profiles(first_name)')
    .order('created_at', { ascending: false })
    .limit(20)

  const updates = (updatesRaw ?? []).map((u: any) => ({
    id: u.id as string,
    project_id: u.project_id as string,
    user_id: u.user_id as string,
    content: u.content as string,
    created_at: u.created_at as string,
    author_first_name: u.user_profiles?.first_name ?? null,
  }))

  const allProjects = projects ?? []
  const activeCount = allProjects.filter(p => p.status === 'active').length
  const deliverableCount = deliverables.length
  const doneCount = deliverables.filter(d => d.status === 'done').length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const atRiskCount = deliverables.filter(d => {
    if (!d.due_date) return false
    if (['done', 'review'].includes(d.status)) return false
    return new Date(d.due_date) < today
  }).length

  const sprintName = allProjects.find(p => p.sprint_name)?.sprint_name ?? null

  return (
    <OpsClient
      projects={allProjects}
      deliverables={deliverables}
      updates={updates}
      activeCount={activeCount}
      deliverableCount={deliverableCount}
      doneCount={doneCount}
      atRiskCount={atRiskCount}
      isAdmin={isAdmin}
      sprintName={sprintName}
    />
  )
}

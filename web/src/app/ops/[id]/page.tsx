import { createClient } from '@/core/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProjectDetailClient from '@/modules/m07-ops/ProjectDetailClient'
import { isOpsAdmin } from '@/core/lib/roles'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, projectRes, updatesRes, allAgreementsRes, activeAgreementsRes, deliverablesRes] = await Promise.all([
    supabase.from('user_profiles').select('role, first_name').eq('id', user.id).single(),
    supabase.from('projects').select('*, created_by, lead_user_id').eq('id', id).single(),
    supabase.from('project_updates')
      .select('id, content, created_at, user_profiles(first_name, username)')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('collaboration_agreements')
      .select('id, work_description, expected_reward, status, created_at, user_profiles(first_name, username)')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('collaboration_agreements')
      .select('id, work_description, expected_reward, status, created_at, user_profiles(first_name, username)')
      .eq('project_id', id)
      .in('status', ['accepted', 'active', 'completed'])
      .order('created_at', { ascending: false }),
    supabase.from('deliverables')
      .select('id, title, status, due_date, assignee_id, progress')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!projectRes.data) notFound()

  const isAdmin = isOpsAdmin(profileRes.data?.role ?? '')
  const project = projectRes.data as any
  const isProjectCreator = project.created_by === user.id || project.lead_user_id === user.id

  return (
    <ProjectDetailClient
      project={project}
      updates={updatesRes.data ?? []}
      agreements={isAdmin ? (allAgreementsRes.data ?? []) : []}
      activeCollaborations={activeAgreementsRes.data ?? []}
      deliverables={deliverablesRes.data ?? []}
      userId={user.id}
      userRole={profileRes.data?.role ?? 'explorer'}
      isAdmin={isAdmin}
      isProjectCreator={isProjectCreator}
    />
  )
}

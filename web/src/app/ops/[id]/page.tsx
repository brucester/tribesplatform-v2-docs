import { createClient } from '@/core/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProjectDetailClient from '@/modules/m07-ops/ProjectDetailClient'
import { isOpsAdmin } from '@/core/lib/roles'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, projectRes, updatesRes, agreementsRes] = await Promise.all([
    supabase.from('user_profiles').select('role, first_name').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('project_updates')
      .select('id, content, created_at, user_profiles(first_name, username)')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('collaboration_agreements')
      .select('id, work_description, expected_reward, status, created_at, user_profiles(first_name, username)')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!projectRes.data) notFound()

  const isAdmin = isOpsAdmin(profileRes.data?.role ?? '')

  const agreements = isAdmin
    ? (agreementsRes.data ?? [])
    : (agreementsRes.data ?? []).filter((a: any) => a.user_profiles?.username === profileRes.data?.first_name)

  return (
    <ProjectDetailClient
      project={projectRes.data}
      updates={updatesRes.data ?? []}
      agreements={agreements}
      userId={user.id}
      userRole={profileRes.data?.role ?? 'explorer'}
      isAdmin={isAdmin}
    />
  )
}

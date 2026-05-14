import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AgreementFormClient from './AgreementFormClient'

export default async function AgreementFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'explorer') redirect('/join')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, description, status, open_for_collaborators')
    .eq('id', id)
    .single()

  if (!project || project.status !== 'active' || !project.open_for_collaborators) notFound()

  // Check for existing agreement
  const { data: existing } = await supabase
    .from('collaboration_agreements')
    .select('id, work_description, expected_reward, status')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <AgreementFormClient
      project={project}
      userId={user.id}
      existing={existing}
    />
  )
}

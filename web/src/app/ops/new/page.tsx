import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewProjectClient from './NewProjectClient'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'project_lead'].includes(profile?.role ?? '')) {
    redirect('/ops')
  }

  return <NewProjectClient userId={user.id} />
}

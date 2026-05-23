import { createClient } from '@/core/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewProjectClient from '@/modules/m07-ops/NewProjectClient'
import { isOpsAdmin } from '@/core/lib/roles'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!isOpsAdmin(profile?.role ?? '')) {
    redirect('/ops')
  }

  return <NewProjectClient userId={user.id} />
}

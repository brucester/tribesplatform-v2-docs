import { createClient } from '@/lib/supabase/server'
import LandingClient from './LandingClient'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firstName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()
    firstName = profile?.first_name ?? null
  }

  return <LandingClient firstName={firstName} />
}

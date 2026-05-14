import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DiscoverClient from '../DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profilesRes, biosRes, myBioRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, username, first_name, last_name, headline, city, country, avatar_url, user_types')
      .neq('id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('user_bio').select('*'),
    supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const bioMap: Record<string, any> = {}
  for (const b of biosRes.data ?? []) bioMap[b.user_id] = b

  return (
    <DiscoverClient
      profiles={(profilesRes.data ?? []) as any}
      bioMap={bioMap}
      myBio={myBioRes.data ?? null}
      isLoggedIn={true}
    />
  )
}

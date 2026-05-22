import { createClient } from '@/core/lib/supabase/server'
import DiscoverClient from '@/modules/m01-network/DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profilesQuery = supabase
    .from('user_profiles')
    .select('id, username, first_name, last_name, headline, city, country, avatar_url, user_types')
    .order('created_at', { ascending: false })

  if (user) profilesQuery = profilesQuery.neq('id', user.id)

  const [profilesRes, biosRes, myBioRes] = await Promise.all([
    profilesQuery,
    supabase.from('user_bio').select('*'),
    user
      ? supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const bioMap: Record<string, any> = {}
  for (const b of biosRes.data ?? []) bioMap[b.user_id] = b

  return (
    <DiscoverClient
      profiles={(profilesRes.data ?? []) as any}
      bioMap={bioMap}
      myBio={(myBioRes as any).data ?? null}
      isLoggedIn={!!user}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import DiscoverClient from './DiscoverClient'

interface ProfileRow { user_id: string; username: string; display_name: string | null; pronouns: string | null; location: string | null; status: string | null; bio: string | null; avatar_url: string | null; user_types: string[] | null }
interface BioRow { user_id: string; values_list?: string[]; skills?: string[]; interests?: string[]; mbti?: string | null; ocean_openness?: number; ocean_conscientiousness?: number; ocean_extraversion?: number; ocean_agreeableness?: number; ocean_neuroticism?: number }

export default async function NetworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profilesRes, biosRes] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_bio').select('*'),
  ])

  const profiles = (profilesRes.data ?? []) as ProfileRow[]
  const bios = (biosRes.data ?? []) as BioRow[]

  const bioMap = Object.fromEntries(bios.map(b => [b.user_id, b]))

  const myBio = user ? (bioMap[user.id] ?? null) : null
  const myProfile = user ? profiles.find(p => p.user_id === user.id) ?? null : null

  const others = profiles.filter(p => p.user_id !== user?.id)

  return (
    <DiscoverClient
      profiles={others}
      bioMap={bioMap}
      myBio={myBio}
      myUsername={myProfile?.username ?? null}
      isLoggedIn={!!user}
    />
  )
}

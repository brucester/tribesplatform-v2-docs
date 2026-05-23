import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import DiscoverClient from './DiscoverClient'

export const metadata: Metadata = { title: 'Discover · Regen Tribe' }

export default async function DiscoverPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profiles }, { data: bios }, { data: myBio }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_bio').select('*'),
    user
      ? supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const bioMap: Record<string, any> = {}
  for (const b of bios ?? []) bioMap[b.user_id] = b

  const members = (profiles ?? [])
    .filter(p => p.id !== user?.id)
    .map(p => ({ ...p, user_bio: bioMap[p.id] ?? null }))

  return (
    <DiscoverClient
      members={members}
      myBio={myBio ?? null}
      isLoggedIn={!!user}
    />
  )
}

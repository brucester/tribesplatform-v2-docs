import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import UserProfileClient from './UserProfileClient'

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [bioRes, offersRes, requestsRes] = await Promise.all([
    supabase.from('user_bio').select('*').eq('user_id', profile.id).maybeSingle(),
    supabase.from('user_offers').select('*').eq('user_id', profile.id).eq('is_active', true),
    supabase.from('user_requests').select('*').eq('user_id', profile.id).eq('is_active', true),
  ])

  return (
    <UserProfileClient
      profile={profile}
      bio={bioRes.data ?? null}
      offers={offersRes.data ?? []}
      requests={requestsRes.data ?? []}
      isOwn={user?.id === profile.id}
    />
  )
}

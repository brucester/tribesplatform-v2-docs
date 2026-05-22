import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GovernanceClient from './GovernanceClient'

export default async function GovernancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [proposalsRes, memberCountRes, myVotesRes, profileRes] = await Promise.all([
    supabase
      .from('proposals')
      .select(`
        id, title, description, decision_mode, status, closes_at, created_at,
        proposer:user_profiles!proposals_proposer_id_fkey(username, first_name, last_name),
        votes:proposal_votes(vote, user_id)
      `)
      .eq('status', 'open')
      .order('closes_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['resident', 'circle_lead', 'project_lead', 'admin']),
    supabase
      .from('proposal_votes')
      .select('proposal_id, vote')
      .eq('user_id', user.id),
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single(),
  ])

  const myVotes: Record<string, string> = {}
  for (const v of myVotesRes.data ?? []) {
    myVotes[v.proposal_id] = v.vote
  }

  const role = profileRes.data?.role ?? 'explorer'
  const isFullMember = ['resident', 'circle_lead', 'project_lead', 'admin'].includes(role)

  return (
    <GovernanceClient
      proposals={(proposalsRes.data ?? []) as any[]}
      memberCount={memberCountRes.count ?? 0}
      currentUserId={user.id}
      myVotes={myVotes}
      isFullMember={isFullMember}
    />
  )
}

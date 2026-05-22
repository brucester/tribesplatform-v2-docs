import { createClient } from '@/core/lib/supabase/server'
import GovernanceClient from '@/modules/m09-governance/GovernanceClient'

export default async function GovernancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [proposalsRes, memberCountRes] = await Promise.all([
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
      .in('role', ['member', 'circle_lead', 'project_lead', 'admin']),
  ])

  let myVotes: Record<string, string> = {}
  let isFullMember = false
  let role = 'explorer'

  if (user) {
    const [myVotesRes, profileRes] = await Promise.all([
      supabase.from('proposal_votes').select('proposal_id, vote').eq('user_id', user.id),
      supabase.from('user_profiles').select('role').eq('id', user.id).single(),
    ])
    for (const v of myVotesRes.data ?? []) {
      myVotes[v.proposal_id] = v.vote
    }
    role = profileRes.data?.role ?? 'explorer'

    // Promotion check: joining users whose closed proposal has no objections become member
    if (role === 'joining') {
      const { data: closed } = await supabase
        .from('proposals')
        .select('id, proposal_votes(vote)')
        .eq('proposer_id', user.id)
        .eq('status', 'closed')
      const passed = (closed ?? []).some(p => {
        const votes = (p as any).proposal_votes as { vote: string }[]
        return votes.length > 0 && votes.every(v => v.vote !== 'object')
      })
      if (passed) {
        await Promise.all([
          supabase.from('user_profiles').update({ role: 'member' }).eq('id', user.id),
          supabase.from('user_achievements').upsert(
            { user_id: user.id, achievement_key: 'community_member' },
            { onConflict: 'user_id,achievement_key', ignoreDuplicates: true }
          ),
        ])
        role = 'member'
      }
    }

    isFullMember = ['member', 'circle_lead', 'project_lead', 'admin'].includes(role)
  }

  return (
    <GovernanceClient
      proposals={(proposalsRes.data ?? []) as any[]}
      memberCount={memberCountRes.count ?? 0}
      currentUserId={user?.id ?? ''}
      myVotes={myVotes}
      isFullMember={isFullMember}
      isLoggedIn={!!user}
      role={role}
    />
  )
}

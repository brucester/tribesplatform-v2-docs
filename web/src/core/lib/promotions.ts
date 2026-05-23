import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Promotes a joining user to member if they qualify via either path:
 *   1. They have an accepted/active/completed collaboration agreement
 *   2. They created a project that is now active
 *
 * Awards the community_member achievement on promotion.
 * Returns the new role ('member' if promoted, original role otherwise).
 */
export async function promoteToMemberIfEligible(
  supabase: SupabaseClient,
  userId: string,
  currentRole: string,
): Promise<string> {
  if (currentRole !== 'joining') return currentRole

  const [agreementRes, projectRes] = await Promise.all([
    supabase
      .from('collaboration_agreements')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['accepted', 'active', 'completed'])
      .limit(1),
    supabase
      .from('projects')
      .select('id')
      .eq('created_by', userId)
      .eq('status', 'active')
      .limit(1),
  ])

  const qualifies =
    (agreementRes.data ?? []).length > 0 ||
    (projectRes.data ?? []).length > 0

  if (!qualifies) return currentRole

  await Promise.all([
    supabase.from('user_profiles').update({ role: 'member' }).eq('id', userId),
    supabase.from('user_achievements').upsert(
      { user_id: userId, achievement_key: 'community_member' },
      { onConflict: 'user_id,achievement_key', ignoreDuplicates: true }
    ),
  ])

  return 'member'
}

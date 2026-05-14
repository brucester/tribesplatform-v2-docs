import { createClient } from '@/lib/supabase/server'
import BlueprintClient from './BlueprintClient'

export default async function BlueprintPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = ['admin', 'circle_lead', 'project_lead'].includes(profile?.role ?? '')
  }

  // Everyone reads the same community blueprint — the most recently updated one with content.
  // Admins can edit it; everyone else sees it read-only.
  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10)

  const communityBlueprint =
    blueprints?.find(b => Object.keys((b.answers as Record<string, unknown>) ?? {}).length > 0) ??
    blueprints?.[0]

  // If no blueprint exists yet, admins can create one; others wait.
  if (!communityBlueprint) {
    if (!isAdmin) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-3)' }}>
          The community blueprint hasn't been set up yet. Check back soon.
        </div>
      )
    }

    // Create the first community blueprint owned by this admin
    const { data: created } = await supabase
      .from('blueprints')
      .insert({ user_id: user!.id, answers: {}, flags: {} })
      .select()
      .single()

    if (!created) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-3)' }}>
          Could not create blueprint. Please refresh.
        </div>
      )
    }

    return (
      <BlueprintClient
        blueprintId={created.id}
        initialAnswers={{}}
        initialFlags={{}}
        readOnly={false}
      />
    )
  }

  return (
    <BlueprintClient
      blueprintId={communityBlueprint.id}
      initialAnswers={(communityBlueprint.answers as Record<string, unknown>) ?? {}}
      initialFlags={(communityBlueprint.flags as Record<string, boolean>) ?? {}}
      readOnly={!isAdmin}
    />
  )
}

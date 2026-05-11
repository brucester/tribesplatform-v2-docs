import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BlueprintClient from './BlueprintClient'

export default async function BlueprintPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch or create blueprint for this user
  let { data: blueprint } = await supabase
    .from('blueprints')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!blueprint) {
    const { data: created } = await supabase
      .from('blueprints')
      .insert({ user_id: user.id, answers: {}, flags: {} })
      .select()
      .single()
    blueprint = created
  }

  if (!blueprint) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-3)' }}>
        Could not load your blueprint. Please refresh.
      </div>
    )
  }

  return (
    <BlueprintClient
      blueprintId={blueprint.id}
      initialAnswers={(blueprint.answers as Record<string, unknown>) ?? {}}
      initialFlags={(blueprint.flags as Record<string, boolean>) ?? {}}
    />
  )
}

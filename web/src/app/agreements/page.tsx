import { createClient } from '@/core/lib/supabase/server'
import AgreementsAdminClient from '@/modules/m06-agreements/AgreementsAdminClient'
import AgreementsClient from '@/modules/m06-agreements/AgreementsClient'

const LEAD_COLORS = [
  '#1d4ed8', '#7c3aed', '#0f766e', '#b45309', '#be185d',
  '#15803d', '#0369a1', '#9333ea',
]

function colorForId(id: string | null | undefined): string {
  if (!id) return LEAD_COLORS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return LEAD_COLORS[Math.abs(hash) % LEAD_COLORS.length]
}

function initialForName(name: string | null | undefined): string {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase()
}

export default async function AgreementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'explorer'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? 'explorer'

    // Promotion: joining user with an accepted agreement becomes member
    if (role === 'joining') {
      const { data: accepted } = await supabase
        .from('collaboration_agreements')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['accepted', 'active', 'completed'])
        .limit(1)
      if ((accepted ?? []).length > 0) {
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
  }

  const isAdmin = ['admin', 'circle_lead', 'project_lead'].includes(role)

  if (isAdmin) {
    const { data: allAgreements } = await supabase
      .from('collaboration_agreements')
      .select('id, user_id, project_id, work_description, expected_reward, status, admin_notes, created_at')
      .order('created_at', { ascending: false })

    const agreements = allAgreements ?? []
    const userIds = [...new Set(agreements.map(a => a.user_id))]
    const projectIds = [...new Set(agreements.map(a => a.project_id))]

    const [profilesRes, projectsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('user_profiles').select('id, first_name, username').in('id', userIds)
        : Promise.resolve({ data: [] }),
      projectIds.length > 0
        ? supabase.from('projects').select('id, title').in('id', projectIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = Object.fromEntries((profilesRes.data ?? []).map(p => [p.id, p]))
    const projectMap = Object.fromEntries((projectsRes.data ?? []).map(p => [p.id, p]))

    const enriched = agreements.map(a => ({
      ...a,
      admin_notes: a.admin_notes ?? null,
      first_name: profileMap[a.user_id]?.first_name ?? null,
      username: profileMap[a.user_id]?.username ?? null,
      project_title: projectMap[a.project_id]?.title ?? null,
    }))

    return <AgreementsAdminClient agreements={enriched} />
  }

  const { data: rawProjects } = await supabase
    .from('projects')
    .select('id, title, description, status, open_for_collaborators, needs, deadline, lead_user_id, created_by')
    .eq('status', 'active')
    .eq('open_for_collaborators', true)
    .order('created_at', { ascending: false })

  const projectRows = rawProjects ?? []
  const leadIds = [
    ...new Set(
      projectRows
        .map(p => p.lead_user_id ?? p.created_by)
        .filter((id): id is string => !!id)
    ),
  ]

  const [leadProfilesRes, myAgreementsRes] = await Promise.all([
    leadIds.length > 0
      ? supabase.from('user_profiles').select('id, first_name, username').in('id', leadIds)
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from('collaboration_agreements')
          .select('id, project_id, work_description, expected_reward, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const leadProfileMap = Object.fromEntries(
    (leadProfilesRes.data ?? []).map(p => [p.id, p])
  )

  const projects = projectRows.map(p => {
    const leadId = p.lead_user_id ?? p.created_by ?? null
    const leadProfile = leadId ? leadProfileMap[leadId] : null
    const leadName = leadProfile?.first_name ?? leadProfile?.username ?? null
    return {
      id: p.id,
      title: p.title,
      description: p.description ?? null,
      status: p.status,
      open_for_collaborators: p.open_for_collaborators,
      needs: (p.needs ?? []) as string[],
      deadline: p.deadline ?? null,
      lead_user_id: p.lead_user_id ?? null,
      created_by: p.created_by ?? null,
      lead_name: leadName,
      lead_initial: initialForName(leadName),
      lead_color: colorForId(leadId),
    }
  })

  const myAgreements = (myAgreementsRes.data ?? []).map(a => ({
    id: a.id,
    project_id: a.project_id,
    work_description: a.work_description,
    expected_reward: a.expected_reward,
    status: a.status,
    created_at: a.created_at,
  }))

  return (
    <AgreementsClient
      projects={projects}
      myAgreements={myAgreements}
      userRole={role}
      userId={user?.id ?? null}
    />
  )
}

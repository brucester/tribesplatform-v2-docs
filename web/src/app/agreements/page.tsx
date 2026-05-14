import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AgreementsAdminClient from './AgreementsAdminClient'

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending review', color: '#15803d' },
  accepted:  { label: 'Accepted',       color: '#22c55e' },
  active:    { label: 'Active',         color: '#3b82f6' },
  rejected:  { label: 'Not accepted',   color: '#ef4444' },
  completed: { label: 'Completed',      color: '#94a3b8' },
}

export default async function AgreementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guest view — show open projects read-only
  if (!user) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, description, status, open_for_collaborators, updated_at')
      .eq('status', 'active')
      .eq('open_for_collaborators', true)
      .order('created_at', { ascending: false })

    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1d4ed8', background: '#1d4ed815', padding: '3px 10px', borderRadius: 20, marginBottom: 12 }}>
            M06 · Agreements
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 8 }}>
            Collaboration agreements
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, maxWidth: 540 }}>
            Projects open for collaboration. Members propose what they'll contribute and what they expect in return.
          </p>
        </div>
        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '12px 18px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
            You're browsing as a guest. <strong>Join free</strong> to propose collaborations on open projects.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/auth/signup" style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--accent)', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>Join free</Link>
            <Link href="/auth/login" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', padding: '5px 4px' }}>Sign in</Link>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
          Open projects
        </div>
        {(projects ?? []).length === 0 ? (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>No projects open for collaboration right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(projects ?? []).map(p => (
              <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderLeft: '4px solid #1d4ed8', borderRadius: 'var(--radius)', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'var(--display)', fontSize: 17, color: 'var(--ink)', marginBottom: 6 }}>{p.title}</h3>
                    {p.description && <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55, margin: 0 }}>{p.description}</p>}
                  </div>
                  <Link href="/auth/signup" style={{ fontSize: 12.5, fontWeight: 600, color: '#1d4ed8', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Sign in to collaborate →
                  </Link>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Link href={`/ops/${p.id}`} style={{ fontSize: 12, color: 'var(--ink-4)', textDecoration: 'none' }}>
                    View project in Operations →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'explorer'
  const isAdmin = ['admin', 'circle_lead', 'project_lead'].includes(role)

  // Admin: show all agreements across all projects
  if (isAdmin) {
    const { data: allAgreements } = await supabase
      .from('collaboration_agreements')
      .select('id, user_id, project_id, work_description, expected_reward, status, admin_notes, created_at')
      .order('created_at', { ascending: false })

    const agreements = allAgreements ?? []

    // Fetch related user profiles and project titles
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

  // Non-admin member view
  const canPropose = role !== 'explorer'

  const [projectsRes, myAgreementsRes] = await Promise.all([
    supabase.from('projects')
      .select('id, title, description, status, open_for_collaborators, updated_at')
      .eq('status', 'active')
      .eq('open_for_collaborators', true)
      .order('created_at', { ascending: false }),
    supabase.from('collaboration_agreements')
      .select('id, project_id, work_description, expected_reward, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const projects = projectsRes.data ?? []
  const myAgreements = myAgreementsRes.data ?? []
  const myAgreementsByProject = Object.fromEntries(myAgreements.map(a => [a.project_id, a]))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1d4ed8', background: '#1d4ed815', padding: '3px 10px', borderRadius: 20, marginBottom: 12 }}>
          M06 · Agreements
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 8 }}>
          Collaboration agreements
        </h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, maxWidth: 540 }}>
          Projects open for collaboration. Propose what you'll do and what you expect in return —
          the team reviews and confirms your agreement.
        </p>
      </div>

      {/* Explorer gate */}
      {!canPropose && (
        <div style={{ background: '#15803d10', border: '1px solid #15803d40', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>Complete M05 Join to propose collaborations</p>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Once your join application is accepted you'll be able to submit collaboration proposals.
            </p>
            <Link href="/join" style={{ fontSize: 12.5, color: '#15803d', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
              Go to M05 Join →
            </Link>
          </div>
        </div>
      )}

      {/* My agreements */}
      {myAgreements.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
            My proposals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myAgreements.map(a => {
              const project = projects.find(p => p.id === a.project_id)
              const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.pending
              return (
                <div key={a.id} style={{ background: 'var(--surface)', border: `1px solid ${s.color}30`, borderLeft: `4px solid ${s.color}`, borderRadius: 'var(--radius)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      {project?.title ?? 'Project'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.color, background: `${s.color}15`, padding: '2px 8px', borderRadius: 20 }}>
                      {s.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: '0 0 3px' }}>
                    <strong style={{ color: 'var(--ink-2)' }}>I will:</strong> {a.work_description}
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
                    <strong style={{ color: 'var(--ink-2)' }}>I expect:</strong> {a.expected_reward}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Open projects */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
        Open projects
      </div>

      {projects.length === 0 ? (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>No projects open for collaboration right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(p => {
            const existing = myAgreementsByProject[p.id]
            return (
              <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderLeft: '4px solid #1d4ed8', borderRadius: 'var(--radius)', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'var(--display)', fontSize: 17, color: 'var(--ink)', marginBottom: 6 }}>{p.title}</h3>
                    {p.description && (
                      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55, margin: 0 }}>{p.description}</p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {existing ? (
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: STATUS_STYLE[existing.status]?.color ?? '#15803d', background: `${STATUS_STYLE[existing.status]?.color ?? '#15803d'}15`, padding: '4px 10px', borderRadius: 20 }}>
                        {STATUS_STYLE[existing.status]?.label ?? 'Proposed'}
                      </span>
                    ) : canPropose ? (
                      <Link href={`/agreements/${p.id}`} style={{ background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 'var(--radius)', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }}>
                        Propose collaboration
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>Join first to propose</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Link href={`/ops/${p.id}`} style={{ fontSize: 12, color: 'var(--ink-4)', textDecoration: 'none' }}>
                    View project in Operations →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

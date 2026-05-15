import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ModuleHeader from '@/components/ModuleHeader'

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',     color: '#22c55e', bg: '#22c55e15' },
  paused:    { label: 'Paused',     color: '#f59e0b', bg: '#f59e0b15' },
  completed: { label: 'Completed',  color: '#94a3b8', bg: '#94a3b815' },
}

export default async function OpsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = ['admin', 'project_lead'].includes(profile?.role ?? '')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, description, status, open_for_collaborators, created_at, updated_at')
    .order('created_at', { ascending: false })

  const activeProjects = projects?.filter(p => p.status === 'active') ?? []
  const otherProjects = projects?.filter(p => p.status !== 'active') ?? []

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* Guest banner */}
      {!user && (
        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '12px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
            You're browsing as a guest. <strong>Sign in</strong> to propose collaborations and track your work.
          </p>
          <Link href="/auth/signup" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Join free →
          </Link>
        </div>
      )}

      <ModuleHeader num="07" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 8 }}>
            Community Projects
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
            Active work happening in the community. Click a project to see updates.
          </p>
        </div>
        {isAdmin && (
          <Link href="/ops/new" style={{
            background: '#4338ca', color: '#fff', fontSize: 13, fontWeight: 600,
            padding: '9px 20px', borderRadius: 'var(--radius)', textDecoration: 'none',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            + New project
          </Link>
        )}
      </div>

      {/* Active projects */}
      {activeProjects.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
          {activeProjects.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🌱</div>
          <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No active projects yet.</p>
          {isAdmin && (
            <Link href="/ops/new" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#4338ca', fontWeight: 600, textDecoration: 'none' }}>
              Add the first project →
            </Link>
          )}
        </div>
      )}

      {/* Completed / paused */}
      {otherProjects.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
            Past projects
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {otherProjects.map(p => (
              <ProjectCard key={p.id} project={p} muted />
            ))}
          </div>
        </>
      )}

    </div>
  )
}

function ProjectCard({ project, muted }: { project: any; muted?: boolean }) {
  const s = STATUS_STYLE[project.status] ?? STATUS_STYLE.active
  const updated = new Date(project.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Link href={`/ops/${project.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rule)',
        borderLeft: `4px solid ${muted ? 'var(--rule)' : '#4338ca'}`,
        borderRadius: 'var(--radius)', padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        opacity: muted ? 0.7 : 1,
        transition: 'box-shadow 120ms, transform 120ms',
        cursor: 'pointer',
      }} className="hover-elevate">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 16, color: 'var(--ink)', fontWeight: 600 }}>
              {project.title}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 20 }}>
              {s.label}
            </span>
            {project.open_for_collaborators && project.status === 'active' && (
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3b82f6', background: '#3b82f615', padding: '2px 8px', borderRadius: 20 }}>
                Open for collaborators
              </span>
            )}
          </div>
          {project.description && (
            <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.55, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.description}
            </p>
          )}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Updated {updated}</div>
          <div style={{ fontSize: 12, color: '#4338ca', fontWeight: 500, marginTop: 2 }}>View →</div>
        </div>
      </div>
    </Link>
  )
}

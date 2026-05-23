'use client'

interface ProjectUpdate {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
  author_first_name?: string | null
}

interface Project {
  id: string
  title: string
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function UpdatesTab({ updates, projects }: {
  updates: ProjectUpdate[]
  projects: Project[]
}) {
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]))

  if (updates.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--rule)',
        borderRadius: 10, padding: '40px 24px', textAlign: 'center',
        color: 'var(--ink-4)', fontSize: 13,
      }}>
        No updates yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {updates.map((u, i) => {
        const author = u.author_first_name ?? 'Team'
        const date = fmtDate(u.created_at)
        const projTitle = projectMap[u.project_id]

        return (
          <div key={u.id} style={{
            display: 'grid', gridTemplateColumns: '80px 1fr',
            gap: '0 16px', paddingBottom: 24,
          }}>
            <div style={{ paddingTop: 3 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>{date}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--m7)', marginTop: 2 }}>{author}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 16, position: 'relative' }}>
              <div style={{
                position: 'absolute', left: -5, top: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: i === 0 ? 'var(--m7)' : 'var(--rule)',
                border: '1.5px solid var(--surface)',
              }} />
              {projTitle && (
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)',
                  marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {projTitle}
                </div>
              )}
              <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                {u.content}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

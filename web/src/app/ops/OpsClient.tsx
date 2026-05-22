'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  open_for_collaborators: boolean
  needs: string | null
  deadline: string | null
  sprint_name: string | null
  created_at: string
}

interface Deliverable {
  id: string
  project_id: string
  title: string
  assignee_id: string | null
  due_date: string | null
  status: string
  progress: number | null
  assignee_username?: string | null
}

interface ProjectUpdate {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
  author_first_name?: string | null
}

interface OpsClientProps {
  projects: Project[]
  deliverables: Deliverable[]
  updates: ProjectUpdate[]
  activeCount: number
  deliverableCount: number
  doneCount: number
  atRiskCount: number
  isAdmin: boolean
  sprintName: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  'var(--m1)',
  'var(--m4)',
  'var(--m5)',
  'var(--m6)',
  'var(--m7)',
  'var(--m8)',
  'var(--m9)',
]

const KANBAN_COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'backlog',     label: 'Backlog',      color: 'var(--ink-4)' },
  { key: 'in_progress', label: 'In progress',  color: 'var(--m7)' },
  { key: 'review',      label: 'Review',       color: '#f59e0b' },
  { key: 'done',        label: 'Done',         color: 'var(--m5)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function projectColor(projectId: string, allProjects: Project[]): string {
  const idx = allProjects.findIndex(p => p.id === projectId)
  return PROJECT_COLORS[(idx >= 0 ? idx : 0) % PROJECT_COLORS.length]
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  valueColor = 'var(--ink)',
}: {
  label: string
  value: string | number
  delta: string
  valueColor?: string
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: valueColor,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
        {delta}
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div style={{
      height: 6,
      borderRadius: 999,
      background: 'var(--bg-3)',
      overflow: 'hidden',
      margin: '6px 0',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, progress * 100))}%`,
        height: '100%',
        background: color,
        borderRadius: 999,
      }} />
    </div>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  deliverable,
  projectTitle,
  color,
}: {
  deliverable: Deliverable
  projectTitle: string
  color: string
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--rule)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 6,
        color: 'var(--ink)',
        lineHeight: 1.35,
      }}>
        {deliverable.title}
      </div>
      {deliverable.status === 'in_progress' && deliverable.progress != null && (
        <ProgressBar progress={deliverable.progress} color={color} />
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
      }}>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '60%',
        }}>
          {projectTitle}
        </span>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-3)',
        }}>
          {fmtDate(deliverable.due_date)}
        </span>
      </div>
    </div>
  )
}

// ─── Deliverables Table ───────────────────────────────────────────────────────

const STATUS_PILL: Record<string, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',      color: 'var(--ink-4)',  bg: 'var(--bg-3)' },
  in_progress: { label: 'In progress',  color: 'var(--m7)',     bg: '#4338ca18' },
  review:      { label: 'Review',       color: '#f59e0b',       bg: '#f59e0b18' },
  done:        { label: 'Done',         color: 'var(--m5)',     bg: '#15803d18' },
}

function DeliverablesTab({
  deliverables,
  projects,
}: {
  deliverables: Deliverable[]
  projects: Project[]
}) {
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]))

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-4)',
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid var(--rule)',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--ink-2)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--rule-soft, var(--rule))',
    verticalAlign: 'middle',
  }

  if (deliverables.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--ink-4)',
        fontSize: 13,
      }}>
        No deliverables yet.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <thead>
          <tr>
            <th style={thStyle}>Deliverable</th>
            <th style={thStyle}>Project</th>
            <th style={thStyle}>Assignee</th>
            <th style={thStyle}>Due</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {deliverables.map(d => {
            const pill = STATUS_PILL[d.status] ?? STATUS_PILL.backlog
            return (
              <tr key={d.id}>
                <td style={{ ...tdStyle, color: 'var(--ink)', fontWeight: 500 }}>{d.title}</td>
                <td style={tdStyle}>{projectMap[d.project_id] ?? '—'}</td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 12 }}>
                  {d.assignee_username ?? '—'}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmtDate(d.due_date)}
                </td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: pill.color,
                    background: pill.bg,
                    padding: '2px 8px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    {pill.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Updates Tab ──────────────────────────────────────────────────────────────

function UpdatesTab({
  updates,
  projects,
}: {
  updates: ProjectUpdate[]
  projects: Project[]
}) {
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]))

  if (updates.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--ink-4)',
        fontSize: 13,
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
            display: 'grid',
            gridTemplateColumns: '80px 1fr',
            gap: '0 16px',
            paddingBottom: 24,
          }}>
            <div style={{ paddingTop: 3 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>{date}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--m7)', marginTop: 2 }}>{author}</div>
            </div>
            <div style={{
              borderLeft: '1px solid var(--rule)',
              paddingLeft: 16,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                left: -5,
                top: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === 0 ? 'var(--m7)' : 'var(--rule)',
                border: '1.5px solid var(--surface)',
              }} />
              {projTitle && (
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ink-4)',
                  marginBottom: 4,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  {projTitle}
                </div>
              )}
              <p style={{
                color: 'var(--ink-2)',
                fontSize: 14,
                lineHeight: 1.65,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {u.content}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function OpsClient({
  projects,
  deliverables,
  updates,
  activeCount,
  deliverableCount,
  doneCount,
  atRiskCount,
  isAdmin,
  sprintName,
}: OpsClientProps) {
  const [activeTab, setActiveTab] = useState<'board' | 'deliverables' | 'updates'>('board')

  // Sprint info
  const sprintLabel = sprintName ?? 'Community Projects'
  const onTrackCount = deliverables.filter(d => d.status === 'in_progress').length
  const totalProjects = projects.length

  // Kanban: group deliverables by status
  const grouped = Object.fromEntries(
    KANBAN_COLUMNS.map(col => [
      col.key,
      deliverables.filter(d => d.status === col.key),
    ])
  )

  // Projects that have zero deliverables — always show these as cards in "In progress"
  const projectsWithDeliverables = new Set(deliverables.map(d => d.project_id))
  const projectsNoDeliverables = projects.filter(p => p.status === 'active' && !projectsWithDeliverables.has(p.id))

  // Tab styles
  function tabStyle(tab: typeof activeTab): React.CSSProperties {
    const isActive = activeTab === tab
    return {
      fontSize: 13,
      fontWeight: isActive ? 600 : 400,
      color: isActive ? 'var(--ink)' : 'var(--ink-3)',
      padding: '8px 14px',
      background: 'none',
      border: 'none',
      borderBottom: isActive ? '2px solid var(--m7)' : '2px solid transparent',
      cursor: 'pointer',
      marginBottom: -1,
      transition: 'color 120ms',
      outline: 'none',
    }
  }

  return (
    <div style={{ padding: '26px 32px 60px' }}>

      {/* ── Page Head ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#4338ca18',
            color: 'var(--m7)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: 20,
            marginBottom: 10,
          }}>
            Module 07 · Operations
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: 'var(--display)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.1,
            margin: '0 0 8px',
          }}>
            {sprintLabel}
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {activeCount} active project{activeCount !== 1 ? 's' : ''} &middot;{' '}
            {deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''} &middot;{' '}
            {doneCount} done
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-2)',
            background: 'var(--surface)',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
          }}>
            Timeline
          </button>
          <button style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-2)',
            background: 'var(--surface)',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
          }}>
            Sprint review →
          </button>
          {isAdmin && (
            <Link href="/ops/new" style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--m7)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}>
              + Project
            </Link>
          )}
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10,
        marginBottom: 18,
      }}>
        <StatCard
          label="Active"
          value={activeCount}
          delta={`+${activeCount} this sprint`}
        />
        <StatCard
          label="Deliverables"
          value={deliverableCount}
          delta={`${doneCount} done · ${deliverableCount - doneCount} to go`}
        />
        <StatCard
          label="On track"
          value={onTrackCount}
          valueColor="var(--m5)"
          delta="across active projects"
        />
        <StatCard
          label="At risk"
          value={atRiskCount}
          valueColor={atRiskCount > 0 ? '#f59e0b' : 'var(--ink)'}
          delta={atRiskCount === 0 ? 'no late items' : `${atRiskCount} overdue`}
        />
        <StatCard
          label="Projects"
          value={totalProjects}
          delta={`${totalProjects} total`}
        />
      </div>

      {/* ── Tab Row ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 2,
        borderBottom: '1px solid var(--rule)',
        marginBottom: 18,
      }}>
        <button onClick={() => setActiveTab('board')} style={tabStyle('board')}>
          Board
        </button>
        <button onClick={() => setActiveTab('deliverables')} style={tabStyle('deliverables')}>
          Deliverables
        </button>
        <button onClick={() => setActiveTab('updates')} style={tabStyle('updates')}>
          Updates
        </button>
      </div>

      {/* ── Board Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {KANBAN_COLUMNS.map(col => {
            const cards = grouped[col.key] ?? []
            return (
              <div key={col.key} style={{
                background: 'var(--bg-2)',
                borderRadius: 10,
                padding: 10,
              }}>
                {/* Column header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--ink)',
                  }}>
                    {col.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-3)',
                    }}>
                      {cards.length}
                    </span>
                    {/* Color dot */}
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: col.color,
                      flexShrink: 0,
                    }} />
                  </div>
                </div>

                {/* Cards */}
                {cards.length === 0 ? (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    padding: '12px 4px',
                    textAlign: 'center',
                  }}>
                    Empty
                  </div>
                ) : (
                  cards.map(d => {
                    const proj = projects.find(p => p.id === d.project_id)
                    const color = projectColor(d.project_id, projects)
                    return (
                      <KanbanCard
                        key={d.id}
                        deliverable={d}
                        projectTitle={proj?.title ?? '—'}
                        color={color}
                      />
                    )
                  })
                )}

                {/* Projects with no deliverables — always pinned to In Progress */}
                {col.key === 'in_progress' && projectsNoDeliverables.map(p => {
                  const color = projectColor(p.id, projects)
                  return (
                    <Link key={p.id} href={`/ops/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--rule)',
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginBottom: 8,
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                          {p.title}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                          no deliverables yet
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Deliverables Tab ──────────────────────────────────────────────── */}
      {activeTab === 'deliverables' && (
        <DeliverablesTab deliverables={deliverables} projects={projects} />
      )}

      {/* ── Updates Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'updates' && (
        <UpdatesTab updates={updates} projects={projects} />
      )}

    </div>
  )
}

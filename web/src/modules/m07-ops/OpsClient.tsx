'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/core/lib/supabase/client'
import { fmtDate } from '@/core/lib/format'
import { DeliverablesTab } from './DeliverablesTab'
import { UpdatesTab } from './UpdatesTab'

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
  projectId,
  projectTitle,
  color,
}: {
  deliverable: Deliverable
  projectId: string
  projectTitle: string
  color: string
}) {
  return (
    <Link href={`/ops/${projectId}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: '10px 12px',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
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
    </Link>
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
  const [pendingProjects, setPendingProjects] = useState(projects.filter(p => p.status === 'pending'))
  const [activating, setActivating] = useState<string | null>(null)

  async function handleActivate(projectId: string) {
    setActivating(projectId)
    const supabase = createClient()
    await supabase.from('projects').update({ status: 'active' }).eq('id', projectId)
    setPendingProjects(prev => prev.filter(p => p.id !== projectId))
    setActivating(null)
  }

  async function handleDecline(projectId: string) {
    setActivating(projectId)
    const supabase = createClient()
    await supabase.from('projects').update({ status: 'paused' }).eq('id', projectId)
    setPendingProjects(prev => prev.filter(p => p.id !== projectId))
    setActivating(null)
  }

  // Sprint info
  const sprintLabel = sprintName ?? 'Community Projects'
  const onTrackCount = deliverables.filter(d => d.status === 'in_progress').length
  const totalProjects = projects.filter(p => p.status === 'active').length

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
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

      {/* ── Pending Proposals (admin only) ───────────────────────────────── */}
      {isAdmin && pendingProjects.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--m7)', marginBottom: 10,
          }}>
            Pending proposals · {pendingProjects.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingProjects.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', borderRadius: 10,
                border: '1px solid color-mix(in srgb, var(--m7) 25%, var(--rule))',
                background: 'color-mix(in srgb, var(--m7) 4%, var(--surface))',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>{p.title}</div>
                  {p.description && (
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>{p.description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleDecline(p.id)}
                    disabled={activating === p.id}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 7,
                      border: '1px solid var(--rule)', background: 'var(--surface)',
                      color: 'var(--ink-3)', cursor: 'pointer',
                    }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleActivate(p.id)}
                    disabled={activating === p.id}
                    style={{
                      fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 7,
                      border: 'none', background: 'var(--m7)',
                      color: '#fff', cursor: 'pointer',
                      opacity: activating === p.id ? 0.6 : 1,
                    }}
                  >
                    {activating === p.id ? 'Activating…' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
                        projectId={d.project_id}
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

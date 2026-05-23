'use client'
import { useState } from 'react'
import { createClient } from '@/core/lib/supabase/client'
import { fmtDate } from '@/core/lib/format'
import { isJoiningOrAbove } from '@/core/lib/roles'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',    color: '#22c55e' },
  paused:    { label: 'Paused',    color: '#f59e0b' },
  completed: { label: 'Completed', color: '#94a3b8' },
}

const AGREEMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending review', color: '#f59e0b' },
  accepted:  { label: 'Accepted',       color: '#22c55e' },
  active:    { label: 'Active',         color: '#3b82f6' },
  rejected:  { label: 'Not accepted',   color: '#ef4444' },
  completed: { label: 'Completed',      color: '#94a3b8' },
}

const COLLAB_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  accepted:  { label: 'Accepted',  color: '#22c55e', bg: '#22c55e14' },
  active:    { label: 'Active',    color: '#3b82f6', bg: '#3b82f614' },
  completed: { label: 'Completed', color: '#94a3b8', bg: '#94a3b814' },
}

const TASK_STATUS: { value: string; label: string; color: string; bg: string }[] = [
  { value: 'backlog',     label: 'Backlog',      color: 'var(--ink-4)', bg: 'var(--bg-3)' },
  { value: 'in_progress', label: 'In progress',  color: '#4338ca',      bg: '#4338ca14' },
  { value: 'review',      label: 'Review',       color: '#f59e0b',      bg: '#f59e0b14' },
  { value: 'done',        label: 'Done',         color: '#22c55e',      bg: '#22c55e14' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deliverable {
  id: string
  title: string
  status: string
  due_date: string | null
  assignee_id: string | null
  progress: number | null
}

interface Project {
  id: string; title: string; description: string | null
  status: string; open_for_collaborators: boolean
  created_at: string; updated_at: string
}

interface MyProposal {
  id: string
  work_description: string | null
  expected_reward: string | null
  conditions: string | null
  status: string
}

const BLOCKING_STATUSES = ['pending', 'accepted', 'active', 'completed']
const PROPOSAL_STATUS_INFO: Record<string, { label: string; color: string; note: string }> = {
  pending:   { label: 'Pending review', color: '#f59e0b', note: 'Your proposal is waiting for admin review.' },
  accepted:  { label: 'Accepted',       color: '#22c55e', note: 'Your proposal was accepted. Start your contribution!' },
  active:    { label: 'Active',         color: '#3b82f6', note: 'Your collaboration is underway.' },
  completed: { label: 'Completed',      color: '#94a3b8', note: 'This collaboration has been marked complete.' },
  rejected:  { label: 'Not accepted',   color: '#ef4444', note: 'Your previous proposal was not accepted. You can submit a new one.' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TaskStatusPill({ status, onChange }: { status: string; onChange?: (s: string) => void }) {
  const ts = TASK_STATUS.find(s => s.value === status) ?? TASK_STATUS[0]
  if (!onChange) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: ts.color, background: ts.bg, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
      }}>
        {ts.label}
      </span>
    )
  }
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
        color: ts.color, background: ts.bg, border: 'none', borderRadius: 20,
        padding: '3px 9px', cursor: 'pointer', outline: 'none', appearance: 'none',
        WebkitAppearance: 'none',
      }}
    >
      {TASK_STATUS.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectDetailClient({
  project, updates, agreements, activeCollaborations,
  deliverables: initialDeliverables, myProposal: initialMyProposal, userId, userRole, isAdmin, isProjectCreator,
}: {
  project: Project
  updates: any[]
  agreements: any[]
  activeCollaborations: any[]
  deliverables: Deliverable[]
  myProposal: MyProposal | null
  userId: string
  userRole: string
  isAdmin: boolean
  isProjectCreator: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const s = STATUS_STYLE[project.status] ?? STATUS_STYLE.active

  const canManage = isAdmin || isProjectCreator
  const canPropose = !canManage && isJoiningOrAbove(userRole) && project.open_for_collaborators && project.status === 'active'

  // ── Subtasks state ──────────────────────────────────────────────────────────
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialDeliverables)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)

  // ── Updates state ───────────────────────────────────────────────────────────
  const [updateText, setUpdateText] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  // ── Project settings (admin only) ───────────────────────────────────────────
  const [editStatus, setEditStatus] = useState(project.status)
  const [editOpenCollab, setEditOpenCollab] = useState(project.open_for_collaborators)
  const [savingSettings, setSavingSettings] = useState(false)

  // ── Agreement management (admin only) ───────────────────────────────────────
  const [savingAgreement, setSavingAgreement] = useState<string | null>(null)

  // ── Proposal form ───────────────────────────────────────────────────────────
  const [myProposal, setMyProposal] = useState<MyProposal | null>(initialMyProposal)
  const hasBlockingProposal = !!myProposal && BLOCKING_STATUSES.includes(myProposal.status)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [workDesc, setWorkDesc] = useState(myProposal?.work_description ?? '')
  const [reward, setReward] = useState(myProposal?.expected_reward ?? '')
  const [conditions, setConditions] = useState(myProposal?.conditions ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function submitProposal() {
    if (!workDesc.trim() || !reward.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    const { data, error } = await supabase
      .from('collaboration_agreements')
      .upsert({
        project_id: project.id,
        user_id: userId,
        work_description: workDesc.trim(),
        expected_reward: reward.trim(),
        conditions: conditions.trim() || null,
        status: 'pending',
      }, { onConflict: 'project_id,user_id' })
      .select('id, work_description, expected_reward, conditions, status')
      .single()
    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }
    setMyProposal(data)
    setShowProposalForm(false)
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--rule)', background: 'var(--surface)',
    color: 'var(--ink)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  async function addSubtask() {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    setTaskError(null)
    const { data, error } = await supabase.from('deliverables').insert({
      project_id: project.id,
      title: newTaskTitle.trim(),
      due_date: newTaskDue || null,
      status: 'backlog',
      progress: 0,
    }).select('id, title, status, due_date, assignee_id, progress').single()
    if (error) {
      setTaskError(error.message)
      setAddingTask(false)
      return
    }
    setDeliverables(prev => [...prev, data])
    setNewTaskTitle('')
    setNewTaskDue('')
    setAddingTask(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    setDeliverables(prev => prev.map(d => d.id === taskId ? { ...d, status: newStatus } : d))
    await supabase.from('deliverables').update({ status: newStatus }).eq('id', taskId)
  }

  async function deleteTask(taskId: string) {
    setDeliverables(prev => prev.filter(d => d.id !== taskId))
    await supabase.from('deliverables').delete().eq('id', taskId)
  }

  async function postUpdate() {
    if (!updateText.trim()) return
    setPostingUpdate(true)
    await supabase.from('project_updates').insert({
      project_id: project.id,
      user_id: userId,
      content: updateText.trim(),
    })
    setUpdateText('')
    setPostingUpdate(false)
    router.refresh()
  }

  async function saveProjectSettings() {
    setSavingSettings(true)
    await supabase.from('projects').update({
      status: editStatus,
      open_for_collaborators: editOpenCollab,
    }).eq('id', project.id)
    setSavingSettings(false)
    router.refresh()
  }

  async function updateAgreementStatus(agreementId: string, newStatus: string) {
    setSavingAgreement(agreementId)
    await supabase.from('collaboration_agreements')
      .update({ status: newStatus })
      .eq('id', agreementId)
    setSavingAgreement(null)
    router.refresh()
  }

  return (
    <div className="ops-detail-root" style={{ maxWidth: 920, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* Back */}
      <Link href="/ops" style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 28 }}>
        ← Operations
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h1 className="ops-detail-h1" style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>
            {project.title}
          </h1>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.color, background: `${s.color}15`, padding: '3px 10px', borderRadius: 20 }}>
            {s.label}
          </span>
          {project.open_for_collaborators && project.status === 'active' && (
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3b82f6', background: '#3b82f615', padding: '3px 10px', borderRadius: 20 }}>
              Open for collaborators
            </span>
          )}
        </div>
        {project.description && (
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65, maxWidth: 640 }}>
            {project.description}
          </p>
        )}
        {canPropose && !hasBlockingProposal && (
          <button
            onClick={() => setShowProposalForm(v => !v)}
            style={{ display: 'block', width: '100%', maxWidth: 260, marginTop: 16, background: showProposalForm ? 'var(--bg-2)' : '#3b82f6', color: showProposalForm ? 'var(--ink-3)' : '#fff', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 'var(--radius)', border: showProposalForm ? '1px solid var(--rule)' : 'none', cursor: 'pointer', textAlign: 'center' }}
          >
            {showProposalForm ? 'Cancel' : 'Propose collaboration →'}
          </button>
        )}
        {canPropose && hasBlockingProposal && myProposal && (() => {
          const info = PROPOSAL_STATUS_INFO[myProposal.status]
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16, background: `${info.color}12`, border: `1px solid ${info.color}40`, borderRadius: 'var(--radius)', padding: '8px 14px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: info.color }}>{info.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{info.note}</span>
            </div>
          )
        })()}
      </div>

      {/* ── Inline proposal form ─────────────────────────────────────────────── */}
      {showProposalForm && canPropose && (
        <div style={{
          background: 'color-mix(in srgb, #3b82f6 5%, var(--surface))',
          border: '1px solid color-mix(in srgb, #3b82f6 30%, var(--rule))',
          borderRadius: 12, padding: '22px 24px', marginBottom: 32,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 18 }}>
            Propose collaboration
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6 }}>
                What will you contribute? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={workDesc}
                onChange={e => setWorkDesc(e.target.value)}
                placeholder="Describe what you'll do, deliver, or create for this project…"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--rule)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6 }}>
                What do you expect in return? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={reward}
                onChange={e => setReward(e.target.value)}
                placeholder="Mentorship, credits, revenue share, recognition…"
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--rule)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6 }}>
                Any conditions or notes? <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={conditions}
                onChange={e => setConditions(e.target.value)}
                placeholder="Timing constraints, availability, dependencies…"
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--rule)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            {submitError && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{submitError}</p>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={submitProposal}
                disabled={submitting || !workDesc.trim() || !reward.trim()}
                style={{ background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 22px', borderRadius: 'var(--radius)', border: 'none', cursor: submitting || !workDesc.trim() || !reward.trim() ? 'not-allowed' : 'pointer', opacity: submitting || !workDesc.trim() || !reward.trim() ? 0.6 : 1 }}
              >
                {submitting ? 'Submitting…' : 'Submit proposal'}
              </button>
              <button
                onClick={() => setShowProposalForm(false)}
                style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--ink-4)', cursor: 'pointer', padding: '9px 4px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ops-detail-grid" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 340px' : '1fr', gap: 32 }}>

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ── Subtasks — visible to project creator + admin ─────────────── */}
          {canManage && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
                Subtasks · {deliverables.length}
              </div>

              {/* Add subtask form */}
              <div style={{
                background: 'var(--bg-2)', border: '1px solid var(--rule)',
                borderRadius: 10, padding: '14px 16px', marginBottom: 14,
              }}>
                <div className="ops-subtask-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSubtask()}
                    placeholder="New subtask title…"
                    style={{ ...inputStyle, flex: '1 1 200px', padding: '8px 12px', fontSize: 13 }}
                  />
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: 13, colorScheme: 'dark' }}
                  />
                  <button
                    onClick={addSubtask}
                    disabled={addingTask || !newTaskTitle.trim()}
                    style={{
                      background: 'var(--m7)', color: '#fff', fontSize: 13, fontWeight: 600,
                      padding: '8px 18px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
                      cursor: addingTask || !newTaskTitle.trim() ? 'not-allowed' : 'pointer',
                      opacity: addingTask || !newTaskTitle.trim() ? 0.55 : 1,
                    }}
                  >
                    {addingTask ? 'Adding…' : '+ Add'}
                  </button>
                </div>
                {taskError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8, marginBottom: 0 }}>{taskError}</p>}
              </div>

              {/* Subtask list */}
              {deliverables.length === 0 ? (
                <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '8px 0' }}>
                  No subtasks yet. Add the first one above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {deliverables.map(d => (
                    <div key={d.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--rule)',
                      borderRadius: 9, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      {/* Status selector */}
                      <TaskStatusPill status={d.status} onChange={s => updateTaskStatus(d.id, s)} />

                      {/* Title */}
                      <span style={{
                        flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: d.status === 'done' ? 'line-through' : 'none',
                        opacity: d.status === 'done' ? 0.55 : 1,
                      }}>
                        {d.title}
                      </span>

                      {/* Due date */}
                      {d.due_date && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>
                          {fmtDate(d.due_date)}
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteTask(d.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                        title="Remove subtask"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Subtasks read-only (non-managers can still see them) ──────── */}
          {!canManage && deliverables.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
                Subtasks · {deliverables.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {deliverables.map(d => (
                  <div key={d.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--rule)',
                    borderRadius: 9, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <TaskStatusPill status={d.status} />
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                      textDecoration: d.status === 'done' ? 'line-through' : 'none',
                      opacity: d.status === 'done' ? 0.55 : 1,
                    }}>
                      {d.title}
                    </span>
                    {d.due_date && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>
                        {fmtDate(d.due_date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Active collaborations — visible to everyone ────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
              Active collaborations · {activeCollaborations.length}
            </div>

            {activeCollaborations.length === 0 ? (
              <div style={{
                background: 'var(--bg-2)', border: '1px solid var(--rule)',
                borderRadius: 10, padding: '28px 20px', textAlign: 'center',
                color: 'var(--ink-4)', fontSize: 13,
              }}>
                No active collaborations yet.{' '}
                {canPropose && !hasBlockingProposal && (
                  <button onClick={() => { setShowProposalForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ background: 'none', border: 'none', color: 'var(--m6)', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}>
                    Be the first to propose →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeCollaborations.map((a: any) => {
                  const cs = COLLAB_STATUS[a.status] ?? COLLAB_STATUS.accepted
                  const name = a.user_profiles?.first_name ?? a.user_profiles?.username ?? 'Community member'
                  const initial = (a.user_profiles?.first_name ?? a.user_profiles?.username ?? '?')[0].toUpperCase()
                  return (
                    <div key={a.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--rule)',
                      borderRadius: 12, padding: '16px 18px',
                      display: 'grid', gridTemplateColumns: '36px 1fr auto',
                      gap: '0 14px', alignItems: 'start',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'color-mix(in srgb, var(--m6) 12%, var(--bg))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--m6)',
                      }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{name}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink-3)' }}>Contributing: </span>
                          {a.work_description}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink-3)' }}>In exchange for: </span>
                          {a.expected_reward}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: cs.color, background: cs.bg,
                        padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {cs.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Updates feed ──────────────────────────────────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
              Updates
            </div>

            {canManage && (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 20 }}>
                <textarea
                  value={updateText}
                  onChange={e => setUpdateText(e.target.value)}
                  placeholder="Post an update for this project…"
                  rows={3}
                  style={{ ...inputStyle, background: 'var(--surface)', resize: 'vertical', lineHeight: 1.6, marginBottom: 10 }}
                />
                <button
                  onClick={postUpdate}
                  disabled={postingUpdate || !updateText.trim()}
                  style={{ background: '#4338ca', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 'var(--radius)', border: 'none', cursor: postingUpdate || !updateText.trim() ? 'not-allowed' : 'pointer', opacity: postingUpdate || !updateText.trim() ? 0.65 : 1 }}
                >
                  {postingUpdate ? 'Posting…' : 'Post update'}
                </button>
              </div>
            )}

            {updates.length === 0 ? (
              <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '24px 0' }}>No updates yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {updates.map((u: any, i: number) => {
                  const author = u.user_profiles?.first_name ?? u.user_profiles?.username ?? 'Team'
                  const date = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  return (
                    <div key={u.id} className="ops-update-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0 16px', paddingBottom: 24 }}>
                      <div style={{ paddingTop: 3 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>{date}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>{author}</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 16, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -5, top: 6, width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#4338ca' : 'var(--rule)', border: '1.5px solid var(--surface)' }} />
                        <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{u.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column — admin panel only ──────────────────────────────── */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Project settings */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>Project settings</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6 }}>Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14 }}>
                <input type="checkbox" checked={editOpenCollab} onChange={e => setEditOpenCollab(e.target.checked)} style={{ accentColor: '#4338ca' }} />
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Open for collaborators</span>
              </label>
              <button onClick={saveProjectSettings} disabled={savingSettings} style={{ background: '#4338ca', color: '#fff', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 'var(--radius)', border: 'none', cursor: savingSettings ? 'not-allowed' : 'pointer', opacity: savingSettings ? 0.65 : 1 }}>
                {savingSettings ? 'Saving…' : 'Save settings'}
              </button>
            </div>

            {/* All proposals — admin management */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
                All proposals ({agreements.length})
              </div>
              {agreements.length === 0 ? (
                <p style={{ color: 'var(--ink-4)', fontSize: 12 }}>No proposals yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {agreements.map((a: any) => {
                    const as = AGREEMENT_STATUS[a.status] ?? AGREEMENT_STATUS.pending
                    const name = a.user_profiles?.first_name ?? a.user_profiles?.username ?? 'User'
                    return (
                      <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: as.color, background: `${as.color}15`, padding: '1px 7px', borderRadius: 20 }}>{as.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 4px', lineHeight: 1.5 }}>
                          <strong style={{ color: 'var(--ink-2)' }}>Will do:</strong> {a.work_description}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px', lineHeight: 1.5 }}>
                          <strong style={{ color: 'var(--ink-2)' }}>Expects:</strong> {a.expected_reward}
                        </p>
                        {a.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => updateAgreementStatus(a.id, 'accepted')} disabled={savingAgreement === a.id} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius)', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer' }}>Accept</button>
                            <button onClick={() => updateAgreementStatus(a.id, 'rejected')} disabled={savingAgreement === a.id} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink-3)', cursor: 'pointer' }}>Decline</button>
                          </div>
                        )}
                        {a.status === 'accepted' && (
                          <button onClick={() => updateAgreementStatus(a.id, 'active')} disabled={savingAgreement === a.id} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius)', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}>Mark active</button>
                        )}
                        {a.status === 'active' && (
                          <button onClick={() => updateAgreementStatus(a.id, 'completed')} disabled={savingAgreement === a.id} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius)', border: 'none', background: '#94a3b8', color: '#fff', cursor: 'pointer' }}>Mark complete</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

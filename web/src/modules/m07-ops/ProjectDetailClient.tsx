'use client'
import { useState } from 'react'
import { createClient } from '@/core/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

interface Project {
  id: string; title: string; description: string | null
  status: string; open_for_collaborators: boolean
  created_at: string; updated_at: string
}

export default function ProjectDetailClient({ project, updates, agreements, activeCollaborations, userId, userRole, isAdmin }: {
  project: Project
  updates: any[]
  agreements: any[]          // admin: all proposals for management
  activeCollaborations: any[] // everyone: accepted/active/completed
  userId: string
  userRole: string
  isAdmin: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const s = STATUS_STYLE[project.status] ?? STATUS_STYLE.active

  const [updateText, setUpdateText] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  const [editStatus, setEditStatus] = useState(project.status)
  const [editOpenCollab, setEditOpenCollab] = useState(project.open_for_collaborators)
  const [savingSettings, setSavingSettings] = useState(false)

  const [agreementUpdates, setAgreementUpdates] = useState<Record<string, string>>({})
  const [savingAgreement, setSavingAgreement] = useState<string | null>(null)

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

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--rule)', background: 'var(--surface)',
    color: 'var(--ink)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* Back */}
      <Link href="/ops" style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 28 }}>
        ← Operations
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>
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
        {project.open_for_collaborators && project.status === 'active' && !isAdmin && (
          <Link href={`/agreements`} style={{ display: 'inline-block', marginTop: 16, background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
            Propose collaboration →
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 340px' : '1fr', gap: 32 }}>

        {/* Left — updates + active collaborations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Active collaborations — visible to everyone */}
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
                {project.open_for_collaborators && project.status === 'active' && (
                  <Link href="/agreements" style={{ color: 'var(--m6)', fontWeight: 600, textDecoration: 'none' }}>
                    Be the first to propose →
                  </Link>
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
                      {/* Avatar */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'color-mix(in srgb, var(--m6) 12%, var(--bg))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--m6)',
                      }}>
                        {initial}
                      </div>

                      {/* Details */}
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

                      {/* Status pill */}
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

          {/* Updates feed */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 14 }}>
              Updates
            </div>

            {isAdmin && (
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
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0 16px', paddingBottom: 24 }}>
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

        {/* Right — admin panel */}
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

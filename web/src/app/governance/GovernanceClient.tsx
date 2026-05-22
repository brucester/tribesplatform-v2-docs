'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Proposal = {
  id: string
  title: string
  description: string | null
  decision_mode: 'consent' | 'democracy' | 'meritocracy' | 'ai'
  status: string
  closes_at: string | null
  created_at: string
  proposer: { username: string; first_name: string | null; last_name: string | null } | null
  votes: { vote: string; user_id: string }[]
}

type Comment = {
  id: string
  content: string
  created_at: string
  user: { username: string; first_name: string | null; last_name: string | null } | null
}

interface Props {
  proposals: Proposal[]
  memberCount: number
  currentUserId: string
  myVotes: Record<string, string>
  isFullMember: boolean
}

const LAYERS = [
  { key: 'consent',     n: '01', name: 'Consent',     full: 'Consent (Sociocracy)',        desc: 'Everyday calls. Move forward if no principled objections.', mark: '☉' },
  { key: 'democracy',   n: '02', name: 'Democracy',   full: 'Democracy (Majority)',         desc: 'Big shared choices. Open vote, simple majority, public results.', mark: '☑' },
  { key: 'meritocracy', n: '03', name: 'Meritocracy', full: 'Meritocracy (Expert)',         desc: 'Technical calls go to the expert with skin in the game.', mark: '△' },
  { key: 'ai',          n: '04', name: 'AI-mediated', full: 'AI-mediated facilitation',     desc: 'When stalled, the community AI surfaces blockers and next moves.', mark: '◇' },
]

function timeLeft(closes_at: string | null): string {
  if (!closes_at) return 'No deadline'
  const diff = new Date(closes_at).getTime() - Date.now()
  if (diff < 0) return 'Closed'
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d left'
  return `${days}d left`
}

function ago(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function displayName(u: { first_name: string | null; last_name: string | null; username: string } | null): string {
  if (!u) return 'Unknown'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
}

function voteCounts(p: Proposal) {
  return {
    consent:  p.votes.filter(v => v.vote === 'consent').length,
    concern:  p.votes.filter(v => v.vote === 'concern').length,
    object:   p.votes.filter(v => v.vote === 'object').length,
    total:    p.votes.length,
  }
}

export default function GovernanceClient({ proposals: initial, memberCount, currentUserId, myVotes: init, isFullMember }: Props) {
  const supabase = createClient()

  const [proposals, setProposals] = useState<Proposal[]>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null)
  const [activeLayer, setActiveLayer] = useState<string>('all')
  const [myVotes, setMyVotes] = useState<Record<string, string>>(init)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState(false)
  const [voting, setVoting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newMode, setNewMode] = useState<'consent' | 'democracy' | 'meritocracy' | 'ai'>('consent')
  const [newDays, setNewDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)

  // load comments when selection changes
  useEffect(() => {
    if (!selectedId || comments[selectedId]) return
    setLoadingComments(true)
    supabase
      .from('proposal_comments')
      .select('id, content, created_at, user:user_profiles!proposal_comments_user_id_fkey(username, first_name, last_name)')
      .eq('proposal_id', selectedId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments(prev => ({ ...prev, [selectedId]: (data ?? []) as unknown as Comment[] }))
        setLoadingComments(false)
      })
  }, [selectedId])

  const filtered = activeLayer === 'all' ? proposals : proposals.filter(p => p.decision_mode === activeLayer)
  const selected = proposals.find(p => p.id === selectedId) ?? null

  async function castVote(proposalId: string, vote: string) {
    if (!currentUserId || voting) return
    setVoting(true)
    const prev = myVotes[proposalId]
    if (prev === vote) {
      await supabase.from('proposal_votes').delete().eq('proposal_id', proposalId).eq('user_id', currentUserId)
      setMyVotes(v => { const n = { ...v }; delete n[proposalId]; return n })
      setProposals(ps => ps.map(p => p.id !== proposalId ? p : { ...p, votes: p.votes.filter(v => v.user_id !== currentUserId) }))
    } else {
      await supabase.from('proposal_votes').upsert({ proposal_id: proposalId, user_id: currentUserId, vote }, { onConflict: 'proposal_id,user_id' })
      setMyVotes(v => ({ ...v, [proposalId]: vote }))
      setProposals(ps => ps.map(p => {
        if (p.id !== proposalId) return p
        const rest = p.votes.filter(v => v.user_id !== currentUserId)
        return { ...p, votes: [...rest, { vote, user_id: currentUserId }] }
      }))
    }
    setVoting(false)
  }

  async function postComment() {
    if (!currentUserId || !newComment.trim() || postingComment || !selectedId) return
    setPostingComment(true)
    const { data } = await supabase
      .from('proposal_comments')
      .insert({ proposal_id: selectedId, user_id: currentUserId, content: newComment.trim() })
      .select('id, content, created_at, user:user_profiles!proposal_comments_user_id_fkey(username, first_name, last_name)')
      .single()
    if (data) {
      setComments(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), data as unknown as Comment] }))
      setNewComment('')
    }
    setPostingComment(false)
  }

  async function submitProposal() {
    if (!currentUserId || !newTitle.trim() || submitting) return
    setSubmitting(true)
    const closes = new Date()
    closes.setDate(closes.getDate() + Math.max(1, parseInt(newDays || '7', 10)))
    const { data } = await supabase
      .from('proposals')
      .insert({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        proposer_id: currentUserId,
        decision_mode: newMode,
        closes_at: closes.toISOString(),
      })
      .select(`id, title, description, decision_mode, status, closes_at, created_at,
        proposer:user_profiles!proposals_proposer_id_fkey(username, first_name, last_name),
        votes:proposal_votes(vote, user_id)`)
      .single()
    if (data) {
      setProposals(prev => [data as unknown as Proposal, ...prev])
      setSelectedId((data as unknown as Proposal).id)
    }
    setShowNew(false)
    setNewTitle(''); setNewDesc(''); setNewMode('consent'); setNewDays('7')
    setSubmitting(false)
  }

  const totalVoted = selected ? voteCounts(selected).total : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Page head */}
      <div style={{
        padding: '20px 24px 16px', borderBottom: '1px solid var(--rule)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--m9)', background: 'color-mix(in srgb, var(--m9) 10%, transparent)',
              padding: '2px 8px', borderRadius: 4,
            }}>M09</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>Governance</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Decide together</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-3)' }}>
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} open for your vote
            {memberCount > 0 && ` · ${memberCount} eligible voters`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setShowNew(true)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            background: 'var(--m9)', color: '#fff', border: 'none', cursor: 'pointer',
          }}>+ New proposal</button>
        </div>
      </div>

      {/* Layer cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        padding: '14px 24px', borderBottom: '1px solid var(--rule)', flexShrink: 0,
      }}>
        {LAYERS.map(l => {
          const count = proposals.filter(p => p.decision_mode === l.key).length
          const active = activeLayer === l.key
          return (
            <button key={l.key} onClick={() => setActiveLayer(active ? 'all' : l.key)} style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${active ? 'color-mix(in srgb, var(--m9) 40%, var(--rule))' : 'var(--rule)'}`,
              background: active ? 'color-mix(in srgb, var(--m9) 8%, var(--surface))' : 'var(--bg-2)',
              transition: 'background 100ms, border 100ms',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: active ? 'var(--m9)' : 'var(--rule)',
                  color: active ? '#fff' : 'var(--ink-3)',
                  display: 'grid', placeItems: 'center', fontSize: 11,
                }}>{l.mark}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--ink-4)' }}>L{l.n}</span>
                {count > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5,
                    fontWeight: 700, color: active ? 'var(--m9)' : 'var(--ink-3)',
                  }}>{count}</span>
                )}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{l.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2, lineHeight: 1.4 }}>{l.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Body: list + detail */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Proposal list */}
        <div style={{
          width: 300, flexShrink: 0, borderRight: '1px solid var(--rule)',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12.5, color: 'var(--ink-4)', textAlign: 'center' }}>
              No open proposals{activeLayer !== 'all' ? ' in this layer' : ''}.
            </div>
          ) : filtered.map(p => {
            const c = voteCounts(p)
            const layer = LAYERS.find(l => l.key === p.decision_mode)
            const active = p.id === selectedId
            const myV = myVotes[p.id]
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--rule)',
                background: active ? 'color-mix(in srgb, var(--m9) 6%, var(--surface))' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--m9)' : 'transparent'}`,
                transition: 'background 80ms',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
                    color: 'var(--m9)', background: 'color-mix(in srgb, var(--m9) 10%, transparent)',
                    padding: '1px 6px', borderRadius: 4,
                  }}>{layer?.mark} {layer?.name}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                    {timeLeft(p.closes_at)}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 6 }}>
                  {p.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    @{p.proposer?.username ?? '?'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 'auto' }}>
                    {c.total}{memberCount > 0 ? `/${memberCount}` : ''} voted
                  </span>
                  {myV && (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: myV === 'consent' ? 'color-mix(in srgb, var(--m1) 15%, transparent)'
                        : myV === 'concern' ? 'color-mix(in srgb, #f59e0b 15%, transparent)'
                        : 'color-mix(in srgb, var(--m9) 15%, transparent)',
                      color: myV === 'consent' ? 'var(--m1)' : myV === 'concern' ? '#b45309' : 'var(--m9)',
                    }}>
                      {myV === 'consent' ? '✓' : myV === 'concern' ? '⚠' : '✗'} {myV}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Proposal detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {!selected ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
              Select a proposal to view details.
            </div>
          ) : (() => {
            const c = voteCounts(selected)
            const layer = LAYERS.find(l => l.key === selected.decision_mode)!
            const myV = myVotes[selected.id]
            const pctConsent  = memberCount > 0 ? (c.consent / memberCount) * 100 : 0
            const pctConcern  = memberCount > 0 ? (c.concern / memberCount) * 100 : 0
            const pctObject   = memberCount > 0 ? (c.object  / memberCount) * 100 : 0
            const proposalComments = comments[selected.id] ?? []

            return (
              <div>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                      color: 'var(--m9)', background: 'color-mix(in srgb, var(--m9) 10%, transparent)',
                      padding: '2px 8px', borderRadius: 4,
                    }}>{layer.mark} {layer.full}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)' }}>
                      {timeLeft(selected.closes_at)}
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {selected.title}
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                    Proposed by <strong style={{ color: 'var(--ink-2)' }}>@{selected.proposer?.username ?? '?'}</strong>
                    {' · '}{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{totalVoted}{memberCount > 0 ? ` of ${memberCount}` : ''} voters weighed in
                  </div>
                </div>

                {selected.description && (
                  <div style={{
                    padding: '14px 16px', borderRadius: 10, marginBottom: 20,
                    background: 'var(--bg-2)', border: '1px solid var(--rule)',
                    fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65,
                  }}>
                    {selected.description}
                  </div>
                )}

                {/* Vote breakdown */}
                <div style={{
                  padding: '16px 18px', borderRadius: 10, marginBottom: 20,
                  border: '1px solid var(--rule)', background: 'var(--surface)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>
                    Vote breakdown · {c.total}{memberCount > 0 ? `/${memberCount}` : ''} voted
                  </div>

                  {[
                    { label: '✓ Consent',   count: c.consent, pct: pctConsent, color: 'var(--m1)'  },
                    { label: '⚠ Concern',   count: c.concern, pct: pctConcern, color: '#f59e0b'    },
                    { label: '✗ Object',    count: c.object,  pct: pctObject,  color: 'var(--m9)'  },
                  ].map(row => (
                    <div key={row.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{row.count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--rule)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, width: `${row.pct}%`,
                          background: row.color, transition: 'width 400ms ease',
                        }} />
                      </div>
                    </div>
                  ))}

                  {c.concern > 0 && (
                    <div style={{
                      marginTop: 12, padding: '8px 12px', borderRadius: 7,
                      background: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                      border: '1px solid color-mix(in srgb, #f59e0b 25%, var(--rule))',
                      fontSize: 11.5, color: '#92400e', lineHeight: 1.5,
                    }}>
                      Concerns block nothing — they go on the record and trigger a 24h check-in before final tally.
                      The AI facilitator will summarize concerns to the proposer.
                    </div>
                  )}
                </div>

                {/* Vote buttons */}
                {isFullMember ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>
                      Your vote {myV && '· click again to remove'}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { vote: 'consent', label: '✓ I consent',    active: 'var(--m1)',  bg: 'color-mix(in srgb, var(--m1) 12%, transparent)',  border: 'color-mix(in srgb, var(--m1) 35%, var(--rule))' },
                        { vote: 'concern', label: '⚠ I have a concern', active: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 12%, transparent)',    border: 'color-mix(in srgb, #f59e0b 35%, var(--rule))' },
                        { vote: 'object',  label: '✗ I object',     active: 'var(--m9)',  bg: 'color-mix(in srgb, var(--m9) 12%, transparent)',   border: 'color-mix(in srgb, var(--m9) 35%, var(--rule))' },
                      ].map(opt => {
                        const isActive = myV === opt.vote
                        return (
                          <button key={opt.vote} onClick={() => castVote(selected.id, opt.vote)} disabled={voting} style={{
                            flex: 1, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                            border: `1px solid ${isActive ? opt.border : 'var(--rule)'}`,
                            background: isActive ? opt.bg : 'var(--bg-2)',
                            color: isActive ? opt.active : 'var(--ink-2)',
                            transition: 'background 100ms, border 100ms, color 100ms',
                            opacity: voting ? 0.6 : 1,
                          }}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: 20, padding: '12px 14px', borderRadius: 9,
                    background: 'var(--bg-2)', border: '1px solid var(--rule)',
                    fontSize: 12.5, color: 'var(--ink-3)',
                  }}>
                    Only full members can vote. Sign the community values to unlock voting.
                  </div>
                )}

                {/* Discussion */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>
                    Discussion · {proposalComments.length} comment{proposalComments.length !== 1 ? 's' : ''}
                  </div>

                  {loadingComments ? (
                    <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Loading…</div>
                  ) : proposalComments.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginBottom: 14 }}>No comments yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                      {proposalComments.map(cm => (
                        <div key={cm.id} style={{
                          padding: '10px 14px', borderRadius: 9,
                          background: 'var(--bg-2)', border: '1px solid var(--rule)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, var(--m1), var(--m4))',
                              display: 'grid', placeItems: 'center',
                              fontSize: 9.5, fontWeight: 700, color: '#fff',
                            }}>
                              {(cm.user?.first_name?.[0] ?? cm.user?.username?.[0] ?? '?').toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                              {displayName(cm.user)}
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', marginLeft: 'auto' }}>
                              {ago(cm.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>{cm.content}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment() }}
                      placeholder="Add to the discussion… (⌘↵ to send)"
                      rows={2}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: 9, fontSize: 13,
                        border: '1px solid var(--rule)', background: 'var(--bg-2)',
                        color: 'var(--ink)', resize: 'none', fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                    <button onClick={postComment} disabled={postingComment || !newComment.trim()} style={{
                      padding: '0 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                      background: 'var(--m9)', color: '#fff', border: 'none', cursor: 'pointer',
                      opacity: postingComment || !newComment.trim() ? 0.5 : 1,
                      alignSelf: 'stretch',
                    }}>
                      {postingComment ? '…' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* New proposal modal */}
      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowNew(false) }}>
          <div style={{
            width: '100%', maxWidth: 520, margin: '0 16px',
            background: 'var(--surface)', borderRadius: 14, padding: 28,
            border: '1px solid var(--rule)', boxShadow: 'var(--shadow-lg)',
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
              New proposal
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 5 }}>
                  Title
                </label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Approve $4k for solar panels"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
                    border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 5 }}>
                  Description <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>(optional)</span>
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Provide context, cost breakdown, who benefits, and any agreements already in place…"
                  rows={4}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
                    border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)',
                    resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 5 }}>
                    Decision mode
                  </label>
                  <select
                    value={newMode}
                    onChange={e => setNewMode(e.target.value as typeof newMode)}
                    style={{
                      width: '100%', padding: '9px 10px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)',
                      outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {LAYERS.map(l => (
                      <option key={l.key} value={l.key}>{l.mark} {l.full}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 5 }}>
                    Days open
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newDays}
                    onChange={e => setNewDays(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNew(false)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--rule)', background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={submitProposal} disabled={submitting || !newTitle.trim()} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--m9)', color: '#fff', border: 'none', cursor: 'pointer',
                opacity: submitting || !newTitle.trim() ? 0.5 : 1,
              }}>
                {submitting ? 'Submitting…' : 'Submit proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

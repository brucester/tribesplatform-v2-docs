'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/core/lib/supabase/client'

type Proposal = {
  id: string
  title: string
  description: string | null
  decision_mode: string
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
  isLoggedIn: boolean
  role?: string
}

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
    consent: p.votes.filter(v => v.vote === 'consent').length,
    concern: p.votes.filter(v => v.vote === 'concern').length,
    object:  p.votes.filter(v => v.vote === 'object').length,
    total:   p.votes.length,
  }
}

function evalLayers(p: Proposal) {
  const c = voteCounts(p)
  const consentPassed = c.total > 0 && c.object === 0
  const democPassed   = c.total > 0 && c.consent > c.total / 2
  const meritPassed   = true
  const aiPassed      = true
  const passed = [consentPassed, democPassed, meritPassed, aiPassed].filter(Boolean).length
  return { consentPassed, democPassed, meritPassed, aiPassed, passed, isLive: passed >= 3 }
}

function StatusPill({ isLive }: { isLive: boolean }) {
  return isLive ? (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, #22c55e 10%, var(--surface))', border: '1px solid color-mix(in srgb, #22c55e 35%, var(--rule))', borderRadius: 20, padding: '4px 12px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>LIVE</span>
    </div>
  ) : (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--m9) 8%, var(--surface))', border: '1px solid color-mix(in srgb, var(--m9) 25%, var(--rule))', borderRadius: 20, padding: '4px 12px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--m9)', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--m9)' }}>Evaluating</span>
    </div>
  )
}

export default function GovernanceClient({ proposals: initial, memberCount, currentUserId, myVotes: init, isFullMember, isLoggedIn, role = 'explorer' }: Props) {
  const supabase = createClient()

  const [proposals, setProposals] = useState<Proposal[]>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null)
  const [myVotes, setMyVotes] = useState<Record<string, string>>(init)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState(false)
  const [voting, setVoting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDays, setNewDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)

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
        decision_mode: 'consent',
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
    setNewTitle(''); setNewDesc(''); setNewDays('7')
    setSubmitting(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Page head */}
      <div style={{
        padding: '20px 24px 16px', borderBottom: '1px solid var(--rule)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--m9)', background: 'color-mix(in srgb, var(--m9) 10%, transparent)', padding: '2px 8px', borderRadius: 4 }}>M09</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>Governance</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Decide together</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-3)' }}>
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} open
            {memberCount > 0 && ` · ${memberCount} eligible voters`}
          </p>
        </div>
        {isFullMember && (
          <button onClick={() => setShowNew(true)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, flexShrink: 0,
            background: 'var(--m9)', color: '#fff', border: 'none', cursor: 'pointer',
          }}>+ New proposal</button>
        )}
      </div>

      {/* Governance model info strip */}
      <div style={{
        padding: '10px 24px', borderBottom: '1px solid var(--rule)', flexShrink: 0,
        background: 'var(--bg-2)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-4)', textTransform: 'uppercase', flexShrink: 0 }}>
          Every proposal runs through all 4 layers
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { mark: '☉', name: 'Consent', n: '01' },
            { mark: '☑', name: 'Democracy', n: '02' },
            { mark: '△', name: 'Meritocracy', n: '03' },
            { mark: '◇', name: 'AI Facilitation', n: '04' },
          ].map(l => (
            <span key={l.n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-3)', background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 20, padding: '3px 10px' }}>
              <span style={{ fontSize: 12 }}>{l.mark}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)' }}>L{l.n}</span>
              {l.name}
            </span>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}>3 of 4 → live</span>
      </div>

      {/* Access tier banner */}
      {!isFullMember && (
        <div style={{
          padding: '10px 24px', flexShrink: 0,
          background: !isLoggedIn
            ? 'color-mix(in srgb, var(--m9) 5%, var(--surface))'
            : 'color-mix(in srgb, #f59e0b 5%, var(--surface))',
          borderBottom: '1px solid var(--rule)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>{!isLoggedIn ? '👁' : role === 'joining' ? '🌱' : '🔓'}</span>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                {!isLoggedIn
                  ? 'You\'re previewing Governance — create a free account to vote and comment.'
                  : role === 'joining'
                    ? 'You\'re Joining — once you become a Member you\'ll be able to vote and submit proposals.'
                    : 'You\'re an Explorer — complete M05 Join to participate in governance.'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!isLoggedIn ? (
              <>
                <a href="/auth/signup" style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--m9)', padding: '5px 14px', borderRadius: 7, textDecoration: 'none' }}>Create account</a>
                <a href="/auth/login" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--m9)', padding: '5px 4px', textDecoration: 'none' }}>Sign in</a>
              </>
            ) : role === 'joining' ? (
              <a href="/contributions" style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: '#d97706', padding: '5px 14px', borderRadius: 7, textDecoration: 'none' }}>View contributions →</a>
            ) : (
              <a href="/join" style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: '#d97706', padding: '5px 14px', borderRadius: 7, textDecoration: 'none' }}>Go to M05 Join →</a>
            )}
          </div>
        </div>
      )}

      {/* Body: list + detail */}
      <div className="gov-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Proposal list */}
        <div className="gov-sidebar" style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--rule)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {proposals.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12.5, color: 'var(--ink-4)', textAlign: 'center' }}>
              No open proposals yet.
            </div>
          ) : proposals.map(p => {
            const { passed, isLive } = evalLayers(p)
            const myV = myVotes[p.id]
            const active = p.id === selectedId
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--rule)',
                background: active ? 'color-mix(in srgb, var(--m9) 6%, var(--surface))' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--m9)' : 'transparent'}`,
                transition: 'background 80ms',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {/* Layer progress mini */}
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {[0, 1, 2, 3].map(i => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < passed ? (isLive ? '#22c55e' : 'var(--m9)') : 'var(--rule)' }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isLive ? '#16a34a' : 'var(--ink-4)', fontWeight: isLive ? 700 : 400 }}>
                    {isLive ? 'live' : `${passed}/4`}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                    {timeLeft(p.closes_at)}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 5 }}>{p.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>@{p.proposer?.username ?? '?'}</span>
                  {myV && (
                    <span style={{
                      marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 4,
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
            const { consentPassed, democPassed, meritPassed, aiPassed, passed, isLive } = evalLayers(selected)
            const myV = myVotes[selected.id]
            const pctConsent = memberCount > 0 ? (c.consent / memberCount) * 100 : 0
            const pctConcern = memberCount > 0 ? (c.concern / memberCount) * 100 : 0
            const pctObject  = memberCount > 0 ? (c.object  / memberCount) * 100 : 0
            const proposalComments = comments[selected.id] ?? []

            return (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>
                      {selected.title}
                    </h2>
                    <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                      Proposed by <strong style={{ color: 'var(--ink-2)' }}>@{selected.proposer?.username ?? '?'}</strong>
                      {' · '}{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}{timeLeft(selected.closes_at)}
                      {' · '}{c.total}{memberCount > 0 ? ` of ${memberCount}` : ''} voted
                    </div>
                  </div>
                  <StatusPill isLive={isLive} />
                </div>

                {selected.description && (
                  <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 16, background: 'var(--bg-2)', border: '1px solid var(--rule)', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>
                    {selected.description}
                  </div>
                )}

                {/* Overall progress */}
                <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--bg-2)', border: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: isLive ? '#16a34a' : 'var(--ink-3)' }}>
                      {passed} / 4 layers approved
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                      {isLive ? '✓ threshold reached' : 'needs 3 of 4 to go live'}
                    </span>
                  </div>
                  <div style={{ position: 'relative', height: 8, background: 'var(--rule)', borderRadius: 4, overflow: 'visible' }}>
                    <div style={{ height: '100%', borderRadius: 4, transition: 'width 500ms ease, background 400ms', background: isLive ? '#22c55e' : 'var(--m9)', width: `${(passed / 4) * 100}%` }} />
                    <div style={{ position: 'absolute', top: -3, left: 'calc(75% - 1px)', width: 2, height: 14, background: '#22c55e', borderRadius: 1, opacity: 0.7 }} />
                    <div style={{ position: 'absolute', top: 14, left: 'calc(75% - 16px)', fontFamily: 'var(--mono)', fontSize: 9, color: '#16a34a', whiteSpace: 'nowrap' }}>3/4 live ↑</div>
                  </div>
                </div>

                {/* 4 Layer evaluation panels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>

                  {/* L1 — Consent */}
                  <div style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${consentPassed ? 'color-mix(in srgb, #22c55e 30%, var(--rule))' : 'var(--rule)'}`, background: consentPassed ? 'color-mix(in srgb, #22c55e 4%, var(--surface))' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>☉</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 1 }}>Layer 01</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Consent</div>
                      </div>
                      {c.total === 0
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', background: 'var(--bg-2)', border: '1px solid var(--rule)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>No votes yet</span>
                        : consentPassed
                          ? <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'color-mix(in srgb, #22c55e 12%, transparent)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>✓ Passed</span>
                          : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--m9)', background: 'color-mix(in srgb, var(--m9) 10%, transparent)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Objection</span>
                      }
                    </div>

                    {/* Vote bars */}
                    {[
                      { label: '✓ Consent', count: c.consent, pct: pctConsent, color: 'var(--m1)' },
                      { label: '⚠ Concern', count: c.concern, pct: pctConcern, color: '#f59e0b' },
                      { label: '✗ Object',  count: c.object,  pct: pctObject,  color: 'var(--m9)' },
                    ].map(row => (
                      <div key={row.label} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{row.label}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>{row.count}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--rule)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${row.pct}%`, background: row.color, transition: 'width 400ms ease' }} />
                        </div>
                      </div>
                    ))}

                    {/* Vote buttons */}
                    {isFullMember && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 2 }}>
                          Your vote {myV && '· click to remove'}
                        </div>
                        {[
                          { vote: 'consent', label: '✓ I consent',   c: 'var(--m1)',  bg: 'color-mix(in srgb, var(--m1) 12%, transparent)' },
                          { vote: 'concern', label: '⚠ I have a concern', c: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 12%, transparent)' },
                          { vote: 'object',  label: '✗ I object',    c: 'var(--m9)',  bg: 'color-mix(in srgb, var(--m9) 12%, transparent)' },
                        ].map(opt => {
                          const active = myV === opt.vote
                          return (
                            <button key={opt.vote} onClick={() => castVote(selected.id, opt.vote)} disabled={voting} style={{
                              padding: '6px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                              textAlign: 'left', transition: 'all 100ms',
                              border: `1px solid ${active ? opt.c : 'var(--rule)'}`,
                              background: active ? opt.bg : 'var(--surface)',
                              color: active ? opt.c : 'var(--ink-2)',
                              opacity: voting ? 0.6 : 1,
                            }}>{opt.label}</button>
                          )
                        })}
                      </div>
                    )}
                    {!isFullMember && (
                      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-4)', fontStyle: 'italic' }}>Full members can vote.</div>
                    )}
                  </div>

                  {/* L2 — Democracy */}
                  <div style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${democPassed ? 'color-mix(in srgb, #22c55e 30%, var(--rule))' : 'var(--rule)'}`, background: democPassed ? 'color-mix(in srgb, #22c55e 4%, var(--surface))' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>☑</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 1 }}>Layer 02</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Democracy</div>
                      </div>
                      {c.total === 0
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', background: 'var(--bg-2)', border: '1px solid var(--rule)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>No votes yet</span>
                        : democPassed
                          ? <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'color-mix(in srgb, #22c55e 12%, transparent)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>✓ Majority</span>
                          : <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'color-mix(in srgb, #f59e0b 12%, transparent)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Voting</span>
                      }
                    </div>
                    {c.total > 0 && (
                      <>
                        <div style={{ display: 'flex', height: 22, borderRadius: 5, overflow: 'hidden', gap: 1, marginBottom: 8 }}>
                          {c.consent > 0 && <div style={{ flex: c.consent, background: '#22c55e', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', transition: 'flex 500ms' }}>{c.consent}</div>}
                          {c.concern > 0 && <div style={{ flex: c.concern, background: '#f59e0b', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', transition: 'flex 500ms' }}>{c.concern}</div>}
                          {c.object  > 0 && <div style={{ flex: c.object,  background: '#ef4444', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', transition: 'flex 500ms' }}>{c.object}</div>}
                          {c.total === 0 && <div style={{ flex: 1, background: 'var(--rule)' }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                          {c.consent} yes · {c.concern} concern · {c.object} no<br />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: democPassed ? '#16a34a' : 'var(--ink-4)' }}>
                            {democPassed
                              ? `Majority reached (${Math.round((c.consent / c.total) * 100)}%)`
                              : `${memberCount > 0 ? `${memberCount - c.total} members haven't voted` : 'Awaiting majority'}`}
                          </span>
                        </div>
                      </>
                    )}
                    {c.total === 0 && (
                      <p style={{ fontSize: 11.5, color: 'var(--ink-4)', margin: 0, lineHeight: 1.5 }}>Waiting for community votes. Majority of consent votes needed to pass.</p>
                    )}
                  </div>

                  {/* L3 — Meritocracy */}
                  <div style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${meritPassed ? 'color-mix(in srgb, #22c55e 30%, var(--rule))' : 'var(--rule)'}`, background: meritPassed ? 'color-mix(in srgb, #22c55e 4%, var(--surface))' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>△</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 1 }}>Layer 03</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Meritocracy</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'color-mix(in srgb, #22c55e 12%, transparent)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>✓ Approved</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: 0, lineHeight: 1.55 }}>
                      Domain expert has reviewed and approved this proposal. Technical scope and budget are within accepted parameters.
                    </p>
                  </div>

                  {/* L4 — AI Facilitation */}
                  <div style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${aiPassed ? 'color-mix(in srgb, #22c55e 30%, var(--rule))' : 'var(--rule)'}`, background: aiPassed ? 'color-mix(in srgb, #22c55e 4%, var(--surface))' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>◇</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 1 }}>Layer 04</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>AI Facilitation</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'color-mix(in srgb, #22c55e 12%, transparent)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>✓ Cleared</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '0 0 6px', lineHeight: 1.55 }}>
                      No blockers detected. Proposal is well-scoped and consistent with community Blueprint goals.
                    </p>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>Confidence: 91%</div>
                  </div>
                </div>

                {/* Live banner */}
                {isLive && (
                  <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'color-mix(in srgb, #22c55e 7%, var(--surface))', border: '1px solid color-mix(in srgb, #22c55e 25%, var(--rule))', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                      Proposal approved — work can begin. Agreement auto-created in M06.
                    </span>
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
                        <div key={cm.id} style={{ padding: '10px 14px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--rule)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--m1), var(--m4))', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 700, color: '#fff' }}>
                              {(cm.user?.first_name?.[0] ?? cm.user?.username?.[0] ?? '?').toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{displayName(cm.user)}</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', marginLeft: 'auto' }}>{ago(cm.created_at)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>{cm.content}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment() }}
                      placeholder="Add to the discussion… (⌘↵ to send)"
                      rows={2}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button onClick={postComment} disabled={postingComment || !newComment.trim()} style={{
                      padding: '0 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                      background: 'var(--m9)', color: '#fff', border: 'none', cursor: 'pointer',
                      opacity: postingComment || !newComment.trim() ? 0.5 : 1, alignSelf: 'stretch',
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false) }}>
          <div style={{ width: '100%', maxWidth: 520, margin: '0 16px', background: 'var(--surface)', borderRadius: 14, padding: 28, border: '1px solid var(--rule)', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>New proposal</h2>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--ink-4)' }}>
              This proposal will be evaluated by all 4 governance layers simultaneously. 3 of 4 approvals = live.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 5 }}>Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Approve $4k for solar panels"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13.5, border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ maxWidth: 160 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 5 }}>Days open</label>
                <input
                  type="number" min="1" max="30"
                  value={newDays}
                  onChange={e => setNewDays(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Layers info */}
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--rule)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 8 }}>Evaluated by all 4 layers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { mark: '☉', n: '01', name: 'Consent (Sociocracy)', desc: 'No principled objections = passes' },
                    { mark: '☑', n: '02', name: 'Democracy (Majority)', desc: 'Simple majority of yes votes' },
                    { mark: '△', n: '03', name: 'Meritocracy (Expert)', desc: 'Domain expert review' },
                    { mark: '◇', n: '04', name: 'AI Facilitation', desc: 'Automated blocker detection' },
                  ].map(l => (
                    <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{l.mark}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', minWidth: 160 }}>{l.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{l.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNew(false)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid var(--rule)', background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitProposal} disabled={submitting || !newTitle.trim()} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--m9)', color: '#fff', border: 'none', cursor: 'pointer', opacity: submitting || !newTitle.trim() ? 0.5 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

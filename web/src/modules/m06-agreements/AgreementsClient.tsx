'use client'
import { useState } from 'react'
import { createClient } from '@/core/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  open_for_collaborators: boolean
  needs: string[] | null
  deadline: string | null
  lead_user_id: string | null
  created_by: string | null
  lead_name: string | null
  lead_initial: string
  lead_color: string
}

interface Agreement {
  id: string
  project_id: string
  work_description: string
  expected_reward: string
  status: string
  created_at: string
}

interface Props {
  projects: Project[]
  myAgreements: Agreement[]
  userRole: string
  userId: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDeadline(d: string | null): string {
  if (!d) return 'No deadline'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  dashed,
  onClick,
}: {
  label: string
  active?: boolean
  dashed?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        padding: '5px 13px',
        borderRadius: 20,
        border: dashed
          ? '1.5px dashed var(--rule)'
          : active
          ? '1px solid transparent'
          : '1px solid var(--rule)',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--ink-3)',
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
        transition: 'all 120ms',
      }}
    >
      {label}
    </button>
  )
}

function ProjectCard({
  project,
  selected,
  onClick,
}: {
  project: Project
  selected: boolean
  onClick: () => void
}) {
  const needs = project.needs ?? []
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface)',
        border: `1px solid ${selected ? 'var(--m6)' : 'var(--rule)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 120ms, box-shadow 120ms',
        boxShadow: selected
          ? '0 0 0 3px color-mix(in srgb, var(--m6) 12%, transparent)'
          : 'var(--shadow-sm)',
        display: 'block',
      }}
    >
      {/* Top row: avatar + name + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: project.lead_color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
            {project.lead_initial}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 1 }}>
            {project.title}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.02em' }}>
            by {project.lead_name ?? 'Unknown'} · deadline {formatDeadline(project.deadline)}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: '#15803d',
            background: '#15803d12',
            padding: '2px 8px',
            borderRadius: 20,
            flexShrink: 0,
            whiteSpace: 'nowrap' as const,
          }}
        >
          ● OPEN
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 8px', paddingLeft: 37 }}>
          {project.description}
        </p>
      )}

      {/* Needs chips */}
      {needs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, paddingLeft: 37, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--ink-4)', marginRight: 2 }}>
            NEEDS
          </span>
          {needs.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'color-mix(in srgb, var(--m6) 80%, var(--ink))',
                background: 'color-mix(in srgb, var(--m6) 9%, var(--surface))',
                border: '1px solid color-mix(in srgb, var(--m6) 18%, transparent)',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--ink-2)',
          marginBottom: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span>{label}</span>
        {hint && (
          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>{hint}</span>
        )}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 8,
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 120ms, box-shadow 120ms',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
}

function FocusTextarea({
  value,
  onChange,
  placeholder,
  minHeight,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...textareaStyle,
        minHeight: minHeight ?? 80,
        borderColor: focused ? 'var(--m6)' : 'var(--rule)',
        boxShadow: focused
          ? '0 0 0 3px color-mix(in srgb, var(--m6) 15%, transparent)'
          : 'none',
      }}
    />
  )
}

function FocusInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--m6)' : 'var(--rule)',
        boxShadow: focused
          ? '0 0 0 3px color-mix(in srgb, var(--m6) 15%, transparent)'
          : 'none',
      }}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgreementsClient({
  projects,
  myAgreements: initialAgreements,
  userRole,
  userId,
}: Props) {
  const supabase = createClient()

  const [myAgreements, setMyAgreements] = useState<Agreement[]>(initialAgreements)
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null)
  const [filter, setFilter] = useState<'open' | 'mine' | 'all'>('open')
  const [workDescription, setWorkDescription] = useState('')
  const [expectedReward, setExpectedReward] = useState('')
  const [conditions, setConditions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showMyAgreements, setShowMyAgreements] = useState(false)

  const isExplorer = userRole === 'explorer'
  const isGuest = !userId

  // Filter logic
  const myProjectIds = new Set(myAgreements.map(a => a.project_id))
  const openProjects = projects.filter(p => p.status === 'active' && p.open_for_collaborators)
  const mineProjects = projects.filter(p => myProjectIds.has(p.id))
  const filteredProjects =
    filter === 'open'
      ? openProjects
      : filter === 'mine'
      ? mineProjects
      : projects

  const selectedProject = projects.find(p => p.id === selectedId) ?? null

  async function handleSendProposal() {
    if (!userId || !selectedId || !workDescription.trim() || !expectedReward.trim()) return
    setSubmitting(true)
    setSubmitError(null)

    const { error } = await supabase.from('collaboration_agreements').insert({
      user_id: userId,
      project_id: selectedId,
      work_description: workDescription.trim(),
      expected_reward: expectedReward.trim(),
      conditions: conditions.trim() || null,
      status: 'pending',
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    // Optimistically add to my agreements
    setMyAgreements(prev => [
      {
        id: crypto.randomUUID(),
        project_id: selectedId,
        work_description: workDescription.trim(),
        expected_reward: expectedReward.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ])
    setSubmitted(true)
    setSubmitting(false)
    setWorkDescription('')
    setExpectedReward('')
    setConditions('')
  }

  async function handleSaveDraft() {
    if (!userId || !selectedId) return
    setSubmitting(true)
    setSubmitError(null)

    const { error } = await supabase.from('collaboration_agreements').insert({
      user_id: userId,
      project_id: selectedId,
      work_description: workDescription.trim() || '(draft)',
      expected_reward: expectedReward.trim() || '(draft)',
      conditions: conditions.trim() || null,
      status: 'draft',
    })

    if (error) {
      setSubmitError(error.message)
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '26px 32px 60px' }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 28, flexWrap: 'wrap' as const }}>
        <div>
          <div
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--m6)',
              background: 'color-mix(in srgb, var(--m6) 10%, transparent)',
              padding: '3px 10px',
              borderRadius: 20,
              marginBottom: 12,
            }}
          >
            Module 06 · Agreements
          </div>
          <h1
            style={{
              fontFamily: 'var(--display)',
              fontSize: 28,
              color: 'var(--ink)',
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            Make an agreement
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 520, lineHeight: 1.55 }}>
            Browse open projects and propose exactly what you'll contribute, exactly what you expect in return.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' as const }}>
          <button
            onClick={() => setShowMyAgreements(v => !v)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--rule)',
              background: showMyAgreements ? 'var(--bg-2)' : 'var(--surface)',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
          >
            My agreements ({myAgreements.length})
          </button>
          <button
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--m6)',
              color: '#fff',
              cursor: 'pointer',
            }}
            onClick={() => {
              setFilter('open')
              setSelectedId(openProjects[0]?.id ?? null)
              setSubmitted(false)
            }}
          >
            + Propose new project
          </button>
        </div>
      </div>

      {/* My agreements panel */}
      {showMyAgreements && myAgreements.length > 0 && (
        <div
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--ink-4)',
              marginBottom: 12,
            }}
          >
            My proposals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {myAgreements.map(a => {
              const proj = projects.find(p => p.id === a.project_id)
              return (
                <div
                  key={a.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--rule)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                      {proj?.title ?? 'Project'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {a.work_description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color:
                        a.status === 'accepted' || a.status === 'active'
                          ? '#15803d'
                          : a.status === 'rejected'
                          ? '#ef4444'
                          : a.status === 'completed'
                          ? '#94a3b8'
                          : '#f59e0b',
                      background:
                        a.status === 'accepted' || a.status === 'active'
                          ? '#15803d14'
                          : a.status === 'rejected'
                          ? '#ef444414'
                          : a.status === 'completed'
                          ? '#94a3b814'
                          : '#f59e0b14',
                      padding: '3px 9px',
                      borderRadius: 20,
                      flexShrink: 0,
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div
        className="agreements-split"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.05fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {/* LEFT — project list */}
        <div>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <FilterChip
              label={`Open · ${openProjects.length}`}
              active={filter === 'open'}
              onClick={() => setFilter('open')}
            />
            <FilterChip
              label="Mine"
              active={filter === 'mine'}
              onClick={() => setFilter('mine')}
            />
            <FilterChip
              label="All projects"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <div style={{ flex: 1 }} />
            <FilterChip
              label="↕ Soonest deadline"
              dashed
            />
          </div>

          {/* Project cards */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {filteredProjects.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--rule)',
                  borderRadius: 10,
                  padding: '32px 20px',
                  textAlign: 'center' as const,
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--ink-4)', margin: 0 }}>
                  {filter === 'mine'
                    ? "You haven't proposed on any projects yet."
                    : 'No projects open for collaboration right now.'}
                </p>
              </div>
            ) : (
              filteredProjects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selected={selectedId === p.id}
                  onClick={() => {
                    setSelectedId(p.id)
                    setSubmitted(false)
                    setSubmitError(null)
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — agreement form */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            position: 'sticky' as const,
            top: 20,
          }}
        >
          {selectedProject ? (
            <>
              {/* Form header */}
              <div
                style={{
                  background: 'color-mix(in srgb, var(--m6) 8%, var(--surface))',
                  borderBottom: '1px solid var(--rule)',
                  padding: '16px 20px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--ink-4)',
                    marginBottom: 8,
                  }}
                >
                  Propose your support for
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: 18,
                    color: 'var(--ink)',
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {selectedProject.title}
                </h3>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  Project lead · {selectedProject.lead_name ?? 'Unknown'} · Deadline {formatDeadline(selectedProject.deadline)}
                </div>
              </div>

              {/* Form body */}
              <div style={{ padding: 20, position: 'relative' as const }}>

                {/* Explorer lock overlay */}
                {(isExplorer || isGuest) && (
                  <div
                    style={{
                      position: 'absolute' as const,
                      inset: 0,
                      background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      borderRadius: '0 0 10px 10px',
                      gap: 10,
                      padding: '24px',
                      textAlign: 'center' as const,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>🔒</span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', margin: 0 }}>
                      {isGuest ? 'Sign in to propose' : 'Complete M05 Join to unlock'}
                    </p>
                    <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0, maxWidth: 260 }}>
                      {isGuest
                        ? 'Create a free account to submit collaboration proposals.'
                        : 'Once your join application is accepted you can submit proposals.'}
                    </p>
                    {isGuest ? (
                      <a
                        href="/auth/signup"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#fff',
                          background: 'var(--m6)',
                          padding: '8px 20px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          marginTop: 4,
                        }}
                      >
                        Join free →
                      </a>
                    ) : (
                      <a
                        href="/join"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#fff',
                          background: 'var(--m6)',
                          padding: '8px 20px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          marginTop: 4,
                        }}
                      >
                        Go to M05 Join →
                      </a>
                    )}
                  </div>
                )}

                {/* Success state */}
                {submitted ? (
                  <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                      Proposal sent!
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                      The project lead will review your proposal within 48 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setSelectedId(
                          filteredProjects.find(p => p.id !== selectedId)?.id ?? filteredProjects[0]?.id ?? null
                        )
                      }}
                      style={{
                        marginTop: 16,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--m6)',
                        background: 'transparent',
                        border: '1px solid var(--m6)',
                        padding: '7px 18px',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      View another project
                    </button>
                  </div>
                ) : (
                  <>
                    <FormField
                      label="What I'll contribute"
                      hint="Be specific — time, skill, materials, money"
                    >
                      <FocusTextarea
                        value={workDescription}
                        onChange={setWorkDescription}
                        placeholder="e.g. I'll design the landing page wireframes over 2 weeks…"
                      />
                    </FormField>

                    <FormField label="What I expect in return">
                      <FocusTextarea
                        value={expectedReward}
                        onChange={setExpectedReward}
                        placeholder="e.g. 200 contribution points and public credit…"
                      />
                    </FormField>

                    <FormField label="Conditions / fine print">
                      <FocusInput
                        value={conditions}
                        onChange={setConditions}
                        placeholder="Anything that would change your mind…"
                      />
                    </FormField>

                    {/* Info box */}
                    <div
                      style={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--rule-soft, var(--rule))',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 20,
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        lineHeight: 1.55,
                      }}
                    >
                      <span style={{ marginRight: 6 }}>ℹ</span>
                      The project lead reviews proposals within 48 hours. If accepted, your agreement is logged and feeds Operations (deliverables) and Contributions (points) automatically.
                    </div>

                    {submitError && (
                      <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>
                        {submitError}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button
                        onClick={handleSaveDraft}
                        disabled={submitting}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '9px 18px',
                          borderRadius: 8,
                          border: '1px solid var(--rule)',
                          background: 'var(--surface)',
                          color: 'var(--ink-2)',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          opacity: submitting ? 0.6 : 1,
                          transition: 'opacity 120ms',
                        }}
                      >
                        Save as draft
                      </button>
                      <button
                        onClick={handleSendProposal}
                        disabled={submitting || !workDescription.trim() || !expectedReward.trim()}
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          padding: '9px 20px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--m6)',
                          color: '#fff',
                          cursor:
                            submitting || !workDescription.trim() || !expectedReward.trim()
                              ? 'not-allowed'
                              : 'pointer',
                          opacity:
                            submitting || !workDescription.trim() || !expectedReward.trim()
                              ? 0.5
                              : 1,
                          transition: 'opacity 120ms',
                        }}
                      >
                        {submitting ? 'Sending…' : 'Send proposal →'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center' as const }}>
              <p style={{ fontSize: 13, color: 'var(--ink-4)' }}>
                Select a project to propose your support.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

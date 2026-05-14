'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  pending:   { label: 'Under review',    color: '#f59e0b', desc: 'Your application has been received and is waiting for the team to review it.' },
  reviewing: { label: 'Reviewing',       color: '#3b82f6', desc: 'The community team is actively reviewing your application.' },
  accepted:  { label: 'Accepted!',       color: '#22c55e', desc: 'Welcome to the community! Check your email for next steps.' },
  rejected:  { label: 'Not a fit (yet)', color: '#ef4444', desc: 'This application was not accepted at this time.' },
}

const DEFAULT_QUESTIONS = [
  'What draws you to this project?',
  'What skills, resources, or capacities do you bring to a regenerative community?',
  'What is your availability to contribute? (hours per week, seasonally, etc.)',
  'What are your expectations of community life?',
  'Describe a time you navigated conflict in a group setting.',
]

interface Props {
  questions: string[]
  userId: string | null
  existingApplication: { status: string; answers: Record<string, string>; created_at: string } | null
  hasQuestionsConfigured: boolean
}

export default function JoinClient({ questions, userId, existingApplication, hasQuestionsConfigured }: Props) {
  const supabase = createClient()
  const displayQuestions = questions.length > 0 ? questions : DEFAULT_QUESTIONS

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (existingApplication?.answers) {
      return Object.fromEntries(
        displayQuestions.map((_, i) => [i, existingApplication.answers[`q${i}`] ?? ''])
      )
    }
    return {}
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setError('')
    setSubmitting(true)

    const answersMap: Record<string, string> = {}
    displayQuestions.forEach((_, i) => { answersMap[`q${i}`] = answers[i] ?? '' })

    const { error: err } = await supabase.from('applications').upsert({
      user_id: userId,
      answers: answersMap,
      status: 'pending',
    }, { onConflict: 'user_id' })

    if (err) {
      setError(err.message)
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  // Show existing application status
  if (existingApplication && !submitted) {
    const s = STATUS_LABELS[existingApplication.status] ?? STATUS_LABELS.pending
    const submittedDate = new Date(existingApplication.created_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 20, marginBottom: 16 }}>
            M05 · Join
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Your Application
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>Submitted {submittedDate}</p>
        </div>

        <div style={{ background: 'var(--surface)', border: `2px solid ${s.color}30`, borderRadius: 'var(--radius-lg)', padding: '28px 28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--ink)' }}>{s.label}</span>
          </div>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 16 }}>Your answers</div>
          {displayQuestions.map((q, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65, background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: '10px 14px', whiteSpace: 'pre-wrap' }}>
                {existingApplication.answers[`q${i}`] || <span style={{ color: 'var(--ink-4)' }}>No answer provided</span>}
              </div>
            </div>
          ))}
        </div>

        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  // Show success state
  if (submitted) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 12 }}>Application submitted</h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
          Thank you for applying. The community team will review your answers and reach out.
          You can check the status on your dashboard.
        </p>
        <Link href="/dashboard" style={{ display: 'inline-block', background: 'var(--accent-color)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
          Go to dashboard
        </Link>
      </div>
    )
  }

  // Not logged in
  if (!userId) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 20, marginBottom: 16 }}>
            M05 · Join
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Apply to join the community
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65 }}>
            Create an account first, then come back here to fill out your application.
            The team will review your answers and be in touch.
          </p>
        </div>

        {displayQuestions.length > 0 && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
              {hasQuestionsConfigured ? 'Application questions' : 'Sample application questions'}
            </div>
            {displayQuestions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, fontSize: 13 }}>{i + 1}.</span>
                <span style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5 }}>{q}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{ background: 'var(--accent-color)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
            Create account to apply
          </Link>
          <Link href="/auth/login" style={{ background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 14, fontWeight: 500, padding: '10px 24px', borderRadius: 'var(--radius)', textDecoration: 'none', border: '1px solid var(--rule)' }}>
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // Application form
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 20, marginBottom: 16 }}>
          M05 · Join
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Apply to join the community
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65 }}>
          Share a bit about yourself. The community team will review your answers and reach out.
          {!hasQuestionsConfigured && (
            <span style={{ color: 'var(--ink-4)', fontSize: 13, display: 'block', marginTop: 8 }}>
              (Using default questions — the admin can customize these in the Blueprint wizard, step 1.4.)
            </span>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {displayQuestions.map((question, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.4 }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>{i + 1}.</span>
              {question}
            </label>
            <textarea
              value={answers[i] ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
              placeholder="Your answer..."
              rows={4}
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--rule)', background: 'var(--surface)',
                color: 'var(--ink)', fontSize: 14, lineHeight: 1.6,
                resize: 'vertical', outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-color)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--rule)' }}
            />
          </div>
        ))}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 20, color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--accent-color)', color: '#fff',
              fontSize: 14, fontWeight: 600, padding: '11px 28px',
              borderRadius: 'var(--radius)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1, transition: 'opacity 150ms',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

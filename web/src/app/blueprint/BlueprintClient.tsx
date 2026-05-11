'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STEPS, PHASES, PHASE_META, getPhaseSteps, type Phase, type StepField } from './data'

interface Props {
  blueprintId: string
  initialAnswers: Record<string, unknown>
  initialFlags: Record<string, boolean>
}

export default function BlueprintClient({ blueprintId, initialAnswers, initialFlags }: Props) {
  const supabase = createClient()
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers)
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags)
  const [activePhase, setActivePhase] = useState<Phase>('SPARK')
  const [activeStepId, setActiveStepId] = useState(STEPS[0].id)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentStep = STEPS.find(s => s.id === activeStepId)!
  const phaseSteps = getPhaseSteps(activePhase)
  const phaseIdx = PHASES.indexOf(activePhase)

  const doSave = useCallback(async (a: Record<string, unknown>, f: Record<string, boolean>) => {
    setSaving(true)
    await supabase.from('blueprints').update({ answers: a, flags: f, updated_at: new Date().toISOString() }).eq('id', blueprintId)
    setSaving(false)
    setLastSaved(new Date())
  }, [blueprintId, supabase])

  const scheduleAutoSave = useCallback((a: Record<string, unknown>, f: Record<string, boolean>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSave(a, f), 1500)
  }, [doSave])

  function setAnswer(key: string, value: unknown) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    scheduleAutoSave(next, flags)
  }

  function toggleFlag(stepId: string) {
    const next = { ...flags, [stepId]: !flags[stepId] }
    setFlags(next)
    scheduleAutoSave(answers, next)
  }

  // Cleanup timer on unmount
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  // Progress calculation
  const completedSteps = STEPS.filter(s => {
    const requiredFields = s.fields.filter(f => f.required)
    return requiredFields.length === 0 || requiredFields.every(f => {
      const v = answers[f.key]
      return v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)
    })
  }).length
  const progress = Math.round((completedSteps / STEPS.length) * 100)

  function nextStep() {
    const idx = phaseSteps.findIndex(s => s.id === activeStepId)
    if (idx < phaseSteps.length - 1) {
      setActiveStepId(phaseSteps[idx + 1].id)
    } else if (phaseIdx < PHASES.length - 1) {
      const nextPhase = PHASES[phaseIdx + 1]
      setActivePhase(nextPhase)
      setActiveStepId(getPhaseSteps(nextPhase)[0].id)
    }
  }

  function prevStep() {
    const idx = phaseSteps.findIndex(s => s.id === activeStepId)
    if (idx > 0) {
      setActiveStepId(phaseSteps[idx - 1].id)
    } else if (phaseIdx > 0) {
      const prevPhase = PHASES[phaseIdx - 1]
      setActivePhase(prevPhase)
      const prevSteps = getPhaseSteps(prevPhase)
      setActiveStepId(prevSteps[prevSteps.length - 1].id)
    }
  }

  const isFirst = activePhase === 'SPARK' && activeStepId === phaseSteps[0]?.id
  const allStepIds = STEPS.map(s => s.id)
  const globalIdx = allStepIds.indexOf(activeStepId)
  const isLast = globalIdx === STEPS.length - 1

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>Blueprint Wizard</h1>
        <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
          {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Autosaves as you type'}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{completedSteps} / {STEPS.length} steps with required fields complete</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{progress}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: 'var(--rule)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Sidebar */}
        <div>
          {PHASES.map(phase => {
            const meta = PHASE_META[phase]
            const steps = getPhaseSteps(phase)
            const isActivePhase = phase === activePhase
            return (
              <div key={phase} style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => { setActivePhase(phase); setActiveStepId(steps[0].id) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
                    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: isActivePhase ? meta.color : 'var(--ink-4)',
                    marginBottom: 6,
                  }}
                >
                  {meta.label}
                </button>
                {steps.map(step => {
                  const isActive = step.id === activeStepId
                  const isDone = flags[step.id]
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => { setActivePhase(phase); setActiveStepId(step.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', textAlign: 'left',
                        padding: '6px 8px', borderRadius: 'var(--radius)', cursor: 'pointer',
                        background: isActive ? 'var(--surface)' : 'transparent',
                        border: isActive ? '1px solid var(--rule)' : '1px solid transparent',
                        marginBottom: 2,
                      } as React.CSSProperties}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, fontSize: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? 'var(--accent)' : 'var(--rule)',
                        color: isDone ? '#fff' : 'var(--ink-4)',
                        fontWeight: 700,
                      }}>{isDone ? '✓' : step.id}</span>
                      <span style={{ fontSize: 12.5, color: isActive ? 'var(--ink-1)' : 'var(--ink-3)', fontWeight: isActive ? 600 : 400 }}>
                        {step.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Main content */}
        <div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--rule)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: PHASE_META[currentStep.phase].color, marginBottom: 6 }}>
                  {PHASE_META[currentStep.phase].label} · Step {currentStep.id}
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 6px' }}>{currentStep.title}</h2>
                <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0 }}>{currentStep.description}</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, marginLeft: 20 }}>
                <input
                  type="checkbox"
                  checked={!!flags[currentStep.id]}
                  onChange={() => toggleFlag(currentStep.id)}
                  style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>Mark complete</span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {currentStep.fields.map(field => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={answers[field.key]}
                  onChange={v => setAnswer(field.key, v)}
                />
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
              <button type="button" onClick={prevStep} disabled={isFirst} style={{
                padding: '9px 18px', borderRadius: 'var(--radius)',
                border: '1px solid var(--rule)', background: 'var(--bg)',
                color: isFirst ? 'var(--ink-4)' : 'var(--ink-2)', fontSize: 13.5, fontWeight: 500,
                cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.5 : 1,
              }}>← Previous</button>
              {!isLast ? (
                <button type="button" onClick={nextStep} style={{
                  padding: '9px 22px', borderRadius: 'var(--radius)',
                  border: 'none', background: 'var(--accent)', color: '#fff',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                }}>Next →</button>
              ) : (
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent)', alignSelf: 'center' }}>
                  Blueprint complete!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRenderer({ field, value, onChange }: {
  field: StepField
  value: unknown
  onChange: (v: unknown) => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>*</span>}
      </label>

      {field.type === 'textarea' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      )}

      {field.type === 'text' && (
        <input
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          style={{ maxWidth: 160 }}
        />
      )}

      {field.type === 'select' && (
        <select value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}

      {field.type === 'multiselect' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {field.options?.map(opt => {
            const selected = Array.isArray(value) && (value as string[]).includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const arr = Array.isArray(value) ? (value as string[]) : []
                  onChange(selected ? arr.filter(x => x !== opt) : [...arr, opt])
                }}
                style={{
                  padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5,
                  border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--rule)'}`,
                  background: selected ? 'var(--accent-soft)' : 'transparent',
                  color: selected ? 'var(--accent)' : 'var(--ink-3)',
                  fontWeight: selected ? 600 : 400, transition: 'all 0.1s',
                }}
              >{opt}</button>
            )
          })}
        </div>
      )}

      {field.type === 'boolean' && (
        <button
          type="button"
          onClick={() => onChange(!value)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          <div style={{
            width: 40, height: 22, borderRadius: 11,
            background: value ? 'var(--accent)' : 'var(--rule)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 3, left: value ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>
            {value ? 'Yes' : 'No'}
          </span>
        </button>
      )}

      {field.hint && <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 5 }}>{field.hint}</div>}
    </div>
  )
}

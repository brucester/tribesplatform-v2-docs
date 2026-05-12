'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FW_DATA, PILLAR_STEPS, type StepDef, type PhaseDef, type GuideContent } from './wizard-data'
import './wizard.css'

// ── Types ────────────────────────────────────────────────────────────────────

type Values = Record<string, unknown>

interface Props {
  blueprintId: string
  initialAnswers: Values
  initialFlags: Record<string, boolean>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stepComplete(step: StepDef, values: Values) {
  if (step.kind === 'gate') return false
  const fields = step.fields ?? []
  const sliders = step.sliders ?? []
  const checks = step.checklist ?? []
  if (fields.length === 0 && sliders.length === 0 && checks.length === 0) return false
  let hasAny = false
  fields.forEach(f => { if (values[f.id] && String(values[f.id]).length > 5) hasAny = true })
  sliders.forEach(s => { if (values[s.id] != null) hasAny = true })
  checks.forEach(c => { if (values[c.id]) hasAny = true })
  return hasAny
}

function gateStatus(step: StepDef, values: Values) {
  const criteria = step.criteria ?? []
  const met = criteria.filter(c => {
    const v = values[c.metric]
    return (typeof v === 'boolean' && v) || (typeof v === 'number' && v >= 6)
  }).length
  const ratio = met / criteria.length
  if (ratio >= 0.8) return 'ready'
  if (ratio >= 0.5) return 'warning'
  return 'not-ready'
}

function computePillarScores(values: Values) {
  const map: Record<string, string[]> = {
    ecology: ['site_water', 'site_climate', 'eco_assessment', 'c_water', 'c_waste', 'c_energy', 'metrics'],
    social: ['team_trust', 'team_diversity', 'culture_strength', 'rituals', 'onboarding', 'culture_carriers'],
    economy: ['biz_resilience', 'biz_clarity', 'fund_realism', 'fund_alignment', 'cap_close', 'revenue_streams'],
    hardware: ['site_access', 'c_buildings', 'c_roads', 'c_connectivity', 'mp_integration', 'practice_ready'],
    governance: ['intention_clarity', 'vision_alignment', 'structure_explicit', 'self_clarity', 'ops_smooth', 'gov_health', 'evo_capacity'],
  }
  const result: Record<string, number> = {}
  Object.entries(map).forEach(([pillar, ids]) => {
    let sum = 0, count = 0
    ids.forEach(id => {
      const v = values[id]
      if (typeof v === 'number') { sum += v; count++ }
      else if (typeof v === 'boolean' && v) { sum += 8; count++ }
    })
    result[pillar] = count > 0 ? sum / count : 0
  })
  return result
}

function computeGatesPassed(values: Values) {
  let passed = 0
  FW_DATA.phases.forEach(p => {
    p.steps.forEach(s => {
      if (s.kind === 'gate' && s.criteria) {
        const met = s.criteria.filter(c => {
          const v = values[c.metric]
          if (typeof v === 'boolean') return v
          if (typeof v === 'number') return v >= 6
          return false
        }).length
        if (met / s.criteria.length >= 0.8) passed++
      }
    })
  })
  return passed
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ── Field catalog (for AI import) ────────────────────────────────────────────

interface FieldCatalogEntry {
  id: string; kind: 'text' | 'slider' | 'check'; phase: string; step: string; label: string; help: string
}
interface ImportScope { step?: StepDef; section?: string }

function buildFieldCatalog(scope?: ImportScope): FieldCatalogEntry[] {
  const catalog: FieldCatalogEntry[] = []
  const scopedStepId = scope?.step?.id ?? null
  const scopedSection = scope?.section ?? null
  FW_DATA.phases.forEach(phase => {
    phase.steps.forEach(step => {
      if (step.kind === 'gate') return
      if (scopedStepId && step.id !== scopedStepId) return
      if (!scopedSection || scopedSection === 'fields') {
        (step.fields ?? []).forEach(f => catalog.push({ id: f.id, kind: 'text', phase: phase.name, step: step.title ?? '', label: f.label, help: f.help ?? '' }))
      }
      if (!scopedSection || scopedSection === 'sliders') {
        (step.sliders ?? []).forEach(s => catalog.push({ id: s.id, kind: 'slider', phase: phase.name, step: step.title ?? '', label: s.label, help: 'Score 0-10' }))
      }
      if (!scopedSection || scopedSection === 'checklist') {
        (step.checklist ?? []).forEach(c => {
          catalog.push({ id: c.id, kind: 'check', phase: phase.name, step: step.title ?? '', label: c.text, help: 'Yes/No' })
          catalog.push({ id: c.id + '_note', kind: 'text', phase: phase.name, step: step.title ?? '', label: 'Notes for: ' + c.text, help: 'Short note describing how this is handled.' })
        })
      }
    })
  })
  return catalog
}

// ── FileDropzone ──────────────────────────────────────────────────────────────

function FileDropzone({ onFile, fileName }: { onFile: (f: File) => void; fileName: string }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      className="dropzone"
      style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--rule)'}`, borderRadius: 4, padding: '28px 20px', textAlign: 'center', background: dragOver ? 'var(--accent-soft)' : 'var(--bg-2)', cursor: 'pointer', transition: 'all 120ms' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
    >
      <input ref={inputRef} type="file" accept=".txt,.md,.markdown,.json,text/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>
        {fileName ? <span>Loaded: <strong>{fileName}</strong></span> : 'Drop a document, or click to browse'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>.TXT · .MD · .JSON · plain text</div>
    </div>
  )
}

// ── ImportModal ───────────────────────────────────────────────────────────────

function ImportModal({ onClose, onApply, currentValues, scope }: {
  onClose: () => void; onApply: (vals: Values) => void; currentValues: Values; scope?: ImportScope
}) {
  const [stage, setStage] = useState<'upload' | 'scanning' | 'review' | 'error'>('upload')
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0 })
  const [docText, setDocText] = useState('')
  const [fileName, setFileName] = useState('')
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [acceptedKeys, setAcceptedKeys] = useState<Record<string, boolean>>({})

  const handleFile = async (file: File) => {
    setFileName(file.name)
    if (file.type === 'application/pdf') {
      setDocText(`[PDF: ${file.name}] — PDF parsing not available in browser. Please paste text content instead.`)
      return
    }
    const text = await new Promise<string>((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsText(file)
    })
    setDocText(text)
  }

  const handleScan = async () => {
    if (!docText.trim()) { setErrorMsg('Paste some text or upload a file first.'); return }
    setStage('scanning'); setErrorMsg('')

    const catalog = buildFieldCatalog(scope)
    const fieldsByStep: Record<string, FieldCatalogEntry[]> = {}
    catalog.forEach(f => { const k = `${f.phase} — ${f.step}`; if (!fieldsByStep[k]) fieldsByStep[k] = []; fieldsByStep[k].push(f) })
    const fieldList = Object.entries(fieldsByStep).map(([s, fields]) =>
      `### ${s}\n` + fields.map(f => `- ${f.id} (${f.kind}): "${f.label}"`).join('\n')
    ).join('\n\n')
    const scopeHint = scope?.step ? `\n\nIMPORTANT: Focus only on the "${scope.step.title}" step${scope.section ? ' (' + scope.section + ' section)' : ''}. Only return fields listed below.` : ''

    const existingAnswers = catalog
      .filter(f => { const v = currentValues[f.id]; return v != null && v !== '' && String(v).length > 0 })
      .map(f => {
        const v = currentValues[f.id]
        const display = f.kind === 'slider' ? `${v}/10` : f.kind === 'check' ? (v ? 'Yes' : 'No') : String(v)
        return `- ${f.id} (${f.kind}): "${f.label}" → EXISTING: ${display}`
      }).join('\n')
    const existingBlock = existingAnswers ? `\nEXISTING ANSWERS (already filled by the user):\n${existingAnswers}\n` : ''

    const CHUNK_SIZE = 15000
    const CONCURRENCY = 4
    const chunks: string[] = []
    for (let i = 0; i < docText.length; i += CHUNK_SIZE) chunks.push(docText.slice(i, i + CHUNK_SIZE))
    setChunkProgress({ current: 0, total: chunks.length })

    const buildPrompt = (chunkText: string, chunkNum: number, totalChunks: number) => {
      const chunkNote = totalChunks > 1 ? `\n\nNote: This is chunk ${chunkNum} of ${totalChunks} of the full document. Extract what you can from this portion.` : ''
      return `You are helping pre-fill a Regenerative Neighborhood Framework wizard from an existing project document.

Below is the user's document, followed by the catalog of wizard fields. Extract any information from the document that maps to these fields. Return a JSON object with field IDs as keys.

Rules:
- For text fields: return a string with extracted/synthesized content (1-3 sentences). If nothing relevant, omit the key.
- For slider fields: return an integer 0-10 reflecting confidence/maturity in that area based on document evidence. If unclear, omit.
- For check fields (id without "_note" suffix): return true only if the document clearly indicates this is in place. Otherwise omit.
- For checklist note fields (id ending in "_note"): if the doc has relevant info, write a 1-2 sentence note. Be concrete.
- Only include fields where you have actual evidence from the document. Omit anything you'd be guessing.
- Also include a "_summary" key with a 2-sentence summary of what the document is about.
- Also include "_extracted_count" with the number of fields you populated.${scopeHint}${chunkNote}

DOCUMENT:
"""
${chunkText}
"""

WIZARD FIELDS:
${fieldList}

Return ONLY valid JSON, no markdown fences, no commentary.`
    }

    const scanChunk = async (chunkText: string, chunkNum: number, totalChunks: number): Promise<Record<string, unknown>> => {
      const prompt = buildPrompt(chunkText, chunkNum, totalChunks)
      const aiUrl = process.env.NEXT_PUBLIC_AI_WORKER_URL || '/api/claude'
      const resp = await fetch(aiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? `Request failed (${resp.status})`)
      }
      const { result } = await resp.json() as { result: string }
      let cleaned = result.trim()
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(json)?\s*/, '').replace(/```\s*$/, '')
      const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}')
      if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1)
      return JSON.parse(cleaned) as Record<string, unknown>
    }

    const mergeResults = (results: Record<string, unknown>[]): Record<string, unknown> => {
      const merged: Record<string, unknown> = {}
      results.forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
          if (k.startsWith('_')) { if (!merged[k]) merged[k] = v; return }
          const existing = merged[k]
          if (existing == null) { merged[k] = v; return }
          if (typeof v === 'string' && typeof existing === 'string') {
            if (v.length > (existing as string).length) merged[k] = v
          } else if (typeof v === 'number' && typeof existing === 'number') {
            merged[k] = Math.round(((existing as number) + v) / 2)
          } else if (typeof v === 'boolean') {
            merged[k] = (existing as boolean) || v
          }
        })
      })
      return merged
    }

    try {
      const allResults: Record<string, unknown>[] = new Array(chunks.length)
      let completed = 0
      for (let batchStart = 0; batchStart < chunks.length; batchStart += CONCURRENCY) {
        const batch = chunks.slice(batchStart, batchStart + CONCURRENCY)
        await Promise.all(batch.map(async (chunk, batchIdx) => {
          const i = batchStart + batchIdx
          const result = await scanChunk(chunk, i + 1, chunks.length)
          allResults[i] = result
          completed++
          setChunkProgress({ current: completed, total: chunks.length })
        }))
      }
      const merged = mergeResults(allResults)
      setExtracted(merged)
      const accepted: Record<string, boolean> = {}
      Object.keys(merged).forEach(k => { if (!k.startsWith('_')) accepted[k] = true })
      setAcceptedKeys(accepted)
      setStage('review')
    } catch (e) {
      setErrorMsg((e as Error).message ?? 'Scan failed.')
      setStage('error')
    }
  }

  const handleApply = () => {
    if (!extracted) return
    const toApply: Values = {}
    Object.entries(extracted).forEach(([k, v]) => { if (!k.startsWith('_') && acceptedKeys[k]) toApply[k] = v })
    onApply(toApply); onClose()
  }

  const catalog = buildFieldCatalog(scope)
  const fieldMeta = (id: string) => catalog.find(f => f.id === id) ?? { label: id, kind: 'text' as const, step: '', phase: '', help: '' }

  return (
    <div className="modal-bg" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal" style={{ position: 'relative', maxWidth: 760, width: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 32, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>

        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 6 }}>AI-ASSISTED IMPORT{scope?.step ? ' · SCOPED' : ''}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, marginTop: 6 }}>
            {scope?.step ? `Fill "${scope.step.title}" ${scope.section ?? 'step'}` : 'Scan an existing document'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 8, fontStyle: 'italic' }}>
            {scope?.step ? "Upload a document and we'll pre-fill just this section." : "Have a vision deck, charter, or feasibility study? Drop it in and we'll pre-fill what we can."}
          </div>
        </div>

        {stage === 'upload' && (
          <div>
            <FileDropzone onFile={handleFile} fileName={fileName} />
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink-2)' }}>Or paste document text</div>
              <textarea className="textarea" rows={8} placeholder="Paste your project charter, vision document, business plan, meeting notes…" value={docText} onChange={e => setDocText(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
              {docText && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.08em' }}>
                  {docText.length.toLocaleString()} CHARS
                  {docText.length > 5000 ? ` · will scan in ${Math.ceil(docText.length / 5000)} chunks` : ' · full document will be scanned'}
                </div>
              )}
            </div>
            <div className="card" style={{ marginTop: 18, fontSize: 12.5, lineHeight: 1.5, background: 'var(--bg-2)', padding: 16, borderRadius: 'var(--radius)' }}>
              <strong style={{ fontFamily: 'var(--display)', fontSize: 14 }}>How it works.</strong> MiniMax M2.7 reads your document and proposes answers for fields it finds evidence for. You review and accept what&rsquo;s good — nothing is applied without your sign-off. Best for plain-text (.txt, .md). PDFs need text pasted manually.
            </div>
            <div className="nav-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleScan} disabled={!docText.trim()}>Scan with AI →</button>
            </div>
          </div>
        )}

        {stage === 'scanning' && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginTop: 20 }}>Reading your document…</div>
            {chunkProgress.total > 1 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  Chunk {chunkProgress.current} of {chunkProgress.total}
                </div>
                <div style={{ width: 200, height: 4, background: 'var(--rule)', borderRadius: 2, margin: '10px auto 0' }}>
                  <div style={{ height: '100%', width: `${(chunkProgress.current / chunkProgress.total) * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 300ms' }} />
                </div>
              </div>
            )}
            {chunkProgress.total <= 1 && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, fontStyle: 'italic' }}>Mapping content to RNF · Alchemy · RCOS · CLIPS fields</div>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
              {(['rnf', 'alchemy', 'rcos', 'clips'] as const).map((k, i) => (
                <div key={k} style={{ width: 10, height: 10, borderRadius: '50%', background: `var(--${k})`, animation: `pulse 1s ${i * 150}ms infinite` }} />
              ))}
            </div>
          </div>
        )}

        {stage === 'review' && extracted && (
          <div>
            <div className="card" style={{ background: 'var(--bg-2)', marginBottom: 20, padding: 16, borderRadius: 'var(--radius)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 6 }}>DOCUMENT SUMMARY</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink-2)' }}>{(extracted._summary as string) || 'No summary available.'}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 12, letterSpacing: '0.1em' }}>
                {Object.keys(extracted).filter(k => !k.startsWith('_')).length} FIELDS POPULATED · REVIEW BELOW
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>Proposed answers</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{Object.values(acceptedKeys).filter(Boolean).length} accepted</div>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 20, paddingRight: 4 }}>
              {Object.entries(extracted).filter(([k]) => !k.startsWith('_') && k !== 'project_name').map(([key, val]) => {
                const meta = fieldMeta(key)
                const accepted = acceptedKeys[key]
                const conflict = currentValues[key] != null && currentValues[key] !== ''
                return (
                  <div key={key} style={{ padding: 12, marginBottom: 8, background: accepted ? 'var(--accent-soft)' : 'var(--bg-2)', border: `1px solid ${accepted ? 'var(--accent)' : 'var(--rule-soft)'}`, borderRadius: 4, cursor: 'pointer', opacity: accepted ? 1 : 0.6 }}
                    onClick={() => setAcceptedKeys(a => ({ ...a, [key]: !a[key] }))}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 16, height: 16, marginTop: 2, background: accepted ? 'var(--accent)' : 'var(--surface)', border: `1.5px solid ${accepted ? 'var(--accent)' : 'var(--rule)'}`, borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {accepted && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 3 }}>
                          {meta.step.toUpperCase()}{conflict && <span style={{ color: 'var(--warn)', marginLeft: 8 }}>· OVERWRITES EXISTING</span>}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{meta.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                          {meta.kind === 'slider' ? <span><strong>{val as number}/10</strong></span>
                            : meta.kind === 'check' ? <span>{val ? '☑ Yes' : '☐ No'}</span>
                            : <span>{String(val)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="nav-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStage('upload')}>← Back</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => { const all: Record<string, boolean> = {}; Object.keys(extracted).forEach(k => { if (!k.startsWith('_')) all[k] = !Object.values(acceptedKeys).every(Boolean) }); setAcceptedKeys(all) }}>Toggle all</button>
                <button className="btn btn-primary" onClick={handleApply}>Apply {Object.values(acceptedKeys).filter(Boolean).length} answers →</button>
              </div>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <div className="card" style={{ padding: 24, background: 'var(--warn-soft)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 8 }}>
                {errorMsg.includes('504') || errorMsg.includes('rate limit') ? "We're working on our scanning process" : 'Something went wrong'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                {errorMsg.includes('504') || errorMsg.includes('rate limit')
                  ? "We're working on our scanning process, thanks for the patience. Try again later please."
                  : errorMsg}
              </div>
            </div>
            <div className="nav-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={() => setStage('upload')}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GuideButton({ guide }: { guide?: GuideContent }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!guide) return null
  return (
    <span className="guide-wrap" ref={ref}>
      <button type="button" className={`guide-btn${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="How to answer this">
        <span className="guide-icon">?</span>
        <span className="guide-label">Guide</span>
      </button>
      {open && (
        <div className="guide-pop" role="dialog">
          <div className="guide-pop-head">
            <div className="guide-pop-title">{guide.title}</div>
            {guide.source && <div className="guide-pop-source">{guide.source}</div>}
          </div>
          <div className="guide-pop-body">
            {(guide.body ?? []).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <button className="guide-pop-close" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </span>
  )
}

function FieldStatus({ id, value, onChange, guide }: {
  id: string; value: unknown; onChange: (id: string, val: string) => void; guide?: GuideContent
}) {
  const [helpOpen, setHelpOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!helpOpen) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setHelpOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setHelpOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [helpOpen])

  const v = (value as string) || ''
  const helpContent = guide ?? {
    title: 'Need help with this question?',
    source: '',
    body: ['Take a moment. There\'s no perfect answer — write what feels true right now and revise later.', 'Try writing one short sentence first. Then expand. Or skip it and come back after a related step.'],
  }

  return (
    <div className="field-status" ref={ref}>
      <button type="button" className={`fs-btn fs-pending${v === 'pending' ? ' on' : ''}`}
        onClick={() => onChange(id, v === 'pending' ? '' : 'pending')} title="No answer yet">
        <span className="fs-dot"></span>No answer yet
      </button>
      <button type="button"
        className={`fs-btn fs-help${v === 'help' ? ' on' : ''}${helpOpen ? ' open' : ''}`}
        onClick={() => { onChange(id, v === 'help' ? '' : 'help'); setHelpOpen(o => !o) }} title="Almost there">
        <span className="fs-dot"></span>Almost there
      </button>
      <button type="button" className={`fs-btn fs-ready${v === 'ready' ? ' on' : ''}`}
        onClick={() => onChange(id, v === 'ready' ? '' : 'ready')} title="Ready to go">
        <span className="fs-dot"></span>Ready to go
      </button>
      {helpOpen && (
        <div className="fs-help-pop" role="dialog">
          <div className="fs-help-title">{helpContent.title}</div>
          <div className="fs-help-body">{(helpContent.body ?? []).map((p, i) => <p key={i}>{p}</p>)}</div>
          <button className="fs-help-close" onClick={() => setHelpOpen(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

function TextField({ field, value, onChange, statusValue }: {
  field: NonNullable<StepDef['fields']>[0]; value: unknown; onChange: (id: string, val: unknown) => void; statusValue: unknown
}) {
  const statusId = field.id + '_status'
  return (
    <div className="field">
      <div className="field-label-row">
        <label className="field-label">{field.label}</label>
        {field.guide && <GuideButton guide={field.guide} />}
      </div>
      {field.help && <div className="field-help">{field.help}</div>}
      {field.kind === 'textarea' ? (
        <textarea className="textarea" rows={field.rows ?? 4}
          value={(value as string) || ''}
          onChange={e => onChange(field.id, e.target.value)} />
      ) : (
        <input type="text" className="input"
          value={(value as string) || ''}
          onChange={e => onChange(field.id, e.target.value)} />
      )}
      <FieldStatus id={statusId} value={statusValue}
        onChange={(id, val) => onChange(id, val)} guide={field.guide} />
    </div>
  )
}

function ScoreSlider({ id, label, frame, value, onChange, guide }: {
  id: string; label: string; frame: string; value: unknown; onChange: (id: string, val: number) => void; guide?: GuideContent
}) {
  const v = (value as number) ?? 5
  return (
    <div className="slider-row">
      <div className="slider-meta">
        <div className="slider-q">
          <span>{label}</span>
          {guide && <GuideButton guide={guide} />}
        </div>
        <div className="slider-track-wrap">
          <input type="range" className="slider" min="0" max="10" step="1" value={v}
            onChange={e => onChange(id, parseInt(e.target.value, 10))} />
          <div className="slider-scale">
            <span>Not yet</span>
            <span>{frame}</span>
            <span>Solid</span>
          </div>
        </div>
      </div>
      <div className="slider-value">{v}</div>
    </div>
  )
}

function Checklist({ items, values, onChange, onField }: {
  items: NonNullable<StepDef['checklist']>; values: Values;
  onChange: (id: string, val: unknown) => void; onField: (id: string, val: unknown) => void
}) {
  return (
    <ul className="checklist">
      {items.map(it => {
        const checked = !!values[it.id]
        const noteId = it.id + '_note'
        const noteVal = (values[noteId] as string) || ''
        return (
          <li key={it.id} className={`check-item${checked ? ' checked' : ''}`}>
            <div className="check-item-head">
              <div className="check-row" onClick={() => onChange(it.id, !checked)}>
                <div className="check-box"></div>
                <div className="check-text">{it.text}</div>
              </div>
              {it.guide && <GuideButton guide={it.guide} />}
            </div>
            <textarea className="check-note" rows={2} value={noteVal}
              placeholder="Notes, evidence, or how this is handled…"
              onChange={e => onField(noteId, e.target.value)}
              onClick={e => e.stopPropagation()} />
          </li>
        )
      })}
    </ul>
  )
}

function FrameworkTags({ items }: { items: string[] }) {
  return (
    <div className="framework-tags">
      {items.map((line, i) => {
        const fw = line.split(':')[0].trim().toLowerCase()
        return <span key={i} className={`fw-tag ${fw}`}>{line}</span>
      })}
    </div>
  )
}

function Crumb({ items }: { items: string[] }) {
  return (
    <div className="crumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="crumb-sep">/</span>}
          <span>{it}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

function PillarBars({ scores, onJump }: { scores: Record<string, number>; onJump: (id: string) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  return (
    <div>
      {FW_DATA.pillars.map(p => {
        const v = scores[p.id] ?? 0
        const isPerfect = v >= 9.5
        const isHovered = hoveredId === p.id
        const steps = PILLAR_STEPS[p.id] ?? []
        return (
          <div key={p.id} className="pillar-bar">
            <div className="pillar-bar-head">
              <span className="pillar-bar-name">{p.name}</span>
              <span className="pillar-bar-val"
                style={{ cursor: !isPerfect ? 'pointer' : 'default', color: !isPerfect ? p.color : undefined }}
                onMouseEnter={() => !isPerfect && setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}>
                {v.toFixed(1)}/10
              </span>
            </div>
            <div className="pillar-bar-track"
              onMouseEnter={() => !isPerfect && setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}>
              <div className="pillar-bar-fill" style={{ width: `${v * 10}%`, background: p.color }}></div>
            </div>
            {isHovered && steps.length > 0 && (
              <div className="pillar-tip"
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}>
                <div className="pillar-tip-head">Improve {p.name}</div>
                {steps.map(s => (
                  <button key={s.id} className="pillar-tip-step" onClick={() => { onJump(s.id); setHoveredId(null) }}>
                    <span className="pillar-tip-title">{s.title}</span>
                    <span className="pillar-tip-note">{s.note}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SpiralMini({ currentSpiral, completedSpirals }: { currentSpiral: number; completedSpirals: number[] }) {
  return (
    <div className="spiral-track">
      {[1, 2, 3, 4, 5].map(n => {
        const cls = n === currentSpiral ? 'active' : completedSpirals.includes(n) ? 'passed' : ''
        return <div key={n} className={`spiral-cell ${cls}`}>S{n}</div>
      })}
    </div>
  )
}

function PillarRadar({ scores, size = 280 }: { scores: Record<string, number>; size?: number }) {
  const pillars = FW_DATA.pillars
  const cx = size / 2, cy = size / 2
  const rMax = size / 2 - 44
  const n = pillars.length
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const point = (i: number, val: number): [number, number] => {
    const r = (val / 10) * rMax
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r]
  }
  const ringPoints = (val: number) => pillars.map((_, i) => point(i, val).join(',')).join(' ')
  const dataPoints = pillars.map((p, i) => point(i, scores[p.id] ?? 0).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%">
      {[2.5, 5, 7.5, 10].map(v => (
        <polygon key={v} points={ringPoints(v)} fill="none" stroke="var(--rule)" strokeWidth="1"
          strokeDasharray={v === 10 ? '' : '2 3'} />
      ))}
      {pillars.map((p, i) => {
        const [x, y] = point(i, 10)
        return <line key={p.id} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--rule)" strokeWidth="1" />
      })}
      <polygon points={dataPoints} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
      {pillars.map((p, i) => {
        const [x, y] = point(i, scores[p.id] ?? 0)
        return <circle key={p.id} cx={x} cy={y} r="3" fill={p.color} />
      })}
      {pillars.map((p, i) => {
        const a = angle(i)
        const lx = cx + Math.cos(a) * (rMax + 22)
        const ly = cy + Math.sin(a) * (rMax + 18)
        const cosA = Math.cos(a)
        const anchor = Math.abs(cosA) < 0.2 ? 'middle' : (cosA > 0 ? 'end' : 'start')
        return (
          <text key={p.id} x={lx} y={ly} fontSize="10" fontFamily="var(--mono)"
            fill="var(--ink-3)" textAnchor={anchor} dominantBaseline="middle" fontWeight="500">
            {p.name.toUpperCase()}
          </text>
        )
      })}
    </svg>
  )
}

function SpiralTimelineLarge({ currentSpiral, completedSpirals, phases }: {
  currentSpiral: number; completedSpirals: number[]; phases: PhaseDef[]
}) {
  const names = ['Proof of Concept', 'Feasibility Validation', 'Capital Formation', 'Construction & Activation', 'Continuous Regeneration']
  return (
    <div style={{ paddingTop: 14 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const phase = phases.find(p => p.spiral === n)
        const isCurrent = n === currentSpiral
        const isPassed = completedSpirals.includes(n)
        return (
          <div key={n} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: isCurrent ? 'var(--rnf)' : (isPassed ? 'var(--bg-3)' : 'var(--surface)'),
              border: '1px solid ' + (isCurrent ? 'var(--rnf)' : 'var(--rule)'),
              color: isCurrent ? 'var(--bg)' : 'var(--ink-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
            }}>S{n}</div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, lineHeight: 1.2 }}>
                {phase?.spiralName ?? names[n - 1]}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                {isCurrent ? 'IN PROGRESS' : isPassed ? 'PASSED' : 'UPCOMING'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Step / Gate views ─────────────────────────────────────────────────────────

function GateView({ step, phase, values, onPrev, onNext }: {
  step: StepDef; phase: PhaseDef; values: Values; onPrev: () => void; onNext: () => void
}) {
  const criteria = step.criteria ?? []
  const evalCriterion = (metric: string) => {
    const v = values[metric]
    if (typeof v === 'boolean') return v ? 'met' : 'unmet'
    if (typeof v === 'number') return v >= 6 ? 'met' : (v >= 4 ? 'partial' : 'unmet')
    return 'unmet'
  }
  const states = criteria.map(c => evalCriterion(c.metric))
  const metCount = states.filter(s => s === 'met').length
  const ratio = metCount / criteria.length

  let status: string, label: string
  if (ratio >= 0.8) { status = 'ready'; label = 'Ready to proceed' }
  else if (ratio >= 0.5) { status = 'warning'; label = 'Soft gate — proceed with care' }
  else { status = 'not-ready'; label = 'Foundation still forming' }

  return (
    <div>
      <Crumb items={[`Phase ${phase.num} — ${phase.name}`, `Gate ${step.gateNum === 34 ? '3 & 4' : step.gateNum}`]} />
      <div className="gate-hero">
        <div className="gate-num">RNF · Gate Checkpoint</div>
        <h1 className="gate-title">{step.title}</h1>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 8 }}>
          {step.subtitle}
        </div>
        <div className={`gate-status ${status}`}>● {label}</div>
        <div style={{ marginTop: 18, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>
          {metCount} of {criteria.length} criteria met
        </div>
      </div>

      <div className="card-quote">
        Gates prevent the most common failure mode: rushing into the next phase before the foundation is solid. Soft-pass means you may continue, but name what is unfinished.
        <span className="card-quote-attr">— RNF Gate System</span>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Criteria</div>
          <div className="section-meta">{metCount}/{criteria.length}</div>
        </div>
        <ul className="criteria-list">
          {criteria.map((c, i) => {
            const s = states[i]
            return (
              <li key={c.id} className="criterion">
                <div className={`criterion-icon ${s === 'met' ? 'met' : 'unmet'}`}>
                  {s === 'met' ? '✓' : (s === 'partial' ? '~' : '·')}
                </div>
                <div className="criterion-text">{c.text}</div>
                <div className="criterion-meta">{s.toUpperCase()}</div>
              </li>
            )
          })}
        </ul>
      </div>

      {status !== 'ready' && (
        <div className="card card-warm">
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, marginBottom: 8 }}>⚠ Soft gate</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            You can continue, but the unfinished items will compound. Consider returning to earlier steps to strengthen them before moving on.
          </div>
        </div>
      )}

      <div className="nav-row">
        <button className="btn btn-ghost" onClick={onPrev}>← Previous</button>
        <button className={`btn ${status === 'ready' ? 'btn-primary' : 'btn-warm'}`} onClick={onNext}>
          {status === 'ready' ? 'Pass gate & continue →' : 'Continue anyway →'}
        </button>
      </div>
    </div>
  )
}

function StepView({ step, phase, values, onField, onSlider, onCheck, onNext, onPrev, onImport }: {
  step: StepDef; phase: PhaseDef; values: Values;
  onField: (id: string, val: unknown) => void;
  onSlider: (id: string, val: number) => void;
  onCheck: (id: string, val: unknown) => void;
  onNext: () => void; onPrev: () => void;
  onImport: (step: StepDef, section: string) => void;
}) {
  if (step.kind === 'gate') {
    return <GateView step={step} phase={phase} values={values} onPrev={onPrev} onNext={onNext} />
  }

  const ImportButton = ({ section }: { section: string }) => (
    <button className="btn-section-import" onClick={() => onImport(step, section)}
      title="Use AI to fill this section from a document">
      <span className="btn-section-import-icon">✨</span>
      Import doc
    </button>
  )

  return (
    <div>
      <Crumb items={[`Phase ${phase.num} — ${phase.name}`, `Step ${step.num}`]} />
      <h1 className="step-title">{step.title}</h1>
      {step.lede && <p className="step-lede">{step.lede}</p>}
      <FrameworkTags items={step.tagLines} />

      {step.fields && step.fields.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">Reflect &amp; record</div>
            <div className="section-meta-row">
              <ImportButton section="fields" />
              <span className="section-meta">Saved automatically</span>
            </div>
          </div>
          {step.fields.map(f => (
            <TextField key={f.id} field={f} value={values[f.id]}
              onChange={onField} statusValue={values[f.id + '_status']} />
          ))}
        </div>
      )}

      {step.checklist && step.checklist.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">Checklist</div>
            <div className="section-meta-row">
              <ImportButton section="checklist" />
              <span className="section-meta">{step.checklist.filter(c => values[c.id]).length} / {step.checklist.length}</span>
            </div>
          </div>
          <Checklist items={step.checklist} values={values} onChange={onCheck} onField={onField} />
        </div>
      )}

      {step.sliders && step.sliders.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">Self-assessment</div>
            <div className="section-meta-row">
              <ImportButton section="sliders" />
              <span className="section-meta">Drag to score 0–10</span>
            </div>
          </div>
          {step.sliders.map(s => (
            <ScoreSlider key={s.id} id={s.id} label={s.label} frame={s.frame}
              guide={s.guide} value={values[s.id]}
              onChange={onSlider} />
          ))}
        </div>
      )}

      <div className="nav-row">
        <button className="btn btn-ghost" onClick={onPrev}>← Previous</button>
        <button className="btn btn-primary" onClick={onNext}>Save &amp; continue →</button>
      </div>
    </div>
  )
}

function WelcomeView({ onStart, hasProgress, onJumpToDashboard, onImport }: {
  onStart: () => void; hasProgress: boolean; onJumpToDashboard: () => void; onImport: () => void
}) {
  const fws = FW_DATA.frameworks
  return (
    <div>
      <Crumb items={['Wizard', 'Welcome']} />
      <div className="welcome-hero">
        <div className="eyebrow">Regenerative Neighborhood Framework · v2.0</div>
        <h1 className="welcome-title">From spark to living community.</h1>
        <p className="welcome-lede">
          A guided wizard that walks you through four phases — Spark, Prove, Build, Live — using four interlocking frameworks. Reflect, score, gate-check, and walk away with a project document you can share.
        </p>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">The four frameworks</div>
          <div className="section-meta">All four are always at play</div>
        </div>
        <div className="framework-grid">
          {Object.entries(fws).map(([k, fw]) => (
            <div key={k} className="fw-card">
              <div className="fw-card-bar" style={{ background: fw.color }}></div>
              <div style={{ paddingLeft: 14 }}>
                <div className="fw-card-name">{fw.full}</div>
                <div className="fw-card-tag">{fw.name} · {fw.tag}</div>
                <div className="fw-card-text">{fw.blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-quote">
        Coherence between Intention, Structure, and Practice — and the balance between Individual and Community — are under constant challenge. Conflicts can generally be traced to neglecting one of the layers.
        <span className="card-quote-attr">— RCOS / CLIPS principle</span>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Two ways to move faster</div>
          <div className="section-meta">Helpers built into the wizard</div>
        </div>
        <div className="welcome-helpers">
          <div className="helper-card">
            <div className="helper-icon-wrap">
              <span className="guide-icon" style={{ width: 22, height: 22, fontSize: 13, background: 'var(--accent)', color: '#fff' }}>?</span>
            </div>
            <div className="helper-body">
              <div className="helper-title">Guide buttons explain every question</div>
              <div className="helper-text">
                Whenever you see a small <span className="inline-pill">? Guide</span> button next to a question, click it. A short, plain-language explainer pops up — what the question is really asking, why it matters, and examples to think with.
              </div>
            </div>
          </div>
          <div className="helper-card helper-card-action">
            <div className="helper-icon-wrap">
              <span style={{ fontSize: 22 }}>✨</span>
            </div>
            <div className="helper-body">
              <div className="helper-title">Already have documents? Let AI fill it in.</div>
              <div className="helper-text">
                Upload a charter, vision deck, business plan, or meeting notes. The wizard reads your document and proposes answers across every section — text fields, scores, and checklist notes. You review and confirm each one before it&rsquo;s saved.
              </div>
              <button className="btn btn-primary helper-btn" onClick={onImport}>
                ✨ Upload a document to start
              </button>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 6, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>v2.08</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">What you&rsquo;ll do</div>
          <div className="section-meta">~ 4 sessions · save &amp; resume</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['1. Reflect', 'Write your why, your team, your vision, your agreements. Worksheets at every step.'],
            ['2. Self-score', 'Rate your readiness across pillars and layers. Watch your radar fill in real time.'],
            ['3. Gate-check', 'At each gate, see if you\'re ready to proceed. Soft gates warn but don\'t block.'],
            ['4. Export', 'Print or download a full project document for your founding team.'],
          ].map(([title, text]) => (
            <div key={title} className="card">
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="nav-row">
        <div className="row gap-8">
          {hasProgress && <button className="btn btn-ghost" onClick={onJumpToDashboard}>View dashboard</button>}
          <button className="btn" onClick={onImport}>✨ Import from document</button>
        </div>
        <button className="btn btn-primary" onClick={onStart}>
          {hasProgress ? 'Resume →' : 'Begin Phase 1 →'}
        </button>
      </div>
    </div>
  )
}

function DashboardView({ values, onJump, onPrint }: {
  values: Values; onJump: (id: string) => void; onPrint: () => void
}) {
  const pillarScores = computePillarScores(values)
  const overall = Object.values(pillarScores).reduce((a, b) => a + b, 0) / 5

  const phaseProgress = FW_DATA.phases.map(p => {
    const totalSteps = p.steps.filter(s => s.kind !== 'gate').length
    let answered = 0
    p.steps.forEach(s => {
      if (s.kind === 'gate') return
      const hasAny = (s.fields ?? []).some(f => values[f.id] && String(values[f.id]).length > 5)
      const hasSliders = (s.sliders ?? []).some(sl => values[sl.id] != null)
      const hasChecks = (s.checklist ?? []).some(c => values[c.id])
      if (hasAny || hasSliders || hasChecks) answered++
    })
    return { phase: p, ratio: answered / totalSteps, answered, total: totalSteps }
  })

  const currentPhaseIndex = phaseProgress.findIndex(p => p.ratio < 1)
  const currentSpiral = currentPhaseIndex < 0 ? 5 : FW_DATA.phases[currentPhaseIndex].spiral
  const completedSpirals = FW_DATA.phases.slice(0, currentPhaseIndex < 0 ? 4 : currentPhaseIndex).map(p => p.spiral)

  return (
    <div>
      <Crumb items={['Project', 'Dashboard']} />
      <h1 className="step-title">Your project at a glance</h1>
      <p className="step-lede">A live diagnostic across pillars, phases, and frameworks.</p>

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-label">Overall readiness</div>
          <div className="metric-value">{overall.toFixed(1)}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / 10</span></div>
          <div className="metric-note">across 5 pillars</div>
        </div>
        <div className="metric">
          <div className="metric-label">Current spiral</div>
          <div className="metric-value">S{currentSpiral}</div>
          <div className="metric-note">{FW_DATA.phases[Math.max(0, currentPhaseIndex)]?.spiralName ?? 'Continuous regeneration'}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Phases active</div>
          <div className="metric-value">{Math.max(1, currentPhaseIndex < 0 ? 4 : currentPhaseIndex + 1)}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / 4</span></div>
          <div className="metric-note">spark → live</div>
        </div>
        <div className="metric">
          <div className="metric-label">Gates passed</div>
          <div className="metric-value">{computeGatesPassed(values)}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / 4</span></div>
          <div className="metric-note">RNF checkpoints</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="rail-title">RNF Pillars</div>
          <PillarRadar scores={pillarScores} />
        </div>
        <div className="card">
          <div className="rail-title">5-Spiral Timeline</div>
          <SpiralTimelineLarge currentSpiral={currentSpiral} completedSpirals={completedSpirals} phases={FW_DATA.phases} />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Phase progress</div>
          <div className="section-meta">Click to jump in</div>
        </div>
        {phaseProgress.map(({ phase, ratio, answered, total }) => (
          <div key={phase.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onJump(phase.steps[0].id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div>
                <span style={{ color: 'var(--ink-3)', marginRight: 10, fontSize: 11, fontFamily: 'var(--mono)' }}>{phase.num}</span>
                <span style={{ fontFamily: 'var(--display)', fontSize: 22 }}>{phase.name}</span>
                <span style={{ color: 'var(--ink-3)', marginLeft: 10, fontSize: 13 }}>· {phase.subtitle}</span>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{answered}/{total} steps</span>
            </div>
            <div style={{ height: 4, background: 'var(--rule-soft)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${ratio * 100}%`, background: 'var(--rnf)', borderRadius: 2, transition: 'width 300ms' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="nav-row">
        <button className="btn btn-ghost" onClick={() => onJump('welcome')}>← Welcome</button>
        <div className="row gap-8">
          <button className="btn" onClick={onPrint}>📄 Export project document</button>
          <button className="btn btn-primary" onClick={() => {
            const next = phaseProgress.find(p => p.ratio < 1)
            const firstNonGate = next?.phase.steps.find(s => s.kind !== 'gate')?.id
            onJump(firstNonGate ?? FW_DATA.phases[0].steps[0].id)
          }}>Continue where I left off →</button>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function BlueprintClient({ blueprintId, initialAnswers }: Props) {
  const D = FW_DATA

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    const t = document.documentElement.dataset.theme
    setTheme(t === 'dark' ? 'dark' : 'light')
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* noop */ }
  }, [theme])

  const flat = useMemo(() => {
    const arr: Array<{ id: string; kind: string; phaseRef?: PhaseDef } & Partial<StepDef>> = [
      { id: 'welcome', kind: 'welcome' }
    ]
    D.phases.forEach(p => p.steps.forEach(s => arr.push({ ...s, phaseRef: p })))
    arr.push({ id: 'dashboard', kind: 'dashboard' })
    return arr
  }, [D])

  const [values, setValues] = useState<Values>(initialAnswers)
  const [currentId, setCurrentId] = useState('welcome')

  const supabase = createClient()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const save = useCallback(
    debounce(async (vals: Values) => {
      await supabase.from('blueprints').update({ answers: vals }).eq('id', blueprintId)
    }, 1800),
    [blueprintId]
  )

  useEffect(() => {
    save(values)
  }, [values, save])

  const idx = flat.findIndex(s => s.id === currentId)
  const current = flat[idx] ?? flat[0]

  const handleField = (id: string, val: unknown) => setValues(v => ({ ...v, [id]: val }))
  const handleSlider = (id: string, val: number) => setValues(v => ({ ...v, [id]: val }))
  const handleCheck = (id: string, val: unknown) => setValues(v => ({ ...v, [id]: val }))

  const scrollMainToTop = () => {
    const mainEl = document.querySelector('.wizard-root .main')
    if (mainEl) (mainEl as HTMLElement).scrollTop = 0
  }

  const goNext = () => { if (idx < flat.length - 1) { setCurrentId(flat[idx + 1].id); scrollMainToTop() } }
  const goPrev = () => { if (idx > 0) { setCurrentId(flat[idx - 1].id); scrollMainToTop() } }
  const jumpTo = (id: string) => { setCurrentId(id); scrollMainToTop() }

  useEffect(() => {
    const el = document.querySelector(`[data-step-id="${currentId}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentId])

  const pillarScores = computePillarScores(values)
  const hasProgress = Object.keys(values).length > 0

  const currentPhase = (current as { phaseRef?: PhaseDef }).phaseRef ?? D.phases[0]
  const currentSpiral = currentPhase.spiral
  const completedSpirals = D.phases.filter(p => p.spiral < currentSpiral).map(p => p.spiral)

  const [showImport, setShowImport] = useState(false)
  const [importScope, setImportScope] = useState<ImportScope | undefined>(undefined)

  const openImport = (step?: StepDef, section?: string) => {
    setImportScope(step ? { step, section } : undefined)
    setShowImport(true)
  }

  const [mobileTab, setMobileTab] = useState<'nav' | 'content' | 'stats'>('content')
  const TABS = ['nav', 'content', 'stats'] as const
  const swipeRef = useRef({ x: 0, y: 0, t: 0, active: false })

  const onTouchStart = (e: React.TouchEvent) => {
    const el = e.target as Element
    if (el.closest && (el.closest('input[type="range"]') || el.closest('.guide-pop') || el.closest('.fs-help-pop'))) {
      swipeRef.current.active = false; return
    }
    const t = e.touches[0]
    swipeRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), active: true }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipeRef.current.active) return
    const t = e.changedTouches[0]
    const dx = t.clientX - swipeRef.current.x
    const dy = t.clientY - swipeRef.current.y
    const dt = Date.now() - swipeRef.current.t
    swipeRef.current.active = false
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4 || dt > 700) return
    const i = TABS.indexOf(mobileTab)
    if (dx < 0 && i < TABS.length - 1) setMobileTab(TABS[i + 1])
    if (dx > 0 && i > 0) setMobileTab(TABS[i - 1])
  }

  return (
    <div className="wizard-root" data-theme={theme} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <nav className="mobile-tabs">
        {(['nav', 'content', 'stats'] as const).map(tab => (
          <button key={tab} className={`mobile-tab${mobileTab === tab ? ' active' : ''}`}
            onClick={() => setMobileTab(tab)}>
            <span className="mobile-tab-icon">{tab === 'nav' ? '☰' : tab === 'content' ? '✏' : '◎'}</span>
            <span>{tab === 'nav' ? 'Steps' : tab === 'content' ? 'Content' : 'Radar'}</span>
          </button>
        ))}
      </nav>

      <div className="app">
        {/* Sidebar */}
        <aside className={`sidebar${mobileTab === 'nav' ? ' mobile-open' : ''}`}>
          <div className="brand">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="brand-name">Regen Neighborhood</div>
              <div className="brand-sub">Framework Wizard v2</div>
            </div>
            <div className="theme-toggle">
              <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')} aria-label="Light">☀</button>
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')} aria-label="Dark">☾</button>
            </div>
          </div>

          <ul className="phase-list">
            <li className={`step${currentId === 'welcome' ? ' active' : ''}`}
              data-step-id="welcome"
              style={{ paddingLeft: 0, marginBottom: 12 }}
              onClick={() => jumpTo('welcome')}>
              <div className="step-dot"></div>
              <div>Welcome</div>
            </li>

            {D.phases.map(phase => (
              <li key={phase.id} className={`phase${phase.steps.some(s => s.id === currentId) ? ' has-active' : ''}`}>
                <div className="phase-header">
                  <span className="phase-num">{phase.num}</span>
                  <span className="phase-title">{phase.name}</span>
                  <span className="phase-time">{phase.time.split(' ').slice(-1)[0]}</span>
                </div>
                <ul className="step-list">
                  {phase.steps.map(s => {
                    const isActive = s.id === currentId
                    const isComplete = stepComplete(s, values)
                    const isGate = s.kind === 'gate'
                    const gs = isGate ? gateStatus(s, values) : null
                    let cls = 'step'
                    if (isActive) cls += ' active'
                    if (isComplete) cls += ' complete'
                    if (isGate) {
                      cls += ' gate'
                      if (gs === 'ready') cls += ' passed'
                      else if (gs === 'warning') cls += ' gate-warning'
                    }
                    return (
                      <li key={s.id} className={cls} data-step-id={s.id} onClick={() => jumpTo(s.id)}>
                        <div className="step-dot"></div>
                        <div>{isGate ? `Gate ${s.gateNum === 34 ? '3·4' : s.gateNum}` : `${s.num} ${s.title}`}</div>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}

            <li className={`step${currentId === 'dashboard' ? ' active' : ''}`}
              data-step-id="dashboard"
              style={{ paddingLeft: 0, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--rule-soft)' }}
              onClick={() => jumpTo('dashboard')}>
              <div className="step-dot"></div>
              <div>📊 Dashboard</div>
            </li>
          </ul>

          <div className="legend">
            <div className="legend-title">Frameworks</div>
            {Object.entries(D.frameworks).map(([k, fw]) => (
              <div key={k} className="legend-item">
                <div className="legend-swatch" style={{ background: fw.color }}></div>
                <div>
                  <div className="legend-name">{fw.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{fw.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className={`main${mobileTab !== 'content' ? ' mobile-hidden' : ''}`}>
          {current.kind === 'welcome' && (
            <WelcomeView onStart={() => jumpTo(D.phases[0].steps[0].id)}
              hasProgress={hasProgress} onJumpToDashboard={() => jumpTo('dashboard')}
              onImport={() => openImport()} />
          )}
          {current.kind === 'dashboard' && (
            <DashboardView values={values} onJump={jumpTo} onPrint={() => window.print()} />
          )}
          {(current as { phaseRef?: PhaseDef }).phaseRef && (
            <StepView
              step={current as StepDef}
              phase={(current as { phaseRef: PhaseDef }).phaseRef}
              values={values}
              onField={handleField}
              onSlider={handleSlider}
              onCheck={handleCheck}
              onNext={goNext}
              onPrev={goPrev}
              onImport={openImport}
            />
          )}
        </main>

        {/* Right rail */}
        <aside className={`rail${mobileTab === 'stats' ? ' mobile-open' : ''}`}>
          <div className="rail-section">
            <div className="rail-title">Live Diagnostic</div>
            <PillarRadar scores={pillarScores} size={260} />
          </div>
          <div className="rail-section">
            <div className="rail-title">RNF Pillars</div>
            <PillarBars scores={pillarScores} onJump={jumpTo} />
          </div>
          <div className="rail-section">
            <div className="rail-title">5-Spiral Timeline</div>
            <SpiralMini currentSpiral={currentSpiral} completedSpirals={completedSpirals} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.1em', marginTop: 6 }}>
              CURRENT: SPIRAL {currentSpiral}
            </div>
          </div>
          <div className="rail-section">
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowImport(true)}>
              ✨ Import from document
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 11 }}
              onClick={() => {
                if (confirm('Reset all wizard data? This cannot be undone.')) {
                  setValues({})
                  setCurrentId('welcome')
                  supabase.from('blueprints').update({ answers: {}, flags: {} }).eq('id', blueprintId)
                }
              }}>
              Reset progress
            </button>
          </div>
        </aside>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => { setShowImport(false); setImportScope(undefined) }}
          currentValues={values}
          scope={importScope}
          onApply={extracted => setValues(v => ({ ...v, ...extracted }))}
        />
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/core/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PILLARS, PILLAR_META, type Pillar } from '@/core/lib/pillars'

export default function NewProjectClient({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [openForCollab, setOpenForCollab] = useState(true)
  const [circle, setCircle] = useState<Pillar | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        open_for_collaborators: openForCollab,
        circle: circle || null,
        created_by: userId,
      })
      .select('id')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/ops')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--rule)', background: 'var(--surface)',
    color: 'var(--ink)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 20px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4338ca', background: '#4338ca15', padding: '3px 10px', borderRadius: 20, marginBottom: 12 }}>
          M07 · Operations
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>
          New project
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
            Project title *
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Garden infrastructure"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this project about? What does success look like?"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
            Circle <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>— which pillar does this project belong to?</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PILLARS.map(p => {
              const meta = PILLAR_META[p]
              const active = circle === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCircle(active ? '' : p)}
                  style={{
                    fontSize: 13, fontWeight: 600,
                    padding: '7px 14px', borderRadius: 20,
                    background: active ? meta.color : 'var(--surface)',
                    color: active ? '#fff' : 'var(--ink-2)',
                    border: `1px solid ${active ? meta.color : 'var(--rule)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {meta.emoji} {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={openForCollab}
            onChange={e => setOpenForCollab(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4338ca' }}
          />
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            Open for collaboration agreements — members can propose to work on this
          </span>
        </label>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            style={{
              background: '#4338ca', color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '11px 28px', borderRadius: 'var(--radius)', border: 'none',
              cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !title.trim() ? 0.65 : 1,
            }}
          >
            {saving ? 'Creating…' : 'Create project'}
          </button>
          <Link href="/ops" style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, textDecoration: 'none' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

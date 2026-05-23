'use client'
import { useState } from 'react'

export const inputStyle: React.CSSProperties = {
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

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
}

export function FormField({ label, hint, children }: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)',
        marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span>{label}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export function FocusTextarea({ value, onChange, placeholder, minHeight }: {
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
        boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--m6) 15%, transparent)' : 'none',
      }}
    />
  )
}

export function FocusInput({ value, onChange, placeholder }: {
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
        boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--m6) 15%, transparent)' : 'none',
      }}
    />
  )
}

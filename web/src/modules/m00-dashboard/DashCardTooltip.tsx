'use client'
import { useState } from 'react'

interface Props {
  children: React.ReactNode
  desc: string
  color?: string
}

export default function DashCardTooltip({ children, desc, color = '#18181b' }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {/* Tooltip — appears below the card */}
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'var(--surface, #fff)',
        border: `1px solid var(--rule, #e5e5e5)`,
        borderTop: `2px solid ${color}`,
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
        fontSize: 12.5,
        color: 'var(--ink-2, #404040)',
        lineHeight: 1.6,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 160ms ease, transform 160ms ease',
        pointerEvents: 'none',
      }}>
        {/* Upward-pointing arrow */}
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 14,
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: `7px solid var(--rule, #e5e5e5)`,
        }} />
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% - 2px)',
          left: 15,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `6px solid var(--surface, #fff)`,
        }} />
        {desc}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { MODULE_META } from '@/lib/module-meta'

export { MODULE_META }

interface Props {
  num: string
  standalone?: boolean
}

export default function ModuleHeader({ num, standalone }: Props) {
  const mod = MODULE_META[num] ?? MODULE_META['00']
  const [descOpen, setDescOpen] = useState(false)

  const content = (
    <div
      style={{
        background: mod.bg,
        borderRadius: standalone ? 0 : 'var(--radius-lg)',
        padding: '20px 24px 18px',
        marginBottom: standalone ? 0 : 32,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setDescOpen(o => !o)}
      onMouseEnter={() => setDescOpen(true)}
      onMouseLeave={() => setDescOpen(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            MyCoNet · Module
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {num}
          </div>
        </div>
        <div style={{ paddingBottom: 8, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{mod.label}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontFamily: 'var(--mono)' }}>
            Tap to learn more
          </div>
        </div>
        <div style={{ paddingBottom: 10, fontSize: 16, color: 'rgba(255,255,255,0.4)', transition: 'transform 200ms', transform: descOpen ? 'rotate(180deg)' : 'none' }}>
          ▾
        </div>
      </div>

      {/* Description — revealed on hover/tap */}
      <div style={{
        overflow: 'hidden',
        maxHeight: descOpen ? 80 : 0,
        transition: 'max-height 220ms ease',
      }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 }}>
          {mod.desc}
        </p>
      </div>
    </div>
  )

  return content
}

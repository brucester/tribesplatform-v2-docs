'use client'
import { useState } from 'react'

export const MODULE_META: Record<string, { bg: string; label: string; desc: string }> = {
  '00': { bg: '#18181b', label: 'Dashboard',              desc: 'Your personal heads-up display — all your community information, modules, and status in one place.' },
  '01': { bg: '#92400e', label: 'Community Network',      desc: 'Find your people. Profile-based discovery with AI matching for explorers, builders, and resource holders.' },
  '02': { bg: '#b91c1c', label: 'Neighborhood Directory', desc: 'A live map of regenerative neighborhoods — community profiles, milestones, events, and guest books.' },
  '03': { bg: '#ea580c', label: 'Resources & Tools',      desc: 'Curated archive of regenerative guides, case studies, and tools — smart-tagged by AI for easy discovery.' },
  '04': { bg: '#92640a', label: 'Blueprint',              desc: 'Guided community planning through SPARK → PROVE → BUILD → LIVE with pillar scores and milestone gates.' },
  '05': { bg: '#15803d', label: 'Join',                   desc: 'The full onboarding flow — from initial application through community welcome and role assignment.' },
  '06': { bg: '#1d4ed8', label: 'Agreements',             desc: 'Propose what you will contribute and what you expect in return. The team reviews and confirms your agreement.' },
  '07': { bg: '#4338ca', label: 'Operations',             desc: 'Active community projects with live updates. Admins manage the work; members see what\'s happening.' },
  '08': { bg: '#7c3aed', label: 'Contribution Tracking',  desc: 'Points, badges, and reputation that make regenerative action visible, measurable, and rewarding.' },
  '09': { bg: '#db2777', label: 'Governance',             desc: 'AI-facilitated governance — mediates conflicts, surfaces proposals, and guides collective decisions.' },
  '10': { bg: '#475569', label: 'Genesis Bot',            desc: 'Telegram bridge — members request database changes via chat with leadership approval workflows.' },
  '11': { bg: '#64748b', label: 'Quinn',                  desc: 'Your personal AI guide — daily reminders, goal tracking, and routing to the right people in the community.' },
  '12': { bg: '#b45309', label: 'MycoNet Agent',          desc: 'The community brain — reads all modules, connects the dots, and runs the background approval queue.' },
  '13': { bg: '#78350f', label: 'Hive',                   desc: 'Inter-community layer — shared resources, collaboration, and mutual aid across multiple neighborhoods.' },
}

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

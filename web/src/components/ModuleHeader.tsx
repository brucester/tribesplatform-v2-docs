// Colored module identity banner shown at the top of every module page.
// Colors follow the MyCoNet module palette defined by the community.
import React from 'react'

export const MODULE_COLORS: Record<string, { bg: string; label: string; emoji: string }> = {
  '00': { bg: '#18181b',                                    label: 'Dashboard',           emoji: '◎' },
  '01': { bg: '#92400e',                                    label: 'Community Network',   emoji: '🌐' },
  '02': { bg: '#b91c1c',                                    label: 'Neighborhood Directory', emoji: '🗺' },
  '03': { bg: '#ea580c',                                    label: 'Resources & Tools',   emoji: '📚' },
  '04': { bg: '#92640a',                                    label: 'Blueprint',           emoji: '🗺' },
  '05': { bg: '#15803d',                                    label: 'Join',                emoji: '🚪' },
  '06': { bg: '#1d4ed8',                                    label: 'Agreements',          emoji: '📋' },
  '07': { bg: '#4338ca',                                    label: 'Operations',          emoji: '⚙️' },
  '08': { bg: '#7c3aed',                                    label: 'Contribution Tracking', emoji: '✦' },
  '09': { bg: '#db2777',                                    label: 'Governance',          emoji: '⚖️' },
  '10': { bg: '#64748b',                                    label: 'Genesis Bot',         emoji: '🤖' },
  '11': { bg: '#94a3b8',                                    label: 'Quinn',               emoji: '◇' },
  '12': { bg: '#b45309',                                    label: 'MycoNet Agent',       emoji: '✦' },
  '13': { bg: '#78350f',                                    label: 'Hive',                emoji: '⬡' },
}

interface Props {
  num: string     // e.g. '04'
  standalone?: boolean  // true = header has its own page-width wrapper + bottom margin
}

export default function ModuleHeader({ num, standalone }: Props) {
  const mod = MODULE_COLORS[num] ?? MODULE_COLORS['00']
  const inner = (
    <div style={{
      background: mod.bg,
      borderRadius: standalone ? 0 : 'var(--radius-lg)',
      padding: standalone ? '20px 24px 18px' : '20px 24px 18px',
      marginBottom: standalone ? 0 : 32,
      display: 'flex',
      alignItems: 'flex-end',
      gap: 16,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          MyCoNet · Module
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {num}
        </div>
      </div>
      <div style={{ paddingBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{mod.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontFamily: 'var(--mono)' }}>
          MyCommunityNetwork
        </div>
      </div>
    </div>
  )

  if (standalone) {
    return (
      <div style={{ marginBottom: 0 }}>
        {inner}
      </div>
    )
  }
  return inner
}

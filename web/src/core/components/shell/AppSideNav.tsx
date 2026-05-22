'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const CLUBHOUSE = [
  { num: '00', name: 'Dashboard',   color: 'var(--ink)', href: '/dashboard' },
  { num: '01', name: 'Members',     color: 'var(--m1)',  href: '/network' },
  { num: '04', name: 'Blueprint',   color: 'var(--m4)',  href: '/blueprint' },
  { num: '05', name: 'Join',        color: 'var(--m5)',  href: '/join' },
] as const

const RESIDENT = [
  { num: '06', name: 'Agreements',    color: 'var(--m6)', href: '/agreements' as string | null },
  { num: '07', name: 'Operations',    color: 'var(--m7)', href: '/ops' as string | null },
  { num: '08', name: 'Contributions', color: 'var(--m8)', href: '/contributions' as string | null },
  { num: '09', name: 'Governance',    color: 'var(--m9)', href: '/governance' as string | null },
]

function NavItem({ num, name, color, href, active, onClick }: {
  num: string; name: string; color: string; href: string | null; active: boolean; onClick?: () => void
}) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 7,
      fontSize: 13,
      color: active ? 'var(--ink)' : 'var(--ink-2)',
      fontWeight: active ? 600 : 400,
      background: active ? `color-mix(in srgb, ${color} 10%, var(--surface))` : 'transparent',
      border: active ? `1px solid color-mix(in srgb, ${color} 25%, var(--rule))` : '1px solid transparent',
      opacity: href ? 1 : 0.45,
      transition: 'background 80ms, border-color 80ms',
    }}>
      <span style={{ width: active ? 3 : 2, height: 16, borderRadius: 2, background: color, flexShrink: 0, opacity: active ? 1 : 0.5 }} />
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, width: 22,
        color: active ? color : 'var(--ink-4)',
      }}>M{num}</span>
      <span>{name}</span>
    </div>
  )

  if (!href) return <div style={{ cursor: 'default' }}>{inner}</div>

  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: 'none', display: 'block' }} className="sh-nav-item">
      {inner}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)',
      padding: '12px 10px 6px',
    }}>
      {label}
    </div>
  )
}

interface Props {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AppSideNav({ mobileOpen, onClose }: Props) {
  const pathname = usePathname()

  const isActive = (href: string | null) => {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={`app-shell-sidenav${mobileOpen ? ' mobile-open' : ''}`}
      style={{
        borderRight: '1px solid var(--rule)',
        background: 'var(--bg-2)',
        padding: '14px 10px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* Mobile close row */}
      <div className="mobile-nav-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase' }}>Modules</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}
          aria-label="Close navigation"
        >
          ✕
        </button>
      </div>

      <SectionLabel label="Clubhouse" />
      {CLUBHOUSE.map(m => (
        <NavItem key={m.num} {...m} active={isActive(m.href)} onClick={onClose} />
      ))}

      <SectionLabel label="Once you're in" />
      {RESIDENT.map(m => (
        <NavItem key={m.num} {...m} active={isActive(m.href)} onClick={onClose} />
      ))}

      <div style={{ flex: 1 }} />

      <div style={{
        padding: 12, marginTop: 8, borderRadius: 8,
        background: 'color-mix(in srgb, var(--accent-color) 8%, transparent)',
        border: '1px dashed color-mix(in srgb, var(--accent-color) 25%, var(--rule))',
        fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>You're an Explorer</div>
        <div style={{ color: 'var(--ink-3)', fontSize: 11 }}>
          Sign the values to unlock Agreements, Operations, Contributions & Governance.
        </div>
      </div>
    </nav>
  )
}

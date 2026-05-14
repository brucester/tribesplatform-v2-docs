import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Pencil, Sparkles, Search, Gift, HelpCircle } from 'lucide-react'

interface Step { label: string; complete: boolean }

interface Props {
  data: { steps: Step[]; completed: number; completeness: number } | null
}

const QUICK_ACTIONS = [
  { label: 'Search Network', href: '/network/discover', icon: Search },
  { label: 'My Matches',     href: '/network/matches',  icon: Sparkles },
  { label: 'My Offers',      href: '/network/offers',   icon: Gift },
  { label: 'My Requests',    href: '/network/seeks',    icon: HelpCircle },
  { label: 'Edit Profile',   href: '/profile/edit',     icon: Pencil },
]

export default function NetworkRightPanel({ data }: Props) {
  return (
    <aside className="net-right-panel flex-col" style={{
      width: 220, flexShrink: 0,
      borderLeft: '1px solid var(--sidebar-border)',
      background: 'var(--sidebar)',
      position: 'sticky', top: 52,
      height: 'calc(100vh - 52px)',
      overflowY: 'auto',
      padding: '20px 14px',
      gap: 20,
    }}>
      {data ? (
        <>
          {/* Profile completeness */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-4)', marginBottom: 10 }}>
              Profile
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--ink-3)' }}>{data.completed}/{data.steps.length} complete</span>
              <span style={{ fontWeight: 600 }}>{data.completeness}%</span>
            </div>
            <Progress value={data.completeness} className="h-1.5 mb-3" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {data.steps.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                  {s.complete
                    ? <CheckCircle2 style={{ width: 13, height: 13, color: 'var(--accent)', flexShrink: 0 }} />
                    : <Circle style={{ width: 13, height: 13, color: 'var(--ink-4)', flexShrink: 0 }} />
                  }
                  <span style={{ color: s.complete ? 'var(--ink)' : 'var(--ink-3)' }}>{s.label}</span>
                </div>
              ))}
            </div>
            {data.completeness < 100 && (
              <Link href="/profile/edit" style={{
                display: 'block', marginTop: 12, textAlign: 'center',
                fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                padding: '6px 8px', borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)', textDecoration: 'none',
              }}>
                Complete Profile
              </Link>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--rule)' }} />

          {/* Quick actions */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-4)', marginBottom: 10 }}>
              Quick Actions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {QUICK_ACTIONS.map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
                    <div className="hover-elevate" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 8px', borderRadius: 'var(--radius)',
                      fontSize: 13, color: 'var(--ink-2)',
                    }}>
                      <Icon style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--accent)' }} />
                      {a.label}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14, lineHeight: 1.6 }}>
            Join MyCoNet to connect with the community
          </p>
          <Link href="/auth/signup" style={{
            display: 'block', fontSize: 13, fontWeight: 600,
            color: '#fff', background: 'var(--primary)',
            padding: '8px', borderRadius: 'var(--radius)',
            textDecoration: 'none', marginBottom: 8,
          }}>
            Join free
          </Link>
          <Link href="/auth/login" style={{
            display: 'block', fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none',
          }}>
            Sign in
          </Link>
        </div>
      )}
    </aside>
  )
}

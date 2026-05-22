'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type PhaseP = { id: string; name: string; answered: number; total: number; ratio: number }
type Member = { id: string; first_name: string | null; last_name: string | null; headline: string | null; city: string | null; country: string | null; avatar_url: string | null; username: string | null }
type Value  = { id: string; title: string; description: string; sort_order: number }
type Project = { id: string; title: string; description: string | null; needs: string[] | null; open_for_collaborators: boolean }
type Deliverable = { id: string; title: string; status: string; due_date: string | null; user_profiles?: { username: string | null } | null }

interface Props {
  firstName: string | null
  communityName: string
  communityPurpose: string | null
  phaseProgress: PhaseP[]
  overall: number | null
  gatesPassed: number | null
  memberCount: number
  members: Member[]
  communityValues: Value[]
  projects: Project[]
  activeProjectCount: number
  deliverables: Deliverable[]
  isLoggedIn: boolean
  hasApplied: boolean
  isFullMember: boolean
}

const CHECK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
    <polyline points="5 12 10 17 19 7" />
  </svg>
)

const GOV_LAYERS = [
  { num: '01', name: 'Consent (Sociocracy)', mark: '☉', desc: 'Most everyday decisions. Move forward if there are no principled objections — not unanimous applause.' },
  { num: '02', name: 'Democracy (Majority)', mark: '☑', desc: 'Big shared choices that affect everyone. Open vote, simple majority, public results.' },
  { num: '03', name: 'Meritocracy (Domain expert)', mark: '△', desc: 'Technical calls go to the person with skin in the game — soil tests, money, contracts.' },
  { num: '04', name: 'AI-mediated facilitation', mark: '◇', desc: 'When things stall, the AI surfaces blockers, suggests reframes, and finds the next move.' },
]

const PHASE_COLORS = ['#22c55e', '#ca8a04', '#3b82f6', '#8b5cf6']

function initials(name: string) {
  return name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}

function ModTag({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      background: `color-mix(in srgb, ${color} 14%, transparent)`,
      color, padding: '2px 8px', borderRadius: 20,
    }}>{label}</span>
  )
}

function DemoCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 12, padding: 22,
      boxShadow: '0 4px 16px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04)',
    }}>
      {children}
    </div>
  )
}

function DemoHead({ color, modLabel, title, meta, href }: { color: string; modLabel: string; title: string; meta?: string; href: string }) {
  return (
    <Link href={href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, textDecoration: 'none', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <ModTag color={color} label={modLabel} />
        <strong style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'var(--rule)', textUnderlineOffset: 3 }}>{title}</strong>
      </div>
      {meta && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{meta}</span>}
    </Link>
  )
}

function SectionHead({ color, mod, label, h, lead, why, href }: {
  color: string; mod: string; label: string; h: string; lead: string; why: string[]; href: string
}) {
  return (
    <div>
      <Link href={href} style={{ textDecoration: 'none' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          background: `color-mix(in srgb, ${color} 10%, transparent)`,
          color, padding: '4px 12px', borderRadius: 20, marginBottom: 16,
          cursor: 'pointer',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          Module {mod} · {label} ↗
        </span>
      </Link>
      <h2 style={{
        fontFamily: 'var(--display)', fontSize: 'clamp(24px, 3.2vw, 36px)',
        color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.015em',
        margin: '0 0 16px', maxWidth: '22ch',
      }}>{h}</h2>
      <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.75, marginBottom: 24, maxWidth: '58ch' }}>{lead}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {why.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
              display: 'grid', placeItems: 'center', color, marginTop: 1,
            }}>
              {CHECK_ICON}
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: w }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Split({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 52,
      alignItems: 'start',
      direction: reverse ? 'rtl' : undefined,
    }}>
      {reverse
        ? (Array.isArray(children) ? children.map((c, i) => <div key={i} style={{ direction: 'ltr' }}>{c}</div>) : children)
        : children}
    </div>
  )
}

export default function HomeClient({
  firstName, communityName, communityPurpose,
  phaseProgress, overall, gatesPassed,
  memberCount, members, communityValues,
  projects, activeProjectCount, deliverables,
  isLoggedIn, hasApplied, isFullMember,
}: Props) {
  const name = firstName || (isLoggedIn ? 'there' : 'you')

  // M05 - values
  const [checked, setChecked] = useState<boolean[]>(() => communityValues.map(() => false))
  const toggle = (i: number) => setChecked(c => c.map((v, j) => j === i ? !v : v))
  const signedCount = checked.filter(Boolean).length
  const allSigned = communityValues.length > 0 && signedCount === communityValues.length

  // M06 - agreements
  const [pickedProject, setPickedProject] = useState(0)
  const [contribution, setContribution] = useState('')
  const [expectation, setExpectation] = useState('')
  const [agreementSubmitted, setAgreementSubmitted] = useState(false)

  // M09 - governance
  const [govLayer, setGovLayer] = useState(0)
  const [vote, setVote] = useState<null | 'yes' | 'concern' | 'no'>(null)
  const yesV = 14 + (vote === 'yes' ? 1 : 0)
  const conV = 3 + (vote === 'concern' ? 1 : 0)
  const noV  = 2 + (vote === 'no' ? 1 : 0)

  // M04 - animate bars on scroll into view
  const bpRef = useRef<HTMLDivElement>(null)
  const [bpAnimated, setBpAnimated] = useState(false)
  useEffect(() => {
    const el = bpRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBpAnimated(true) }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const currentPhaseIdx = phaseProgress.findIndex(p => p.ratio < 1)
  const sectionW: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '72px 28px 0' }

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 28px 0' }} id="welcome">
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600,
          letterSpacing: '0.08em', color: 'var(--accent-color)',
          marginBottom: 22,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-color)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-color) 25%, transparent)',
            animation: 'ping 1.6s ease-out infinite',
          }} />
          {communityName} · Member portal
        </span>
        <h1 style={{
          fontFamily: 'var(--display)',
          fontSize: 'clamp(32px, 5.5vw, 60px)',
          lineHeight: 1.05, letterSpacing: '-0.025em',
          color: 'var(--ink)', marginBottom: 22, maxWidth: '18ch',
        }}>
          Welcome, {name}.<br />
          This is the{' '}
          <span style={{
            background: 'linear-gradient(to bottom, transparent 65%, color-mix(in srgb, var(--accent-color) 28%, transparent) 65%)',
          }}>
            digital clubhouse
          </span>
          {' '}for a regenerative community being formed — <span style={{ color: 'var(--accent-color)' }}>together</span>.
        </h1>
        <p style={{
          fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.75,
          maxWidth: '56ch', marginBottom: 28,
        }}>
          {communityPurpose
            ? communityPurpose
            : "You're not on a social network. You're inside the operating system of a community-in-formation. Meet the people, read the plan, contribute your work, and help decide what happens next."}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="#meet" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 700, color: 'var(--bg)',
            background: 'var(--ink)', padding: '11px 22px', borderRadius: 9,
            textDecoration: 'none',
          }}>
            Take the tour →
          </a>
          {!isFullMember && (
            <Link href="/join" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 14, fontWeight: 600, color: 'var(--ink)',
              background: 'var(--surface)', border: '1px solid var(--rule)',
              padding: '11px 22px', borderRadius: 9, textDecoration: 'none',
            }}>
              I'm ready to join
            </Link>
          )}
        </div>
      </section>

      {/* ── Clubhouse Preview ───────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '60px auto 0', padding: '0 28px' }} id="clubhouse">
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0,0,0,.09), 0 4px 10px rgba(0,0,0,.05)',
          border: '1px solid var(--rule)',
          background: 'radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--accent-color) 8%, transparent), transparent 60%)',
        }}>
          {/* Browser chrome */}
          <div style={{ padding: '11px 16px', background: 'var(--bg-2)', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ef5f57', '#f7bd2e', '#28c93f'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{
              flex: 1, maxWidth: 340, margin: '0 auto',
              background: 'var(--surface)', border: '1px solid var(--rule)',
              borderRadius: 6, padding: '4px 12px',
              fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--mono)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>🔒</span> {communityName.toLowerCase().replace(/\s+/g, '')}.myco.net/dashboard
            </div>
          </div>
          {/* Body: sidebar + main */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', background: 'var(--bg)' }}>
            {/* Sidebar */}
            <div style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--rule)', padding: '18px 12px', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, padding: '0 4px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--m1), var(--m4))',
                  display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 700,
                }}>
                  {name[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{firstName || 'Explorer'}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-4)' }}>Explorer</div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '8px 6px 4px' }}>Clubhouse</div>
              {[
                { num: '00', name: 'Dashboard', color: 'var(--ink)', active: true },
                { num: '01', name: 'Residents', color: 'var(--m1)' },
                { num: '04', name: 'Blueprint', color: 'var(--m4)' },
                { num: '05', name: 'Join', color: 'var(--m5)' },
              ].map(m => (
                <div key={m.num} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px',
                  borderRadius: 6, background: m.active ? 'var(--surface)' : 'transparent',
                  marginBottom: 1, color: m.active ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: m.active ? 600 : 400,
                }}>
                  <span style={{ width: 3, height: 14, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: m.active ? 'var(--ink-3)' : 'var(--ink-4)', width: 22 }}>M{m.num}</span>
                  <span style={{ fontSize: 11.5 }}>{m.name}</span>
                </div>
              ))}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '10px 6px 4px' }}>Once you're in</div>
              {[
                { num: '06', name: 'Agreements', color: 'var(--m6)' },
                { num: '07', name: 'Operations', color: 'var(--m7)' },
                { num: '08', name: 'Contributions', color: 'var(--m8)' },
                { num: '09', name: 'Governance', color: 'var(--m9)' },
              ].map(m => (
                <div key={m.num} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px',
                  borderRadius: 6, marginBottom: 1, opacity: 0.45,
                  color: 'var(--ink-2)', fontSize: 11.5,
                }}>
                  <span style={{ width: 3, height: 14, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', width: 22 }}>M{m.num}</span>
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
            {/* Main content */}
            <div style={{ padding: '22px 24px' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                Good morning, {firstName || 'Explorer'}.
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 16 }}>
                You're an <strong style={{ color: 'var(--ink-2)' }}>Explorer</strong> at {communityName}. Browse and meet people — sign the values to unlock the full community.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { num: '01', name: 'Community Network', desc: `${memberCount} residents and explorers`, color: 'var(--m1)', href: '/network' },
                  { num: '04', name: 'Project Blueprint', desc: overall !== null ? `${overall.toFixed(1)}/10 readiness · ${currentPhaseIdx >= 0 ? phaseProgress[currentPhaseIdx].name : 'In progress'}` : 'Blueprint in progress', color: 'var(--m4)', href: '/blueprint' },
                  { num: '05', name: 'Join the community', desc: '3 steps · Sign the values', color: 'var(--m5)', cta: true, href: '/join' },
                  { num: '06', name: 'Agreements', desc: `${activeProjectCount} open project${activeProjectCount !== 1 ? 's' : ''}`, color: 'var(--m6)', href: '/agreements' },
                  { num: '07', name: 'Operations', desc: `${activeProjectCount} active project${activeProjectCount !== 1 ? 's' : ''}`, color: 'var(--m7)', href: '/ops' },
                  { num: '09', name: 'Governance', desc: 'Proposals · consent rounds', color: 'var(--m9)', href: '/dashboard' },
                ].map((c, i) => (
                  <Link key={i} href={c.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      position: 'relative', overflow: 'hidden',
                      background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 8,
                      padding: '11px 12px', cursor: 'pointer',
                      transition: 'box-shadow 140ms, transform 140ms',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 2 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: c.color }}>M{c.num}</span>
                        {c.cta
                          ? <span style={{ fontSize: 9, fontWeight: 700, background: c.color, color: '#fff', padding: '1px 7px', borderRadius: 20 }}>Start</span>
                          : <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-4)' }}>↗</span>}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>{c.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── M01 — Community Network ──────────────────────────── */}
      <section style={sectionW} id="meet">
        <Split>
          <SectionHead
            mod="01" label="Community Network" color="var(--m1)"
            h="Meet the people gathering around this idea."
            lead="Before anything is built, the right people have to find each other. Browse rich profiles of every resident and explorer — sorted by how well your offers, seeks, values, and skills line up."
            href="/network"
            why={[
              '<strong>Real profiles, not posts.</strong> What you bring, what you need, where you\'re headed.',
              '<strong>AI match score</strong> across values, skills, personality, and goals — not just keywords.',
              '<strong>Travel plans</strong> so you can connect IRL — visit a community before you commit.',
            ]}
          />
          <DemoCard>
            <DemoHead color="var(--m1)" modLabel="M01" title="Residents · Top matches" meta={`${memberCount} members`} href="/network" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members.length > 0 ? members.map((m, i) => {
                const fullName = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.username || 'Member'
                const location = [m.city, m.country].filter(Boolean).join(', ')
                const avatarColors = ['var(--m1)', 'var(--m4)', 'var(--m9)', 'var(--m5)']
                const card = (
                  <div style={{
                    display: 'flex', gap: 10, padding: '10px 12px',
                    background: 'var(--bg-2)', borderRadius: 8, alignItems: 'flex-start',
                    transition: 'background 120ms',
                  }} className="sh-nav-item">
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: m.avatar_url ? 'transparent' : avatarColors[i % avatarColors.length],
                      display: 'grid', placeItems: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden',
                    }}>
                      {m.avatar_url ? <img src={m.avatar_url} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(fullName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{fullName}</span>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                          background: 'color-mix(in srgb, var(--m1) 12%, transparent)',
                          color: 'var(--m1)', padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                        }}>{82 - i * 8}% match</span>
                      </div>
                      {m.headline && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 2 }}>{m.headline}</div>}
                      {location && <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>📍 {location}</div>}
                    </div>
                  </div>
                )
                return m.username
                  ? <Link key={m.id} href={`/u/${m.username}`} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link>
                  : <div key={m.id}>{card}</div>
              }) : (
                <p style={{ fontSize: 12.5, color: 'var(--ink-4)', margin: 0, textAlign: 'center', padding: '12px 0' }}>
                  No members yet — be the first to join.
                </p>
              )}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--rule)', textAlign: 'right' }}>
              <Link href="/network" style={{ fontSize: 12.5, color: 'var(--m1)', fontWeight: 600, textDecoration: 'none' }}>View all members →</Link>
            </div>
          </DemoCard>
        </Split>
      </section>

      {/* ── M04 — Blueprint ─────────────────────────────────── */}
      <section style={sectionW} id="blueprint">
        <Split reverse>
          <DemoCard>
            <div ref={bpRef}>
              <DemoHead color="var(--m4)" modLabel="M04" title={`Blueprint · ${communityName}`} meta={overall !== null ? `${overall.toFixed(1)}/10` : 'In progress'} href="/blueprint" />
              {/* Phase tracker */}
              {phaseProgress.length > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                    {phaseProgress.map((ph, i) => {
                      const isDone = ph.ratio >= 1
                      const isActive = !isDone && ph.ratio > 0
                      const isFirst = i === 0
                      return (
                        <div key={ph.id} style={{
                          padding: '8px 10px', borderRadius: 7, textAlign: 'center',
                          background: isDone ? 'color-mix(in srgb, var(--m4) 12%, var(--surface))' :
                                      isActive ? 'var(--m4)' : 'var(--bg-2)',
                          border: `1px solid ${isDone ? 'color-mix(in srgb, var(--m4) 30%, var(--rule))' : isActive ? 'var(--m4)' : 'var(--rule)'}`,
                          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
                        }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: isDone ? 'var(--m4)' : isActive ? '#fff' : 'var(--ink-4)', marginBottom: 2 }}>
                            {ph.name}
                          </div>
                          <div style={{ fontSize: 9.5, color: isDone ? 'var(--m4)' : isActive ? 'rgba(255,255,255,.8)' : 'var(--ink-4)' }}>
                            {isDone ? '✓ Done' : isActive ? 'Active' : 'Locked'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 10 }}>
                    Phase completion
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {phaseProgress.map((ph, i) => (
                      <div key={ph.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-2)', width: 50, flexShrink: 0 }}>{ph.name}</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--rule)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: PHASE_COLORS[i] ?? 'var(--m4)',
                            width: bpAnimated ? `${ph.ratio * 100}%` : '0%',
                            transition: 'width 1.2s cubic-bezier(.4,1,.4,1)',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', width: 40, textAlign: 'right' }}>
                          {ph.answered}<span style={{ color: 'var(--ink-4)' }}>/{ph.total}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {gatesPassed !== null && currentPhaseIdx >= 0 && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 12,
                      background: 'color-mix(in srgb, var(--m4) 8%, transparent)',
                      color: 'var(--ink-2)', lineHeight: 1.55,
                    }}>
                      <strong style={{ color: 'var(--m4)' }}>Next gate:</strong> Complete the {phaseProgress[currentPhaseIdx]?.name} phase — {phaseProgress[currentPhaseIdx]?.total - phaseProgress[currentPhaseIdx]?.answered} questions remaining.
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--ink-4)', margin: 0 }}>Blueprint not yet started.</p>
              )}
            </div>
          </DemoCard>
          <SectionHead
            mod="04" label="Blueprint" color="var(--m4)"
            h="Read the plan. The whole plan."
            lead="No pitch deck. No marketing site. The Blueprint is the community's living planning document — open, honest, and updated every week. See what's been decided, what's still being worked out, and exactly how ready the project is."
            href="/blueprint"
            why={[
              '<strong>Four phases</strong> — SPARK → PROVE → BUILD → LIVE. You see exactly where the project stands.',
              '<strong>Five pillars</strong> with honest readiness scores — Ecology, Social, Economy, Hardware, Governance.',
              '<strong>Gate checks</strong> between phases — so excitement never outruns reality.',
            ]}
          />
        </Split>
      </section>

      {/* ── M05 — Join + values ─────────────────────────────── */}
      <section style={sectionW} id="join">
        <Split>
          <SectionHead
            mod="05" label="Join" color="var(--m5)"
            h="Joining is signing the values — not paying a fee."
            lead="When you're ready to move from explorer to joining member, you read the community's values and best practices, and mark each one you can stand behind. Skip one? Bring it to the circle. Everything is negotiated, nothing is hidden."
            href="/join"
            why={[
              '<strong>No NDAs, no hidden rules.</strong> What you sign is what\'s in the Blueprint.',
              '<strong>Application reviewed by a real human</strong> — the project leads, not an algorithm.',
              '<strong>Unlocks Agreements, Operations, Contributions, and Governance.</strong>',
            ]}
          />
          <DemoCard>
            <DemoHead color="var(--m5)" modLabel="M05" title="Values & best practices" meta={`${signedCount}/${communityValues.length || 5} signed`} href="/join" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {(communityValues.length > 0 ? communityValues : [
                { id: '1', title: 'Care for the land before yield.', description: 'Decisions are tested against ecological impact first, profit second.', sort_order: 1 },
                { id: '2', title: 'Consent over consensus.', description: 'We seek no objections, not unanimous applause. Move forward if good enough for now.', sort_order: 2 },
                { id: '3', title: "Show up, don't just sign up.", description: 'Logged contributions matter more than promises. Reputation is earned in the doing.', sort_order: 3 },
                { id: '4', title: 'Disagree out loud, decide in writing.', description: 'Bring the hard things to the circle. What we decide goes in the Blueprint.', sort_order: 4 },
                { id: '5', title: 'Leave it better.', description: 'Land, people, money — whatever you touch, leave it more alive than you found it.', sort_order: 5 },
              ]).map((v, i) => (
                <div
                  key={v.id}
                  onClick={() => toggle(i)}
                  role="checkbox"
                  aria-checked={checked[i]}
                  tabIndex={0}
                  onKeyDown={e => e.key === ' ' && toggle(i)}
                  style={{
                    display: 'grid', gridTemplateColumns: '22px 1fr', gap: 12,
                    padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                    border: `1px solid ${checked[i] ? 'color-mix(in srgb, var(--m5) 40%, var(--rule))' : 'var(--rule)'}`,
                    background: checked[i] ? 'color-mix(in srgb, var(--m5) 6%, var(--surface))' : 'var(--surface)',
                    transition: 'background 120ms, border-color 120ms',
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, marginTop: 1,
                    border: `1.5px solid ${checked[i] ? 'var(--m5)' : 'var(--rule)'}`,
                    background: checked[i] ? 'var(--m5)' : 'transparent',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    transition: 'background 120ms',
                  }}>
                    {checked[i] && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><polyline points="5 12 10 17 19 7" /></svg>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{v.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{v.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={isLoggedIn ? '/join' : '/auth/login'}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                fontSize: 13, fontWeight: 700, padding: '11px 0',
                borderRadius: 8, textDecoration: 'none',
                background: allSigned ? 'var(--m5)' : 'var(--bg-2)',
                color: allSigned ? '#fff' : 'var(--ink-3)',
                border: `1px solid ${allSigned ? 'var(--m5)' : 'var(--rule)'}`,
                cursor: 'pointer',
                transition: 'background 150ms',
              }}>
              {allSigned ? 'Submit application →' : `Sign ${(communityValues.length || 5) - signedCount} more to continue`}
            </Link>
          </DemoCard>
        </Split>
      </section>

      {/* ── M06 — Agreements ────────────────────────────────── */}
      <section style={sectionW} id="agreements">
        <Split reverse>
          <DemoCard>
            <DemoHead color="var(--m6)" modLabel="M06" title="Open projects · Propose help" meta={`${projects.length || 3} open`} href="/agreements" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(projects.length > 0 ? projects : [
                { id: 'demo1', title: 'Greywater wetlands install', description: 'Build the reed-bed wetland that handles all household greywater for Cluster A.', needs: ['Earthworks', 'Plumbing', '3 weekends'], open_for_collaborators: true },
                { id: 'demo2', title: 'Funding circle, round 2', description: 'Find 4 more investor-members to close the BUILD-phase capital raise.', needs: ['Network access', 'Pitch help'], open_for_collaborators: false },
                { id: 'demo3', title: 'Onboarding new residents', description: 'Run the application review, host welcome calls, pair newcomers with mentors.', needs: ['Facilitation', 'Hospitality'], open_for_collaborators: true },
              ] as Project[]).map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => { setPickedProject(i); setAgreementSubmitted(false) }}
                  style={{
                    padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                    border: `1px solid ${pickedProject === i ? 'var(--m6)' : 'var(--rule)'}`,
                    background: 'var(--surface)',
                    boxShadow: pickedProject === i ? '0 0 0 3px color-mix(in srgb, var(--m6) 12%, transparent)' : 'none',
                    transition: 'border-color 120ms, box-shadow 120ms',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{p.title}</div>
                    {p.open_for_collaborators && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--m5)', flexShrink: 0, marginLeft: 8 }}>● Open</span>
                    )}
                  </div>
                  {p.description && <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.5 }}>{p.description}</p>}
                  {(p.needs ?? []).length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(p.needs ?? []).map(n => (
                        <span key={n} style={{ fontSize: 10.5, color: 'var(--ink-3)', background: 'var(--bg-2)', border: '1px solid var(--rule)', padding: '2px 8px', borderRadius: 20 }}>{n}</span>
                      ))}
                    </div>
                  )}
                  {pickedProject === i && (
                    <div style={{ marginTop: 12, padding: '12px 14px', background: 'color-mix(in srgb, var(--m6) 5%, var(--surface))', borderRadius: 8, border: '1px dashed color-mix(in srgb, var(--m6) 30%, var(--rule))' }}>
                      {agreementSubmitted ? (
                        <div style={{ fontSize: 13, color: 'var(--m5)', fontWeight: 600 }}>✓ Submitted for review. The project lead will respond in 48h.</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--m6)', letterSpacing: '0.08em', marginBottom: 8 }}>YOUR PROPOSAL</div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>What I'll contribute</label>
                            <textarea
                              rows={2}
                              value={contribution}
                              onChange={e => setContribution(e.target.value)}
                              placeholder="Describe your contribution..."
                              style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--rule)', background: 'var(--surface)', color: 'var(--ink)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                            />
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>What I expect in return</label>
                            <input
                              type="text"
                              value={expectation}
                              onChange={e => setExpectation(e.target.value)}
                              placeholder="Points, skills exchange, future residency..."
                              style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--rule)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontFamily: 'inherit' }}
                            />
                          </div>
                          <button
                            onClick={() => setAgreementSubmitted(true)}
                            style={{ width: '100%', fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--m6)', padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer' }}>
                            Send proposal →
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DemoCard>
          <SectionHead
            mod="06" label="Agreements" color="var(--m6)"
            h="Make visible deals on how you'll support."
            lead="Browse every active project — the ones quietly building, the ones loudly hiring. Propose exactly what you'll contribute and exactly what you expect in return. The team reviews it. If accepted, your agreement is live and tracked."
            href="/agreements"
            why={[
              '<strong>Clear scope, clear exchange.</strong> Time, skill, goods, money — write it down.',
              '<strong>Every agreement is public</strong> — no side deals, no resentment.',
              '<strong>Auto-feeds Operations and Contributions</strong> — once accepted, the work shows up everywhere it should.',
            ]}
          />
        </Split>
      </section>

      {/* ── M07 — Operations ────────────────────────────────── */}
      <section style={sectionW} id="ops">
        <Split>
          <SectionHead
            mod="07" label="Operations" color="var(--m7)"
            h="See every promise. Watch every deliverable."
            lead="A community lives or dies by what gets done. Operations turns every active agreement into visible deliverables — who owns it, when it's due, and whether it's actually happening. No surprises at the next meeting."
            href="/ops"
            why={[
              '<strong>Live status of every project</strong> — pulled from agreements, not status meetings.',
              '<strong>Timeline updates</strong> from project leads, threaded into the dashboard.',
              '<strong>Drift detection</strong> — when something slips, the community sees it before it becomes a crisis.',
            ]}
          />
          <DemoCard>
            <DemoHead color="var(--m7)" modLabel="M07" title={`${communityName} · This sprint`} meta="Operations" href="/ops" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { n: activeProjectCount, l: 'Active projects' },
                { n: deliverables.length, l: 'Deliverables' },
                { n: deliverables.filter(d => d.status === 'done').length, l: 'Completed' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--bg-2)', borderRadius: 8 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--m7)', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 8 }}>
              Latest deliverables
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(deliverables.length > 0 ? deliverables : [
                { id: '1', title: 'Soil tests at plots B, C, D', status: 'done', due_date: null },
                { id: '2', title: 'Greywater permit application', status: 'done', due_date: null },
                { id: '3', title: 'Reed-bed trench, Cluster A', status: 'in_progress', due_date: 'Jun 7' },
                { id: '4', title: 'Founding circle agreement v3', status: 'todo', due_date: 'Jun 12' },
                { id: '5', title: 'Funding circle — round 2 close', status: 'todo', due_date: 'Jun 30' },
              ] as Deliverable[]).slice(0, 5).map((d, i) => {
                const done = d.status === 'done'
                const owner = (d as any).user_profiles?.username
                return (
                  <div key={d.id} style={{
                    display: 'grid', gridTemplateColumns: '20px 1fr auto',
                    gap: 10, padding: '7px 0',
                    borderBottom: i < 4 ? '1px solid var(--rule)' : 'none',
                    alignItems: 'center',
                    opacity: done ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${done ? 'var(--m7)' : 'var(--rule)'}`,
                      background: done ? 'var(--m7)' : 'transparent',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      {done && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" style={{ width: 9, height: 9 }}><polyline points="5 12 10 17 19 7" /></svg>}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-2)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4 }}>{d.title}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: d.due_date && new Date(d.due_date) < new Date() && !done ? '#dc2626' : 'var(--ink-4)' }}>
                      {owner ? `@${owner}` : d.due_date ?? ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Link href="/ops" style={{ fontSize: 12.5, color: 'var(--m7)', fontWeight: 600, textDecoration: 'none' }}>View all operations →</Link>
            </div>
          </DemoCard>
        </Split>
      </section>

      {/* ── M08 — Contributions ─────────────────────────────── */}
      <section style={sectionW} id="contributions">
        <Split reverse>
          <DemoCard>
            <DemoHead color="var(--m8)" modLabel="M08" title="Your contribution log" meta="Top 25% · Sprint" href="/dashboard" />
            <div style={{
              background: 'linear-gradient(135deg, var(--m8), color-mix(in srgb, var(--m8) 60%, #000))',
              borderRadius: 10, padding: '18px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>275</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 3, marginBottom: 10 }}>Points this sprint</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginBottom: 8 }}>3 badges earned · Builder · Welcomer · Funder</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['🪨', '🤝', '💰', '🌿', '⚖️', '✦'].map((b, i) => (
                  <span key={i} style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.15)',
                    display: 'grid', placeItems: 'center', fontSize: 14, opacity: i < 3 ? 1 : 0.3,
                  }}>{b}</span>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 6 }}>Recent log</div>
            {[
              { what: 'Reed-bed trench day 1', pts: 120, when: 'May 18' },
              { what: 'Welcome call for 4 explorers', pts: 40, when: 'May 14' },
              { what: 'Soil-test help, Plot C', pts: 30, when: 'May 11' },
              { what: 'Funding-circle pitch deck', pts: 60, when: 'May 06' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--rule)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--bg-2) 50%, transparent)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{r.what}</span>
                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>{r.when}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--m8)' }}>+{r.pts}</span>
                </div>
              </div>
            ))}
          </DemoCard>
          <SectionHead
            mod="08" label="Contributions" color="var(--m8)"
            h="Log your effort. The community sees it. You're rewarded."
            lead="Volunteer work goes invisible. Not here. Log every hour, every facilitated meeting, every batch of bread. Earn points, unlock badges, build a reputation that means something beyond this project."
            href="/dashboard"
            why={[
              '<strong>Points</strong> for time, energy, and resources brought to community work.',
              '<strong>Badges</strong> for milestones — first build day, first funding round, first conflict mediated.',
              '<strong>Reputation that travels</strong> — across the Hive, to future communities.',
            ]}
          />
        </Split>
      </section>

      {/* ── M09 — Governance ────────────────────────────────── */}
      <section style={sectionW} id="governance">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionHead
            mod="09" label="Governance" color="var(--m9)"
            h="Decide together. Four layers, one community."
            lead="Big questions, small calls, technical judgments, and impossible deadlocks — each deserves a different decision tool. The Governance module gives you four layered modes and one AI facilitator that knows when to use which."
            href="/dashboard"
            why={[
              '<strong>Sociocracy</strong> for everyday decisions — no objections means go.',
              '<strong>Democracy</strong> for big shared choices — open vote, public results.',
              '<strong>AI-mediated facilitation</strong> — when things stall, surfaces the next move.',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 28 }}>
            {GOV_LAYERS.map((l, i) => (
              <div
                key={i}
                onClick={() => setGovLayer(i)}
                style={{
                  padding: '16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${govLayer === i ? 'var(--m9)' : 'var(--rule)'}`,
                  background: 'var(--surface)',
                  boxShadow: govLayer === i ? '0 0 0 3px color-mix(in srgb, var(--m9) 12%, transparent)' : 'none',
                  transition: 'border-color 120ms, box-shadow 120ms',
                }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{l.mark}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 4 }}>LAYER {l.num}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{l.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{l.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, padding: '20px 22px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
              Proposal · "Approve $24k for reed-bed wetland materials"
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
              Decision mode: <strong style={{ color: 'var(--ink-2)' }}>{GOV_LAYERS[govLayer].name}</strong> · Opened by @priya · 2 days left · {yesV + conV + noV} of 19 residents have voted
            </div>
            <div style={{ display: 'flex', height: 30, borderRadius: 6, overflow: 'hidden', marginBottom: 12, gap: 2 }}>
              <div style={{ flex: yesV, background: '#22c55e', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff', transition: 'flex 800ms cubic-bezier(.4,1,.4,1)' }}>{yesV} consent</div>
              <div style={{ flex: conV, background: '#f59e0b', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff', transition: 'flex 800ms cubic-bezier(.4,1,.4,1)' }}>{conV}</div>
              <div style={{ flex: noV,  background: '#ef4444', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff', transition: 'flex 800ms cubic-bezier(.4,1,.4,1)' }}>{noV}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {([['yes', '✓ I consent', '#22c55e'], ['concern', '⚠ I have a concern', '#f59e0b'], ['no', '✗ I object', '#ef4444']] as const).map(([v, label, c]) => (
                <button
                  key={v}
                  onClick={() => setVote(vote === v ? null : v)}
                  style={{
                    padding: '9px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer', transition: 'background 150ms, color 150ms',
                    border: `1px solid ${vote === v ? c : 'var(--rule)'}`,
                    background: vote === v ? c : 'var(--surface)',
                    color: vote === v ? '#fff' : 'var(--ink-2)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            {vote === 'concern' && (
              <div style={{
                marginTop: 12, padding: '10px 12px', borderRadius: 8, fontSize: 12,
                background: 'color-mix(in srgb, var(--m9) 6%, transparent)',
                border: '1px dashed color-mix(in srgb, var(--m9) 30%, var(--rule))',
                color: 'var(--ink-2)', lineHeight: 1.55,
              }}>
                <strong>Concerns block nothing</strong> — they go on the record and trigger a 24h check-in before final tally. The AI facilitator will summarize concerns to the proposer.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────── */}
      <section style={{ maxWidth: 880, margin: '80px auto 0', padding: '0 28px' }}>
        <div style={{
          padding: '56px 40px', borderRadius: 18, textAlign: 'center',
          background: 'var(--bg-2)',
          border: '1px solid var(--rule)',
          backgroundImage: 'radial-gradient(ellipse at 50% -30%, color-mix(in srgb, var(--accent-color) 10%, transparent), transparent 70%)',
        }}>
          <h2 style={{
            fontFamily: 'var(--display)', fontSize: 'clamp(26px, 4vw, 40px)',
            color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.015em', marginBottom: 16,
          }}>
            Ready to step into the clubhouse, {name}?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: '48ch', margin: '0 auto 28px' }}>
            You don't have to decide today. Read the Blueprint. Meet a resident. Visit. Talk.
            When you're ready, sign the values — and start showing up.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
            <Link href={isLoggedIn ? '/join' : '/auth/login'} style={{
              fontSize: 14, fontWeight: 700, color: '#fff',
              background: 'var(--ink)', padding: '12px 26px', borderRadius: 9, textDecoration: 'none',
            }}>
              Begin joining →
            </Link>
            <Link href="/network" style={{
              fontSize: 14, fontWeight: 600, color: 'var(--ink)',
              background: 'var(--surface)', border: '1px solid var(--rule)',
              padding: '12px 26px', borderRadius: 9, textDecoration: 'none',
            }}>
              Just browse first
            </Link>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)' }}>
            MyCoNet · MyCommunityNetwork · Regenerative Neighborhood Framework · v2.0
          </div>
        </div>
      </section>

    </div>
  )
}

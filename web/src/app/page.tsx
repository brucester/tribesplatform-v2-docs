import Link from 'next/link'
import { MODULES } from '@/lib/modules'

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--accent)', background: 'var(--accent-soft)',
          padding: '4px 12px', borderRadius: 20, marginBottom: 24,
        }}>
          MyCoNet
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(36px, 6vw, 60px)',
          lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 20,
        }}>
          Build regenerative<br />communities together.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
          A 14-module platform supporting the entire lifecycle of regenerative community development —
          from finding your people to governing and sustaining your neighborhood.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" className="hero-btn hero-btn-primary">
            Create your profile
          </Link>
          <Link href="/network" className="hero-btn hero-btn-secondary">
            Browse the network
          </Link>
        </div>
      </section>

      {/* Module grid */}
      <section style={{
        background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)',
        padding: '56px 24px',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8, color: 'var(--ink)' }}>
              14 modules. One platform.
            </h2>
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
              Each module operates independently and shares the same database.
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 14, fontFamily: 'var(--mono)', fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                Live now
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rule)', border: '1px solid var(--ink-4)', display: 'inline-block', marginLeft: 10 }} />
                Coming soon
              </span>
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 12,
          }}>
            {MODULES.map(m => {
              const badge = m.version ? (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: m.color, padding: '2px 7px', borderRadius: 20 }}>
                  {m.version}
                </span>
              ) : m.live ? (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: 'var(--accent-color)', padding: '2px 7px', borderRadius: 20 }}>
                  Live
                </span>
              ) : (
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', background: 'var(--bg-2)', padding: '2px 7px', borderRadius: 20, border: '1px solid var(--rule)' }}>
                  Soon
                </span>
              )

              const inner = (
                <div id={`module-${m.num}`} style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--rule)',
                  borderTop: `3px solid ${m.color}`, padding: '14px 14px 12px',
                  display: 'flex', flexDirection: 'column', gap: 6, height: '100%',
                  transition: 'box-shadow 120ms, transform 120ms',
                  cursor: m.href ? 'pointer' : 'default', position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: m.color, letterSpacing: '0.06em' }}>
                      M{m.num}
                    </span>
                    {badge}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.55, flexGrow: 1 }}>{m.desc}</div>
                  <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${m.color}40, ${m.color}10)`, marginTop: 6 }} />
                </div>
              )

              if (m.href) {
                return (
                  <a key={m.num} href={m.href}
                    target={m.external ? '_blank' : undefined}
                    rel={m.external ? 'noopener noreferrer' : undefined}
                    style={{ display: 'block', height: '100%', textDecoration: 'none' }}
                    className="module-card-link">
                    {inner}
                  </a>
                )
              }
              return <div key={m.num} style={{ height: '100%' }}>{inner}</div>
            })}
          </div>
        </div>
      </section>

      {/* Profile layers */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 12 }}>Your profile, in three layers</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>Each layer helps the matching system surface the right people and places.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {([
              { emoji: '🌱', label: 'What you offer', desc: 'Skills, land, funding, labor, expertise. Post what you bring so communities and co-founders can find you.', examples: ['Permaculture design', 'Natural building', 'Land in Oaxaca', 'Investment capital'] },
              { emoji: '🔍', label: 'What you seek', desc: "The community type, the skills, the resources, the people you're looking for right now.", examples: ['Co-founders for Costa Rica', 'NVC facilitation', 'Land partner'] },
              { emoji: '✈️', label: "Where you're headed", desc: 'Post your travel plans with dates. Connect with people and communities in places you visit.', examples: ['Tlaxcala, March 2026', 'Bali, May-June', 'Open to anywhere'] },
            ] as const).map(c => (
              <div key={c.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--rule)', padding: '28px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.emoji}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 10 }}>{c.label}</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 16 }}>{c.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.examples.map(e => (
                    <span key={e} style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 20, background: 'var(--bg-2)', color: 'var(--ink-2)', border: '1px solid var(--rule)' }}>{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--rule)', padding: '28px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
        MyCoNet · MyCommunityNetwork · Regenerative Neighborhood Framework · Open Sourced by The Regen Tribe Collective
      </footer>
    </div>
  )
}

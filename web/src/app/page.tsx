import Link from 'next/link'
import { MODULES } from '@/lib/modules'

const LIVE_MODULES = MODULES.filter(m => m.live)
const SOON_MODULES = MODULES.filter(m => !m.live)

export default function LandingPage() {
  return (
    <div>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--accent)', background: 'var(--accent-soft)',
          padding: '4px 14px', borderRadius: 20, marginBottom: 28,
        }}>
          MyCoNet · MyCommunityNetwork
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(38px, 6vw, 64px)',
          lineHeight: 1.04, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 24,
        }}>
          You want to live<br />differently.<br />
          <span style={{ color: 'var(--accent)' }}>We built the tools.</span>
        </h1>
        <p style={{ fontSize: 16.5, color: 'var(--ink-2)', lineHeight: 1.75, maxWidth: 580, margin: '0 auto 40px' }}>
          MyCoNet is a living platform for people building regenerative neighborhoods — from the very first
          conversation through community governance and daily life together. Eight modules are live today.
          More arrive every quarter.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" className="hero-btn hero-btn-primary">
            Create your free profile
          </Link>
          <Link href="/network" className="hero-btn hero-btn-secondary">
            Browse the network
          </Link>
        </div>
      </section>

      {/* ── Journey / Story ── */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 34, marginBottom: 12, color: 'var(--ink)' }}>
              Your path, from idea to neighborhood
            </h2>
            <p style={{ color: 'var(--ink-3)', fontSize: 15, maxWidth: 540, margin: '0 auto' }}>
              Most people who want to live in community don't fail because the idea was wrong —
              they fail because they couldn't find the right people, make a solid plan, or hold it together.
              MyCoNet is built to solve all three.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
            {([
              {
                step: '01',
                color: '#92400e',
                title: 'Find your people',
                body: 'Build a rich profile — who you are, what you offer, what you seek, and where you\'re headed. The network surfaces compatible explorers, vision holders, and resource providers from across the movement. Browse profiles, post your skills, or announce travel plans to connect IRL.',
              },
              {
                step: '02',
                color: '#ca8a04',
                title: 'Build the plan together',
                body: 'The Blueprint guides your group through the SPARK → PROVE → BUILD → LIVE phases. Each step asks the hard questions: land viability, ecological fit, governance model, funding strategy. Pillar scores and readiness gates tell you exactly where you stand — and what to tackle next.',
              },
              {
                step: '03',
                color: '#15803d',
                title: 'Apply and arrive',
                body: 'When a community is ready for new members, the Join module handles applications, review, and onboarding. Current members and leads see the queue. Applicants get status updates. No spreadsheets, no lost emails — just a clear, human process.',
              },
              {
                step: '04',
                color: '#1d4ed8',
                title: 'Work on it every day',
                body: 'Agreements lets members propose collaborations, trade skills, and make visible commitments. Operations tracks the active work — projects, updates, and who\'s doing what. Your dashboard brings it all together: your profile, the community\'s pulse, and everything that needs your attention.',
              },
            ]).map(c => (
              <div key={c.step} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--rule)', borderTop: `3px solid ${c.color}`,
                padding: '28px 24px',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: c.color, marginBottom: 10 }}>
                  STEP {c.step}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--ink)', marginBottom: 12 }}>{c.title}</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.7 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's live ── */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 30, marginBottom: 8, color: 'var(--ink)' }}>
              Live now — {LIVE_MODULES.length} active modules
            </h2>
            <p style={{ color: 'var(--ink-3)', fontSize: 14, maxWidth: 520 }}>
              Each module is independent but shares the same network, profiles, and community data.
              Log in once — everything is connected.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 48 }}>
            {LIVE_MODULES.map(m => {
              const inner = (
                <div style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--rule)', borderTop: `3px solid ${m.color}`,
                  padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6,
                  height: '100%', transition: 'box-shadow 120ms, transform 120ms',
                  cursor: m.href ? 'pointer' : 'default',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: m.color, letterSpacing: '0.06em' }}>
                      M{m.num}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: m.color, padding: '2px 7px', borderRadius: 20 }}>
                      {m.version ?? 'Live'}
                    </span>
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

          {/* Coming soon */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 6, color: 'var(--ink)' }}>
              Coming next — {SOON_MODULES.length} modules in development
            </h3>
            <p style={{ color: 'var(--ink-3)', fontSize: 13.5, marginBottom: 20 }}>
              Governance, contribution tracking, AI guides, inter-community collaboration, and more.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {SOON_MODULES.map(m => (
              <div key={m.num} style={{
                background: 'var(--bg-2)', borderRadius: 'var(--radius)',
                border: '1px solid var(--rule)', padding: '14px 14px 12px',
                display: 'flex', flexDirection: 'column', gap: 5, opacity: 0.72,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: m.color, letterSpacing: '0.06em' }}>
                    M{m.num}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink-4)', background: 'var(--bg-2)', padding: '2px 7px', borderRadius: 20, border: '1px solid var(--rule)' }}>
                    Soon
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.3 }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.55 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Profile layers ── */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 12 }}>
              A profile built for community life
            </h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
              Unlike a social network, your MyCoNet profile is designed to make you discoverable
              for real collaboration — not likes.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {([
              {
                icon: '🌱',
                label: 'What you offer',
                desc: 'Skills, land, funding, tools, labor, expertise. Post what you bring to the table so communities and co-founders can find you.',
                examples: ['Permaculture design', 'Natural building', 'Land in Oaxaca', 'Investment capital'],
              },
              {
                icon: '🔍',
                label: 'What you seek',
                desc: "The community type, the skills, the partners, the resources you're actively looking for right now.",
                examples: ['Co-founders for Costa Rica', 'NVC facilitation', 'Land partner', 'Funding circle'],
              },
              {
                icon: '✈️',
                label: "Where you're headed",
                desc: 'Share your travel plans. Connect with people and communities in the places you visit before you arrive.',
                examples: ['Tlaxcala, March 2026', 'Bali, May–June', 'Open to anywhere'],
              },
            ] as const).map(c => (
              <div key={c.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--rule)', padding: '28px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 10 }}>{c.label}</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 16 }}>{c.desc}</p>
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

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 34, marginBottom: 16, color: 'var(--ink)' }}>
            Ready to find your people?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 36 }}>
            Create a free profile, browse the network, and start connecting with the people
            building the neighborhoods we all want to live in.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" className="hero-btn hero-btn-primary">
              Join for free
            </Link>
            <Link href="/blueprint" className="hero-btn hero-btn-secondary">
              View the community blueprint
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--rule)', padding: '28px 24px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 11.5, letterSpacing: '0.04em' }}>
        MyCoNet · MyCommunityNetwork · Regenerative Neighborhood Framework · Open sourced by The Regen Tribe Collective
      </footer>
    </div>
  )
}

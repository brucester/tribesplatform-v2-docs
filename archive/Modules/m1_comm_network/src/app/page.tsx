import Link from 'next/link'

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        maxWidth: 800, margin: '0 auto', padding: '80px 24px 64px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--accent)', background: 'var(--accent-soft)',
          padding: '4px 12px', borderRadius: 20, marginBottom: 24,
        }}>
          Regen Tribe Network
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(36px, 6vw, 64px)',
          lineHeight: 1.05, letterSpacing: '-0.02em',
          color: 'var(--ink)', marginBottom: 24,
        }}>
          Find your people.<br />Build your place.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
          A network for people co-creating regenerative neighborhoods. Share what you offer, what
          you&apos;re seeking, where you&apos;re headed — and find the people and communities that fit.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            fontSize: 15, padding: '13px 28px', borderRadius: 10,
          }}>
            Create your profile →
          </Link>
          <Link href="/discover" style={{
            background: 'var(--surface)', color: 'var(--ink-2)', fontWeight: 500,
            fontSize: 15, padding: '13px 28px', borderRadius: 10,
            border: '1px solid var(--rule)',
          }}>
            Browse the network
          </Link>
        </div>
      </section>

      {/* Three layers */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 12 }}>Your profile, in three layers</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>Each layer helps you find the right match — person or place.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {([
              {
                emoji: '🌱', label: 'What you offer',
                desc: 'Skills, land, funding, labor, expertise. Post what you bring so communities and co-founders can find you.',
                examples: ['Permaculture design', 'Natural building', 'Land in Oaxaca', 'Legal / governance', 'Investment capital'],
                tagClass: 'tag-offer',
              },
              {
                emoji: '🔍', label: 'What you seek',
                desc: "The community type, the skills, the resources, the people you're looking for right now.",
                examples: ['Co-founders for Costa Rica', 'Short-term visit', 'NVC facilitation', 'Land partner', 'Investors'],
                tagClass: 'tag-request',
              },
              {
                emoji: '✈️', label: "Where you're headed",
                desc: 'Post your travel plans with dates. Connect with people and communities in the places you visit.',
                examples: ['Tlaxcala, March 2026', 'Bali, May–June', 'Portugal coast, Summer', 'Open to anywhere'],
                tagClass: '',
              },
            ] as const).map(c => (
              <div key={c.label} style={{
                background: 'var(--bg)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--rule)', padding: '28px 24px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.emoji}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 10 }}>{c.label}</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 16 }}>{c.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.examples.map(e => (
                    <span key={e} className={`tag-chip ${c.tagClass}`}>{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community roles */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 16 }}>Start or join a community project</h2>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 40 }}>
            Any member can start a community project and invite co-creators, residents, guests, and followers.
            Projects link directly to the Regenerative Neighborhood Framework Wizard — a guided planning tool for every layer.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 560, margin: '0 auto 40px' }}>
            {[
              { role: 'Co-creator', desc: 'Founding team. Full access to the framework wizard and all planning tools.' },
              { role: 'Resident', desc: 'Committed to living there. Can contribute to plans and community discussions.' },
              { role: 'Guest', desc: 'Interested in visiting. Sees public profile and can request a stay.' },
              { role: 'Follower', desc: 'Watching the project. Gets updates as the community advances phases.' },
            ].map(r => (
              <div key={r.role} style={{
                background: 'var(--surface)', border: '1px solid var(--rule)',
                borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--accent)' }}>{r.role}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/signup" style={{
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            fontSize: 14, padding: '12px 24px', borderRadius: 10,
          }}>
            Create a free account to start
          </Link>
        </div>
      </section>

      <footer style={{
        borderTop: '1px solid var(--rule)', padding: '32px 24px',
        textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5,
      }}>
        Regen Tribe · Regenerative Neighborhood Framework v2.0 · Open Sourced by The Regen Tribe Collective =]
      </footer>
    </div>
  )
}

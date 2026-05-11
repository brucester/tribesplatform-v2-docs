import Link from 'next/link'

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--accent)', background: 'var(--accent-soft)',
          padding: '4px 12px', borderRadius: 20, marginBottom: 24,
        }}>
          Tribes Platform v2
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(36px, 6vw, 64px)',
          lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 24,
        }}>
          Build regenerative<br />communities together.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px' }}>
          A platform for people co-creating regenerative neighborhoods. Find your people, plan your
          community with proven frameworks, and build something that lasts.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            fontSize: 15, padding: '13px 28px', borderRadius: 10,
          }}>
            Create your profile
          </Link>
          <Link href="/network" style={{
            background: 'var(--surface)', color: 'var(--ink-2)', fontWeight: 500,
            fontSize: 15, padding: '13px 28px', borderRadius: 10,
            border: '1px solid var(--rule)',
          }}>
            Browse the network
          </Link>
        </div>
      </section>

      {/* Two module cards */}
      <section style={{
        background: 'var(--surface)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 32, marginBottom: 12 }}>Two tools, one platform</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>Connected by the same account, design, and database.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {([
              {
                icon: '🌐',
                label: 'Community Network',
                href: '/network',
                color: 'var(--accent)',
                colorSoft: 'var(--accent-soft)',
                desc: 'Discover people building regenerative lives. Share what you offer and what you seek. Get AI-powered match scores based on values, skills, personality, and MBTI.',
                cta: 'Browse the network',
                tags: ['Profiles', 'Match scoring', 'Discover', 'Connections'],
              },
              {
                icon: '🗺',
                label: 'Blueprint Wizard',
                href: '/blueprint',
                color: 'var(--rcos)',
                colorSoft: 'rgba(139,92,246,0.08)',
                desc: 'Plan your community with the Regenerative Neighborhood Framework. Walk through SPARK, PROVE, BUILD, and LIVE phases with guided questions and milestone gates.',
                cta: 'Open the wizard',
                tags: ['SPARK', 'PROVE', 'BUILD', 'LIVE'],
              },
            ]).map(m => (
              <div key={m.label} style={{
                background: 'var(--bg)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--rule)', padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ fontSize: 32 }}>{m.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 10, color: m.color }}>{m.label}</div>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>{m.desc}</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                      background: m.colorSoft, color: m.color, border: `1px solid ${m.color}30`,
                    }}>{t}</span>
                  ))}
                </div>
                <Link href={m.href} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, color: m.color,
                  background: m.colorSoft, padding: '9px 16px', borderRadius: 'var(--radius)',
                  border: `1px solid ${m.color}30`, marginTop: 'auto', alignSelf: 'flex-start',
                }}>
                  {m.cta} &rarr;
                </Link>
              </div>
            ))}
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
              {
                emoji: '🌱', label: 'What you offer',
                desc: 'Skills, land, funding, labor, expertise. Post what you bring so communities and co-founders can find you.',
                examples: ['Permaculture design', 'Natural building', 'Land in Oaxaca', 'Investment capital'],
                tagClass: 'tag-offer',
              },
              {
                emoji: '🔍', label: 'What you seek',
                desc: "The community type, the skills, the resources, the people you're looking for right now.",
                examples: ['Co-founders for Costa Rica', 'NVC facilitation', 'Land partner'],
                tagClass: 'tag-request',
              },
              {
                emoji: '✈️', label: 'Where you\'re headed',
                desc: 'Post your travel plans with dates. Connect with people and communities in places you visit.',
                examples: ['Tlaxcala, March 2026', 'Bali, May-June', 'Open to anywhere'],
                tagClass: '',
              },
            ] as const).map(c => (
              <div key={c.label} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
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

      <footer style={{
        borderTop: '1px solid var(--rule)', padding: '32px 24px',
        textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5,
      }}>
        Tribes Platform v2 &middot; Regenerative Neighborhood Framework &middot; Open Sourced by The Regen Tribe Collective
      </footer>
    </div>
  )
}

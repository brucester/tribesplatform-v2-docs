import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const TYPE_LABELS: Record<string, string> = {
  founder: 'Founder', builder: 'Builder', investor: 'Investor',
  designer: 'Designer', technologist: 'Technologist', farmer: 'Farmer',
  educator: 'Educator', healer: 'Healer', artist: 'Artist',
  researcher: 'Researcher', parent: 'Parent', elder: 'Elder',
}

const ARCHETYPE_LABELS: Record<string, string> = {
  pioneer: 'Pioneer', catalyst: 'Catalyst', weaver: 'Weaver',
  builder: 'Builder', guardian: 'Guardian', mystic: 'Mystic',
  sage: 'Sage', alchemist: 'Alchemist',
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // First get the profile to get user_id
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Parallel fetch of all secondary data
  const [bioRes, offersRes, requestsRes, travelRes] = await Promise.all([
    supabase.from('user_bio').select('*').eq('user_id', profile.user_id).single(),
    supabase.from('user_offers').select('*').eq('user_id', profile.user_id),
    supabase.from('user_requests').select('*').eq('user_id', profile.user_id),
    supabase.from('user_travel_plans').select('*').eq('user_id', profile.user_id),
  ])

  const bio = bioRes.data
  const offers = offersRes.data ?? []
  const requests = requestsRes.data ?? []
  const travelPlans = travelRes.data ?? []
  const isOwn = user?.id === profile.user_id
  const initial = (profile.display_name ?? profile.username ?? '?')[0].toUpperCase()

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>{initial}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>
              {profile.display_name ?? profile.username}
            </h1>
            {profile.status && <span className={`status-badge status-${profile.status}`}>{profile.status}</span>}
          </div>
          {profile.pronouns && <div style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 4 }}>{profile.pronouns}</div>}
          {profile.location && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 8 }}>📍 {profile.location}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(profile.user_types ?? []).map((t: string) => (
              <span key={t} style={{
                fontSize: 11.5, padding: '3px 9px', borderRadius: 20,
                background: 'var(--surface)', border: '1px solid var(--rule)',
                color: 'var(--ink-3)', fontWeight: 500,
              }}>{TYPE_LABELS[t] ?? t}</span>
            ))}
          </div>
        </div>
        {isOwn && (
          <Link href="/profile/edit" style={{
            fontSize: 13, padding: '7px 14px', borderRadius: 'var(--radius)',
            border: '1px solid var(--rule)', color: 'var(--ink-2)', background: 'var(--surface)',
            textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 500,
          }}>Edit profile</Link>
        )}
      </div>

      {profile.bio && (
        <Section title="About">
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{profile.bio}</p>
        </Section>
      )}

      {bio?.archetypes?.length > 0 && (
        <Section title="Archetypes">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {bio.archetypes.map((a: string) => (
              <span key={a} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                background: 'rgba(139,92,246,0.1)', border: '1.5px solid var(--rcos)',
                color: 'var(--rcos)',
              }}>{ARCHETYPE_LABELS[a] ?? a}</span>
            ))}
            {bio.mbti && (
              <span style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink-2)',
              }}>{bio.mbti}</span>
            )}
          </div>
        </Section>
      )}

      {bio?.values_list?.length > 0 && (
        <Section title="Values">
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {bio.values_list.map((v: string) => (
              <span key={v} style={{
                padding: '5px 11px', borderRadius: 20, fontSize: 12,
                background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
                color: 'var(--alchemy)',
              }}>{v}</span>
            ))}
          </div>
        </Section>
      )}

      {bio?.skills?.length > 0 && (
        <Section title="Skills">
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {bio.skills.map((s: string) => (
              <span key={s} className="tag-chip">{s}</span>
            ))}
          </div>
        </Section>
      )}

      {(bio?.short_term_goal || bio?.long_term_goal || bio?.life_vision) && (
        <Section title="Goals & vision">
          {bio.short_term_goal && <GoalBlock label="Now (1-2 years)" text={bio.short_term_goal} />}
          {bio.long_term_goal && <GoalBlock label="Long-term" text={bio.long_term_goal} />}
          {bio.life_vision && <GoalBlock label="Life vision" text={bio.life_vision} />}
        </Section>
      )}

      {bio?.current_project && (
        <Section title="Current project">
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>{bio.current_project}</p>
        </Section>
      )}

      {offers.length > 0 && (
        <Section title="What they offer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offers.map((o: { id: string; category: string; title: string; description: string }) => (
              <OfferRow key={o.id} category={o.category} title={o.title} description={o.description} />
            ))}
          </div>
        </Section>
      )}

      {requests.length > 0 && (
        <Section title="What they seek">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((r: { id: string; category: string; title: string; description: string }) => (
              <OfferRow key={r.id} category={r.category} title={r.title} description={r.description} />
            ))}
          </div>
        </Section>
      )}

      {travelPlans.length > 0 && (
        <Section title="Travel plans">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {travelPlans.map((t: { id: string; location: string; date_from: string; date_to: string; description: string }) => (
              <div key={t.id} style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
                <span style={{ fontWeight: 600 }}>{t.location}</span>
                {(t.date_from || t.date_to) && (
                  <span style={{ color: 'var(--ink-3)', marginLeft: 8 }}>
                    {t.date_from && new Date(t.date_from).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                    {t.date_from && t.date_to && ' – '}
                    {t.date_to && new Date(t.date_to).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                  </span>
                )}
                {t.description && <span style={{ color: 'var(--ink-3)', marginLeft: 8 }}>· {t.description}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {bio?.life_principles && (
        <Section title="Life principles">
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0, fontStyle: 'italic' }}>
            "{bio.life_principles}"
          </p>
        </Section>
      )}

      {(profile.website_url || profile.instagram) && (
        <Section title="Links">
          <div style={{ display: 'flex', gap: 14 }}>
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13.5, color: 'var(--accent)', textDecoration: 'none' }}>
                Website
              </a>
            )}
            {profile.instagram && (
              <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13.5, color: 'var(--accent)', textDecoration: 'none' }}>
                @{profile.instagram.replace('@', '')}
              </a>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function GoalBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  )
}

function OfferRow({ category, title, description }: { category: string; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{
        fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0, marginTop: 2,
        background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(16,185,129,0.2)',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>{category}</span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-1)' }}>{title}</div>
        {description && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  )
}

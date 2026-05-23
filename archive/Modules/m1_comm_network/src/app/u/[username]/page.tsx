import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { UserOffer, UserRequest, UserTravelPlan } from '@/types/database'

const MBTI_LABELS: Record<string, string> = {
  INTJ: 'Architect', INTP: 'Logician', INFJ: 'Advocate', INFP: 'Mediator',
  ISTJ: 'Logistician', ISTP: 'Virtuoso', ISFJ: 'Defender', ISFP: 'Adventurer',
  ENTJ: 'Commander', ENTP: 'Debater', ENFJ: 'Protagonist', ENFP: 'Campaigner',
  ESTJ: 'Executive', ESTP: 'Entrepreneur', ESFJ: 'Consul', ESFP: 'Entertainer',
}

const STATUS_LABELS: Record<string, string> = {
  looking: 'Actively looking', open: 'Open to connections',
  building: 'Building now', traveling: 'Traveling', settled: 'Settled',
}

const OCEAN_TRAITS = [
  { key: 'ocean_openness',          label: 'Openness',            low: 'Conventional',         high: 'Curious & creative' },
  { key: 'ocean_conscientiousness', label: 'Conscientiousness',   low: 'Spontaneous',          high: 'Organised' },
  { key: 'ocean_extraversion',      label: 'Extraversion',        low: 'Introvert',            high: 'Extravert' },
  { key: 'ocean_agreeableness',     label: 'Agreeableness',       low: 'Direct',               high: 'Harmony-seeking' },
  { key: 'ocean_neuroticism',       label: 'Emotional intensity', low: 'Calm & stable',        high: 'Emotionally intense' },
]

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `${username} · Regen Tribe` }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [{ data: bio }, { data: offers }, { data: requests }, { data: travel }, { data: authUser }] = await Promise.all([
    supabase.from('user_bio').select('*').eq('user_id', profile.id).maybeSingle(),
    supabase.from('user_offers').select('*').eq('user_id', profile.id),
    supabase.from('user_requests').select('*').eq('user_id', profile.id),
    supabase.from('user_travel_plans').select('*').eq('user_id', profile.id).eq('is_public', true),
    supabase.auth.getUser(),
  ])

  const isOwn = authUser.user?.id === profile.id
  const userTypes: string[] = (profile as any).user_types ?? []

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32,
        paddingBottom: 28, borderBottom: '1px solid var(--rule)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent-soft)', border: '2px solid var(--rule)',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: 'var(--accent)',
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name ?? profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (profile.display_name?.[0] ?? profile.username[0]).toUpperCase()
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1.1 }}>
              {profile.display_name ?? profile.username}
            </h1>
            {profile.pronouns && (
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{profile.pronouns}</span>
            )}
            {bio?.mbti && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                padding: '3px 10px', borderRadius: 6,
                background: 'rgba(139,92,246,0.12)', color: 'var(--rcos)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{bio.mbti}</span>
                <span style={{ opacity: 0.7 }}>·</span>
                <span>{MBTI_LABELS[bio.mbti]}</span>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className={`status-badge status-${profile.status}`}>
              {STATUS_LABELS[profile.status]}
            </span>
            {profile.current_location && (
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>📍 {profile.current_location}</span>
            )}
            <span style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>@{profile.username}</span>
          </div>
          {profile.bio && (
            <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 12 }}>{profile.bio}</p>
          )}
          {/* User types */}
          {userTypes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {userTypes.map((t: string) => (
                <span key={t} style={{
                  fontSize: 11.5, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>{t}</span>
              ))}
            </div>
          )}
          {/* Social links */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none' }}>
                🔗 Website
              </a>
            )}
            {profile.instagram_handle && (
              <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none' }}>
                📸 {profile.instagram_handle}
              </a>
            )}
          </div>
        </div>

        {isOwn && (
          <a href="/profile/edit" style={{
            fontSize: 13, color: 'var(--ink-2)', border: '1px solid var(--rule)',
            padding: '7px 14px', borderRadius: 8, background: 'var(--surface)',
            whiteSpace: 'nowrap', fontWeight: 500, flexShrink: 0,
          }}>
            Edit profile
          </a>
        )}
      </div>

      {/* ── Bio / identity ── */}
      {bio && (
        <>
          {/* Archetypes + Values row */}
          {(bio.archetypes?.length > 0 || bio.values_list?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {bio.archetypes?.length > 0 && (
                <ProfileSection title="Archetypes">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {bio.archetypes.map((a: string) => (
                      <Chip key={a} label={a} color="var(--rcos)" />
                    ))}
                  </div>
                </ProfileSection>
              )}
              {bio.values_list?.length > 0 && (
                <ProfileSection title="Values">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {bio.values_list.map((v: string) => (
                      <Chip key={v} label={v} color="var(--alchemy)" />
                    ))}
                  </div>
                </ProfileSection>
              )}
            </div>
          )}

          {/* Life principles */}
          {bio.life_principles && (
            <ProfileSection title="Life principles" mb={20}>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.7, fontStyle: 'italic' }}>
                &ldquo;{bio.life_principles}&rdquo;
              </p>
            </ProfileSection>
          )}

          {/* Goals */}
          {(bio.short_term_goal || bio.long_term_goal || bio.life_vision) && (
            <ProfileSection title="Goals & vision" mb={20}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bio.short_term_goal && (
                  <GoalItem label="Now (1–2 years)" text={bio.short_term_goal} />
                )}
                {bio.long_term_goal && (
                  <GoalItem label="Long-term (3–10 years)" text={bio.long_term_goal} />
                )}
                {bio.life_vision && (
                  <GoalItem label="Life vision" text={bio.life_vision} />
                )}
              </div>
            </ProfileSection>
          )}

          {/* Creative focus */}
          {(bio.current_project || bio.creative_mediums?.length > 0) && (
            <ProfileSection title="Creative focus" mb={20}>
              {bio.current_project && (
                <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 10 }}>
                  <strong>Currently:</strong>{' '}
                  {/^https?:\/\//i.test(bio.current_project) ? (
                    <a href={bio.current_project} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                      {bio.current_project}
                    </a>
                  ) : bio.current_project}
                </p>
              )}
              {bio.creative_mediums?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {bio.creative_mediums.map((m: string) => (
                    <Chip key={m} label={m} color="var(--clips)" />
                  ))}
                </div>
              )}
            </ProfileSection>
          )}

          {/* Skills + Interests row */}
          {(bio.skills?.length > 0 || bio.interests?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {bio.skills?.length > 0 && (
                <ProfileSection title="Skills">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {bio.skills.map((s: string) => (
                      <Chip key={s} label={s} color="var(--accent)" />
                    ))}
                  </div>
                </ProfileSection>
              )}
              {bio.interests?.length > 0 && (
                <ProfileSection title="Interests">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {bio.interests.map((i: string) => (
                      <Chip key={i} label={i} color="var(--governance)" />
                    ))}
                  </div>
                </ProfileSection>
              )}
            </div>
          )}

          {/* OCEAN personality */}
          {(bio.ocean_openness !== null || bio.ocean_conscientiousness !== null) && (
            <ProfileSection title="Personality" mb={20}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OCEAN_TRAITS.map(trait => {
                  const val = (bio as any)[trait.key] ?? 5
                  const pct = ((val - 1) / 9) * 100
                  return (
                    <div key={trait.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{trait.label}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                          {val <= 4 ? trait.low : val >= 7 ? trait.high : 'Balanced'}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--rule)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'var(--accent)', borderRadius: 10,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ProfileSection>
          )}

          {/* Fun facts */}
          {(bio.favorite_color || bio.favorite_animal) && (
            <ProfileSection title="Fun facts" mb={20}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {bio.favorite_color && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🎨</span>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Favourite colour</div>
                      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>{bio.favorite_color}</div>
                    </div>
                  </div>
                )}
                {bio.favorite_animal && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🐾</span>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Favourite animal</div>
                      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>{bio.favorite_animal}</div>
                    </div>
                  </div>
                )}
              </div>
            </ProfileSection>
          )}

          {/* Community fit */}
          {(bio.ideal_community_vibe || bio.open_to_travel) && (
            <ProfileSection title="Community fit" mb={20}>
              {bio.ideal_community_vibe && (
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 8 }}>
                  {bio.ideal_community_vibe}
                </p>
              )}
              {bio.open_to_travel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-3)' }}>
                  <span>✈️ Open to visiting communities</span>
                  {bio.travel_style && <span>· {bio.travel_style}</span>}
                </div>
              )}
            </ProfileSection>
          )}
        </>
      )}

      {/* ── Offers & Requests ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <ProfileSection title="🌱 Offers">
          {offers?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {offers.map((o: UserOffer) => (
                <TagItem key={o.id} category={o.category} title={o.title} desc={o.description} type="offer" />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>No offers yet</p>
          )}
        </ProfileSection>

        <ProfileSection title="🔍 Seeking">
          {requests?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.map((r: UserRequest) => (
                <TagItem key={r.id} category={r.category} title={r.title} desc={r.description} type="request" />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>No requests yet</p>
          )}
        </ProfileSection>
      </div>

      {/* ── Travel plans ── */}
      {travel && travel.length > 0 && (
        <ProfileSection title="✈️ Travel plans" mb={20}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {travel.map((t: UserTravelPlan) => (
              <div key={t.id} style={{
                background: 'var(--bg)', border: '1px solid var(--rule)',
                borderRadius: 'var(--radius)', padding: '12px 14px',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.location}</div>
                {(t.date_from || t.date_to) && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                    {t.date_from && new Date(t.date_from).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                    {t.date_from && t.date_to && ' → '}
                    {t.date_to && new Date(t.date_to).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                  </div>
                )}
                {t.description && <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{t.description}</p>}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {/* ── Connect CTA ── */}
      {!isOwn && (
        <div style={{
          marginTop: 32, padding: '24px', background: 'var(--accent-soft)',
          border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              Connect with {profile.display_name ?? profile.username}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
              Send a connection request with a short intro.
            </div>
          </div>
          <a href="/auth/signup" style={{
            background: 'var(--accent)', color: '#fff',
            fontWeight: 600, fontSize: 14, padding: '10px 20px',
            borderRadius: 8, whiteSpace: 'nowrap',
          }}>
            Connect →
          </a>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProfileSection({ title, children, mb }: {
  title: string; children: React.ReactNode; mb?: number
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      marginBottom: mb ?? 0,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
      background: color + '18', color, border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  )
}

function GoalItem({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
        {label}
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

function TagItem({ category, title, desc, type }: {
  category: string; title: string; desc: string | null; type: 'offer' | 'request'
}) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius)', padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: desc ? 3 : 0 }}>
        <span className={`tag-chip tag-${type}`}>{category}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
      </div>
      {desc && <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 3 }}>{desc}</p>}
    </div>
  )
}

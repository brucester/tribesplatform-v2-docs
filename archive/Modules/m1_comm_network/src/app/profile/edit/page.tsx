'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserStatus } from '@/types/database'

interface EditOffer { id?: string; category: string; title: string; description: string }
interface EditRequest { id?: string; category: string; title: string; description: string }
interface EditTravel { id?: string; location: string; date_from: string; date_to: string; description: string }

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'looking',   label: 'Actively looking' },
  { value: 'open',      label: 'Open to connections' },
  { value: 'building',  label: 'Building now' },
  { value: 'traveling', label: 'Traveling' },
  { value: 'settled',   label: 'Settled' },
]

const USER_TYPES = [
  'Founder / Co-creator', 'Community builder', 'Investor', 'Skilled contributor',
  'Land steward', 'Community seeker', 'Digital nomad', 'Facilitator / Coach',
  'Artist / Creative', 'Healer / Therapist', 'Teacher / Educator', 'Researcher',
]

const ARCHETYPES = [
  'Visionary', 'Builder', 'Healer', 'Weaver', 'Guardian',
  'Teacher', 'Artist', 'Catalyst', 'Nurturer', 'Activist',
]

const VALUES_LIST = [
  'Ecological regeneration', 'Community & belonging', 'Simplicity & sufficiency',
  'Spiritual growth', 'Creative expression', 'Social justice', 'Economic justice',
  'Education & learning', 'Health & wellbeing', 'Autonomy & sovereignty',
  'Collaboration', 'Indigenous wisdom', 'Systems thinking', 'Place-based living',
  'Nonviolence', 'Food sovereignty', 'Open source', 'Decentralisation',
]

const CREATIVE_MEDIUMS = [
  'Writing', 'Music', 'Visual art', 'Film / video', 'Dance / movement',
  'Architecture / design', 'Cooking / food', 'Gardening / land', 'Code / tech',
  'Facilitation', 'Research', 'Teaching', 'Ceremony / ritual',
]

const INTERESTS = [
  'Permaculture', 'Natural building', 'Agroforestry', 'Rewilding', 'Mycology',
  'Renewable energy', 'Water systems', 'Governance & sociocracy', 'NVC',
  'Meditation & mindfulness', 'Somatic practices', 'Psychedelics & integration',
  'Economics & commons', 'Blockchain & web3', 'AI & technology', 'Herbalism',
  'Yoga', 'Martial arts', 'Surfing', 'Rock climbing', 'Dance',
  'Philosophy', 'Anthropology', 'Indigenous cultures', 'Mythology',
]

const OFFER_CATEGORIES = ['skills', 'resources', 'funding', 'space', 'labor', 'expertise']
const REQUEST_CATEGORIES = ['community', 'connection', 'skill', 'resource', 'opportunity']

const MBTI_TYPES: { code: string; label: string }[] = [
  { code: 'INTJ', label: 'Architect' },
  { code: 'INTP', label: 'Logician' },
  { code: 'INFJ', label: 'Advocate' },
  { code: 'INFP', label: 'Mediator' },
  { code: 'ISTJ', label: 'Logistician' },
  { code: 'ISTP', label: 'Virtuoso' },
  { code: 'ISFJ', label: 'Defender' },
  { code: 'ISFP', label: 'Adventurer' },
  { code: 'ENTJ', label: 'Commander' },
  { code: 'ENTP', label: 'Debater' },
  { code: 'ENFJ', label: 'Protagonist' },
  { code: 'ENFP', label: 'Campaigner' },
  { code: 'ESTJ', label: 'Executive' },
  { code: 'ESTP', label: 'Entrepreneur' },
  { code: 'ESFJ', label: 'Consul' },
  { code: 'ESFP', label: 'Entertainer' },
]

const OCEAN_TRAITS = [
  { key: 'ocean_openness',           label: 'Openness',           low: 'Conventional',  high: 'Curious & creative' },
  { key: 'ocean_conscientiousness',  label: 'Conscientiousness',  low: 'Spontaneous',   high: 'Organised & disciplined' },
  { key: 'ocean_extraversion',       label: 'Extraversion',       low: 'Introvert',     high: 'Extravert' },
  { key: 'ocean_agreeableness',      label: 'Agreeableness',      low: 'Direct & independent', high: 'Harmony-seeking' },
  { key: 'ocean_neuroticism',        label: 'Emotional intensity', low: 'Calm & stable', high: 'Emotionally intense' },
]

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Basic
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<UserStatus>('open')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [userTypes, setUserTypes] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Bio / matching
  const [archetypes, setArchetypes] = useState<string[]>([])
  const [valuesList, setValuesList] = useState<string[]>([])
  const [lifePrinciples, setLifePrinciples] = useState('')
  const [ocean, setOcean] = useState({ ocean_openness: 5, ocean_conscientiousness: 5, ocean_extraversion: 5, ocean_agreeableness: 5, ocean_neuroticism: 5 })
  const [shortTermGoal, setShortTermGoal] = useState('')
  const [longTermGoal, setLongTermGoal] = useState('')
  const [lifeVision, setLifeVision] = useState('')
  const [currentProject, setCurrentProject] = useState('')
  const [creativeMediums, setCreativeMediums] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [idealCommunityVibe, setIdealCommunityVibe] = useState('')
  const [dealBreakers, setDealBreakers] = useState('')
  const [openToTravel, setOpenToTravel] = useState(true)
  const [travelStyle, setTravelStyle] = useState('')
  const [mbti, setMbti] = useState<string | null>(null)
  const [favoriteColor, setFavoriteColor] = useState('')
  const [favoriteAnimal, setFavoriteAnimal] = useState('')

  // Lists
  const [offers, setOffers] = useState<EditOffer[]>([])
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [travel, setTravel] = useState<EditTravel[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const [{ data: p }, { data: b }, { data: o }, { data: r }, { data: t }] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_bio').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_offers').select('*').eq('user_id', user.id),
        supabase.from('user_requests').select('*').eq('user_id', user.id),
        supabase.from('user_travel_plans').select('*').eq('user_id', user.id),
      ])

      if (p) {
        setUsername(p.username); setDisplayName(p.display_name ?? '')
        setPronouns(p.pronouns ?? ''); setBio(p.bio ?? '')
        setLocation(p.current_location ?? ''); setStatus(p.status)
        setWebsiteUrl(p.website_url ?? ''); setInstagram(p.instagram_handle ?? '')
        setAvatarUrl(p.avatar_url ?? null)
        setUserTypes((p as any).user_types ?? [])
      }
      if (b) {
        setArchetypes(b.archetypes ?? [])
        setValuesList(b.values_list ?? [])
        setLifePrinciples(b.life_principles ?? '')
        setOcean({
          ocean_openness: b.ocean_openness ?? 5,
          ocean_conscientiousness: b.ocean_conscientiousness ?? 5,
          ocean_extraversion: b.ocean_extraversion ?? 5,
          ocean_agreeableness: b.ocean_agreeableness ?? 5,
          ocean_neuroticism: b.ocean_neuroticism ?? 5,
        })
        setShortTermGoal(b.short_term_goal ?? '')
        setLongTermGoal(b.long_term_goal ?? '')
        setLifeVision(b.life_vision ?? '')
        setCurrentProject(b.current_project ?? '')
        setCreativeMediums(b.creative_mediums ?? [])
        setSkills(b.skills ?? [])
        setInterests(b.interests ?? [])
        setIdealCommunityVibe(b.ideal_community_vibe ?? '')
        setDealBreakers(b.deal_breakers ?? '')
        setOpenToTravel(b.open_to_travel ?? true)
        setTravelStyle(b.travel_style ?? '')
        setMbti(b.mbti ?? null)
        setFavoriteColor(b.favorite_color ?? '')
        setFavoriteAnimal(b.favorite_animal ?? '')
      }
      setOffers((o ?? [{ category: 'skills', title: '', description: '' }]).map((x: any) => ({ id: x.id, category: x.category ?? 'skills', title: x.title ?? '', description: x.description ?? '' })))
      setRequests((r ?? [{ category: 'community', title: '', description: '' }]).map((x: any) => ({ id: x.id, category: x.category ?? 'community', title: x.title ?? '', description: x.description ?? '' })))
      setTravel((t ?? []).map((x: any) => ({ id: x.id, location: x.location ?? '', date_from: x.date_from ?? '', date_to: x.date_to ?? '', description: x.description ?? '' })))
      setLoading(false)
    }
    load()
  }, [])

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      setAvatarUrl(url)
      await supabase.from('user_profiles').update({ avatar_url: url }).eq('id', userId)
    }
    setAvatarUploading(false)
  }

  const toggleItem = (arr: string[], item: string, set: (v: string[]) => void) => {
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput('')
  }

  const save = async () => {
    if (!userId) return
    setSaving(true)

    await supabase.from('user_profiles').update({
      display_name: displayName, pronouns: pronouns || null,
      bio: bio || null, current_location: location || null, status,
      website_url: websiteUrl || null, instagram_handle: instagram || null,
      user_types: userTypes,
    } as any).eq('id', userId)

    await supabase.from('user_bio').upsert({
      user_id: userId,
      archetypes, values_list: valuesList, life_principles: lifePrinciples || null,
      ...ocean,
      short_term_goal: shortTermGoal || null, long_term_goal: longTermGoal || null,
      life_vision: lifeVision || null, current_project: currentProject || null,
      creative_mediums: creativeMediums, skills, interests,
      ideal_community_vibe: idealCommunityVibe || null, deal_breakers: dealBreakers || null,
      open_to_travel: openToTravel, travel_style: travelStyle || null,
      mbti: mbti || null,
      favorite_color: favoriteColor || null,
      favorite_animal: favoriteAnimal || null,
    } as any)

    await supabase.from('user_offers').delete().eq('user_id', userId)
    const validOffers = offers.filter(o => o.title.trim())
    if (validOffers.length)
      await supabase.from('user_offers').insert(validOffers.map(o => ({ user_id: userId, category: o.category, title: o.title, description: o.description || null, tags: null })) as any)

    await supabase.from('user_requests').delete().eq('user_id', userId)
    const validRequests = requests.filter(r => r.title.trim())
    if (validRequests.length)
      await supabase.from('user_requests').insert(validRequests.map(r => ({ user_id: userId, category: r.category, title: r.title, description: r.description || null, tags: null })) as any)

    await supabase.from('user_travel_plans').delete().eq('user_id', userId)
    const validTravel = travel.filter(t => t.location.trim())
    if (validTravel.length)
      await supabase.from('user_travel_plans').insert(validTravel.map(t => ({ user_id: userId, location: t.location, date_from: t.date_from || null, date_to: t.date_to || null, description: t.description || null, is_public: true })) as any)

    setSaving(false)
    router.push(`/u/${username}`)
  }

  if (loading) return <Center>Loading…</Center>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 400 }}>Edit profile</h1>
          <a href={`/u/${username}`} style={{ fontSize: 13, color: 'var(--accent)' }}>← View public profile</a>
        </div>
        <SaveBtn saving={saving} saved={saved} onClick={save} />
      </div>

      {/* ── Basic ── */}
      <Card title="Basic information">
        <AvatarUpload avatarUrl={avatarUrl} displayName={displayName} uploading={avatarUploading}
          fileRef={fileInputRef} onChange={uploadAvatar} />
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }} onChange={uploadAvatar} />

        <TwoCol>
          <Field label="Display name">
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Pronouns">
            <input value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="they/them, she/her…" />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Current location">
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, country or region" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value as UserStatus)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </TwoCol>
        <Field label="Bio" hint="What brings you to regenerative living?">
          <textarea value={bio} rows={4} onChange={e => setBio(e.target.value)}
            placeholder="A few sentences about who you are and where you're heading…" />
        </Field>
        <TwoCol>
          <Field label="Website">
            <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Instagram">
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" />
          </Field>
        </TwoCol>
      </Card>

      {/* ── User types ── */}
      <Card title="I am a…" hint="Select everything that applies to you">
        <ChipGrid items={USER_TYPES} selected={userTypes}
          onToggle={item => toggleItem(userTypes, item, setUserTypes)} color="var(--accent)" />
      </Card>

      {/* ── Archetypes ── */}
      <Card title="My archetypes" hint="The roles you naturally inhabit — pick up to 3">
        <ChipGrid items={ARCHETYPES} selected={archetypes} max={3}
          onToggle={item => toggleItem(archetypes, item, setArchetypes)} color="var(--rcos)" />
      </Card>

      {/* ── MBTI ── */}
      <Card title="Myers-Briggs type" hint="Select your type — or leave blank if you're not sure">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {MBTI_TYPES.map(({ code, label }) => {
            const on = mbti === code
            return (
              <button key={code} type="button"
                onClick={() => setMbti(on ? null : code)}
                style={{
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--rcos)' : 'var(--rule)'}`,
                  background: on ? 'rgba(139,92,246,0.12)' : 'var(--surface)',
                  color: on ? 'var(--rcos)' : 'var(--ink-3)',
                  transition: 'all 0.1s', textAlign: 'left',
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1.2 }}>{code}</div>
                <div style={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1.2, marginTop: 1 }}>{label}</div>
              </button>
            )
          })}
        </div>
        {mbti && (
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 10 }}>
            Selected: <strong style={{ color: 'var(--rcos)' }}>{mbti} · {MBTI_TYPES.find(t => t.code === mbti)?.label}</strong>
            {' '}·{' '}
            <button onClick={() => setMbti(null)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              clear
            </button>
          </p>
        )}
      </Card>

      {/* ── Values ── */}
      <Card title="My values" hint="What you stand for and organise your life around">
        <ChipGrid items={VALUES_LIST} selected={valuesList}
          onToggle={item => toggleItem(valuesList, item, setValuesList)} color="var(--alchemy)" />
        <Field label="Life principles" hint="In your own words — what guides your decisions?">
          <textarea value={lifePrinciples} rows={3} onChange={e => setLifePrinciples(e.target.value)}
            placeholder="e.g. Leave things better than I found them. Slow down to go further…" />
        </Field>
      </Card>

      {/* ── Personality (OCEAN) ── */}
      <Card title="Personality" hint="Helps find compatible people. Be honest — there's no wrong answer.">
        {OCEAN_TRAITS.map(t => (
          <div key={t.key} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{t.label}</label>
              <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                {(ocean as any)[t.key]}
              </span>
            </div>
            <input type="range" min={1} max={10} step={1}
              value={(ocean as any)[t.key]}
              onChange={e => setOcean(o => ({ ...o, [t.key]: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
              <span>{t.low}</span>
              <span>{t.high}</span>
            </div>
          </div>
        ))}
      </Card>

      {/* ── Goals ── */}
      <Card title="Goals & vision">
        <Field label="Short-term goal (next 1–2 years)">
          <textarea value={shortTermGoal} rows={2} onChange={e => setShortTermGoal(e.target.value)}
            placeholder="What are you actively working toward right now?" />
        </Field>
        <Field label="Long-term goal (3–10 years)">
          <textarea value={longTermGoal} rows={2} onChange={e => setLongTermGoal(e.target.value)}
            placeholder="Where do you want to be in a decade?" />
        </Field>
        <Field label="Life vision">
          <textarea value={lifeVision} rows={3} onChange={e => setLifeVision(e.target.value)}
            placeholder="Paint the picture of the life you're building toward…" />
        </Field>
      </Card>

      {/* ── Creative focus ── */}
      <Card title="Creative focus">
        <Field label="Current project or focus">
          <input value={currentProject} onChange={e => setCurrentProject(e.target.value)}
            placeholder="What are you working on or exploring right now?" />
        </Field>
        <Field label="Creative mediums">
          <ChipGrid items={CREATIVE_MEDIUMS} selected={creativeMediums}
            onToggle={item => toggleItem(creativeMediums, item, setCreativeMediums)} color="var(--clips)" />
        </Field>
      </Card>

      {/* ── Skills ── */}
      <Card title="Skills" hint="Specific things you're good at — add your own">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            placeholder="Type a skill and press Add…"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            style={{ flex: 1 }} />
          <button onClick={addSkill} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, flexShrink: 0,
          }}>Add</button>
        </div>
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.map(s => (
              <span key={s} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                border: '1px solid rgba(16,185,129,0.2)',
                fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
              }}>
                {s}
                <button onClick={() => setSkills(prev => prev.filter(x => x !== s))}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, lineHeight: 1, padding: 0, cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* ── Interests ── */}
      <Card title="Interests & passions">
        <ChipGrid items={INTERESTS} selected={interests}
          onToggle={item => toggleItem(interests, item, setInterests)} color="var(--governance)" />
      </Card>

      {/* ── Fun facts ── */}
      <Card title="Fun facts">
        <TwoCol>
          <Field label="Favourite colour">
            <input value={favoriteColor} onChange={e => setFavoriteColor(e.target.value)}
              placeholder="e.g. Deep forest green" />
          </Field>
          <Field label="Favourite animal">
            <input value={favoriteAnimal} onChange={e => setFavoriteAnimal(e.target.value)}
              placeholder="e.g. Octopus" />
          </Field>
        </TwoCol>
      </Card>

      {/* ── Community fit ── */}
      <Card title="Community fit">
        <Field label="Ideal community vibe" hint="Describe the feeling, culture, and rhythm of your dream community">
          <textarea value={idealCommunityVibe} rows={3} onChange={e => setIdealCommunityVibe(e.target.value)}
            placeholder="e.g. Warm, creative, spiritually open, strong work ethic, lots of music and shared meals, low drama…" />
        </Field>
        <Field label="Deal breakers" hint="What would make a community not right for you?">
          <textarea value={dealBreakers} rows={2} onChange={e => setDealBreakers(e.target.value)}
            placeholder="e.g. Dogmatic spiritual hierarchy, no pets, no children, closed to plant medicine…" />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5 }}>
            <input type="checkbox" checked={openToTravel} onChange={e => setOpenToTravel(e.target.checked)}
              style={{ width: 'auto', accentColor: 'var(--accent)' }} />
            Open to visiting communities in other countries
          </label>
        </div>
        {openToTravel && (
          <Field label="Travel style" hint="How do you like to travel?">
            <input value={travelStyle} onChange={e => setTravelStyle(e.target.value)}
              placeholder="e.g. Long slow stays, work-trade, bring my van, family-friendly…" />
          </Field>
        )}
      </Card>

      {/* ── Offers ── */}
      <Card title="🌱 What you offer">
        {offers.map((o, i) => (
          <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
              <select value={o.category}
                onChange={e => setOffers(ofs => ofs.map((x, j) => j === i ? { ...x, category: e.target.value } : x))}>
                {OFFER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={o.title} placeholder="e.g. Permaculture design"
                onChange={e => setOffers(ofs => ofs.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={o.description} placeholder="More detail (optional)"
                onChange={e => setOffers(ofs => ofs.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <button onClick={() => setOffers(ofs => ofs.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 18, flexShrink: 0 }}>×</button>
            </div>
          </div>
        ))}
        <button onClick={() => setOffers(o => [...o, { category: 'skills', title: '', description: '' }])}
          style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 600, padding: 0, cursor: 'pointer' }}>
          + Add offer
        </button>
      </Card>

      {/* ── Requests ── */}
      <Card title="🔍 What you seek">
        {requests.map((r, i) => (
          <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
              <select value={r.category}
                onChange={e => setRequests(rqs => rqs.map((x, j) => j === i ? { ...x, category: e.target.value } : x))}>
                {REQUEST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={r.title} placeholder="e.g. Co-founders for Costa Rica"
                onChange={e => setRequests(rqs => rqs.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={r.description} placeholder="More detail (optional)"
                onChange={e => setRequests(rqs => rqs.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <button onClick={() => setRequests(rqs => rqs.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 18, flexShrink: 0 }}>×</button>
            </div>
          </div>
        ))}
        <button onClick={() => setRequests(r => [...r, { category: 'community', title: '', description: '' }])}
          style={{ fontSize: 13, color: 'var(--warn)', background: 'none', border: 'none', fontWeight: 600, padding: 0, cursor: 'pointer' }}>
          + Add request
        </button>
      </Card>

      {/* ── Travel plans ── */}
      <Card title="✈️ Travel plans">
        {travel.map((t, i) => (
          <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--rule)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input value={t.location} placeholder="Location"
                onChange={e => setTravel(tv => tv.map((x, j) => j === i ? { ...x, location: e.target.value } : x))} />
              <input type="date" value={t.date_from}
                onChange={e => setTravel(tv => tv.map((x, j) => j === i ? { ...x, date_from: e.target.value } : x))} />
              <input type="date" value={t.date_to}
                onChange={e => setTravel(tv => tv.map((x, j) => j === i ? { ...x, date_to: e.target.value } : x))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={t.description} placeholder="Notes (optional)"
                onChange={e => setTravel(tv => tv.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <button onClick={() => setTravel(tv => tv.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 18, flexShrink: 0 }}>×</button>
            </div>
          </div>
        ))}
        <button onClick={() => setTravel(t => [...t, { location: '', date_from: '', date_to: '', description: '' }])}
          style={{ fontSize: 13, color: 'var(--ink-2)', background: 'none', border: 'none', fontWeight: 600, padding: 0, cursor: 'pointer' }}>
          + Add travel plan
        </button>
      </Card>

      <SaveBtn saving={saving} saved={saved} onClick={save} full />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarUpload({ avatarUrl, displayName, uploading, fileRef, onChange }: {
  avatarUrl: string | null; displayName: string; uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
      <div onClick={() => fileRef.current?.click()} style={{
        width: 80, height: 80, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        background: avatarUrl ? 'transparent' : 'var(--accent-soft)',
        border: '2px dashed var(--accent)', overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 28, color: 'var(--accent)' }}>{displayName?.[0]?.toUpperCase() ?? '?'}</span>
        }
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}>
            uploading…
          </div>
        )}
      </div>
      <div>
        <button type="button" onClick={() => fileRef.current?.click()} style={{
          fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)',
          border: 'none', padding: '7px 14px', borderRadius: 'var(--radius)', cursor: 'pointer',
        }}>
          {avatarUrl ? 'Change photo' : 'Upload photo'}
        </button>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5 }}>JPG, PNG or WebP · max 5MB</div>
      </div>
    </div>
  )
}

function ChipGrid({ items, selected, onToggle, color, max }: {
  items: string[]; selected: string[]; onToggle: (item: string) => void; color: string; max?: number
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 4 }}>
      {items.map(item => {
        const on = selected.includes(item)
        const disabled = !on && max !== undefined && selected.length >= max
        return (
          <button key={item} type="button"
            onClick={() => !disabled && onToggle(item)}
            style={{
              fontSize: 12.5, fontWeight: 500, padding: '5px 12px', borderRadius: 20, cursor: disabled ? 'not-allowed' : 'pointer',
              border: `1px solid ${on ? color : 'var(--rule)'}`,
              background: on ? color + '18' : 'var(--surface)',
              color: on ? color : 'var(--ink-3)',
              opacity: disabled ? 0.4 : 1,
              transition: 'all 0.1s',
            }}>
            {on && '✓ '}{item}
          </button>
        )
      })}
    </div>
  )
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 16 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

function SaveBtn({ saving, saved, onClick, full }: { saving: boolean; saved: boolean; onClick: () => void; full?: boolean }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      width: full ? '100%' : 'auto',
      background: saved ? '#059669' : 'var(--accent)', color: '#fff',
      fontWeight: 600, fontSize: 14, padding: '10px 24px',
      borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
      opacity: saving ? 0.7 : 1, transition: 'background 0.2s',
    }}>
      {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
    </button>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--ink-3)' }}>
      {children}
    </div>
  )
}

'use client'
import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserStatus } from '@/types/database'
import BasicSection from './_sections/BasicSection'
import IdentitySection from './_sections/IdentitySection'
import ValuesSection from './_sections/ValuesSection'
import PersonalitySection from './_sections/PersonalitySection'
import GoalsSection from './_sections/GoalsSection'
import CommunitySection from './_sections/CommunitySection'
import OffersSection from './_sections/OffersSection'

const TABS = ['Basic', 'Identity', 'Values', 'Personality', 'Goals', 'Community', 'Offers'] as const
type Tab = typeof TABS[number]

type OceanState = {
  ocean_openness: number
  ocean_conscientiousness: number
  ocean_extraversion: number
  ocean_agreeableness: number
  ocean_neuroticism: number
}

type EditOffer = { id?: string; category: string; title: string; description: string }
type EditRequest = { id?: string; category: string; title: string; description: string }
type EditTravel = { id?: string; location: string; date_from: string; date_to: string; description: string }

const DEFAULT_OCEAN: OceanState = {
  ocean_openness: 5,
  ocean_conscientiousness: 5,
  ocean_extraversion: 5,
  ocean_agreeableness: 5,
  ocean_neuroticism: 5,
}

export default function ProfileEditPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // meta
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Basic')

  // basic
  const [displayName, setDisplayName] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<UserStatus>('looking')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [userTypes, setUserTypes] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // identity
  const [archetypes, setArchetypes] = useState<string[]>([])
  const [mbti, setMbti] = useState<string | null>(null)

  // values
  const [valuesList, setValuesList] = useState<string[]>([])
  const [lifePrinciples, setLifePrinciples] = useState('')

  // personality
  const [ocean, setOcean] = useState<OceanState>(DEFAULT_OCEAN)

  // goals
  const [shortTermGoal, setShortTermGoal] = useState('')
  const [longTermGoal, setLongTermGoal] = useState('')
  const [lifeVision, setLifeVision] = useState('')
  const [currentProject, setCurrentProject] = useState('')
  const [creativeMediums, setCreativeMediums] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [favoriteColor, setFavoriteColor] = useState('')
  const [favoriteAnimal, setFavoriteAnimal] = useState('')

  // community
  const [idealCommunityVibe, setIdealCommunityVibe] = useState('')
  const [dealBreakers, setDealBreakers] = useState('')
  const [openToTravel, setOpenToTravel] = useState(false)
  const [travelStyle, setTravelStyle] = useState('')

  // offers / requests / travel
  const [offers, setOffers] = useState<EditOffer[]>([])
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [travel, setTravel] = useState<EditTravel[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const [profileRes, bioRes, offersRes, requestsRes, travelRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_bio').select('*').eq('user_id', user.id).single(),
        supabase.from('user_offers').select('*').eq('user_id', user.id),
        supabase.from('user_requests').select('*').eq('user_id', user.id),
        supabase.from('user_travel_plans').select('*').eq('user_id', user.id),
      ])

      const p = profileRes.data
      if (p) {
        setUsername(p.username ?? '')
        setDisplayName(p.display_name ?? '')
        setPronouns(p.pronouns ?? '')
        setLocation(p.location ?? '')
        setStatus((p.status as UserStatus) ?? 'looking')
        setBio(p.bio ?? '')
        setWebsiteUrl(p.website_url ?? '')
        setInstagram(p.instagram ?? '')
        setUserTypes(p.user_types ?? [])
        setAvatarUrl(p.avatar_url ?? null)
      }

      const b = bioRes.data
      if (b) {
        setArchetypes(b.archetypes ?? [])
        setMbti(b.mbti ?? null)
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
        setFavoriteColor(b.favorite_color ?? '')
        setFavoriteAnimal(b.favorite_animal ?? '')
        setIdealCommunityVibe(b.ideal_community_vibe ?? '')
        setDealBreakers(b.deal_breakers ?? '')
        setOpenToTravel(b.open_to_travel ?? false)
        setTravelStyle(b.travel_style ?? '')
      }

      if (offersRes.data) setOffers(offersRes.data)
      if (requestsRes.data) setRequests(requestsRes.data)
      if (travelRes.data) setTravel(travelRes.data)

      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    } finally {
      setAvatarUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    setSaved(false)

    const profileUpsert = supabase.from('user_profiles').upsert({
      user_id: userId,
      username,
      display_name: displayName,
      pronouns,
      location,
      status,
      bio,
      website_url: websiteUrl,
      instagram,
      user_types: userTypes,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const bioUpsert = supabase.from('user_bio').upsert({
      user_id: userId,
      archetypes,
      mbti,
      values_list: valuesList,
      life_principles: lifePrinciples,
      ...ocean,
      short_term_goal: shortTermGoal,
      long_term_goal: longTermGoal,
      life_vision: lifeVision,
      current_project: currentProject,
      creative_mediums: creativeMediums,
      skills,
      interests,
      favorite_color: favoriteColor,
      favorite_animal: favoriteAnimal,
      ideal_community_vibe: idealCommunityVibe,
      deal_breakers: dealBreakers,
      open_to_travel: openToTravel,
      travel_style: travelStyle,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const offerUpserts = offers.map(o =>
      o.id
        ? supabase.from('user_offers').update({ category: o.category, title: o.title, description: o.description }).eq('id', o.id)
        : supabase.from('user_offers').insert({ user_id: userId, category: o.category, title: o.title, description: o.description })
    )

    const requestUpserts = requests.map(r =>
      r.id
        ? supabase.from('user_requests').update({ category: r.category, title: r.title, description: r.description }).eq('id', r.id)
        : supabase.from('user_requests').insert({ user_id: userId, category: r.category, title: r.title, description: r.description })
    )

    const travelUpserts = travel.map(t =>
      t.id
        ? supabase.from('user_travel_plans').update({ location: t.location, date_from: t.date_from, date_to: t.date_to, description: t.description }).eq('id', t.id)
        : supabase.from('user_travel_plans').insert({ user_id: userId, location: t.location, date_from: t.date_from, date_to: t.date_to, description: t.description })
    )

    await Promise.all([profileUpsert, bioUpsert, ...offerUpserts, ...requestUpserts, ...travelUpserts])

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--ink-3)', fontSize: 14 }}>
        Loading profile…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>Edit profile</h1>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: '9px 22px', borderRadius: 'var(--radius)', border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontWeight: 600, fontSize: 13.5, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto',
        borderBottom: '1px solid var(--rule)', paddingBottom: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--accent)' : 'var(--ink-3)',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer', whiteSpace: 'nowrap',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Basic' && (
        <BasicSection
          fileRef={fileInputRef}
          onAvatarChange={handleAvatarChange}
          avatarUrl={avatarUrl}
          avatarUploading={avatarUploading}
          displayName={displayName} setDisplayName={setDisplayName}
          pronouns={pronouns} setPronouns={setPronouns}
          location={location} setLocation={setLocation}
          status={status} setStatus={setStatus}
          bio={bio} setBio={setBio}
          websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
          instagram={instagram} setInstagram={setInstagram}
          userTypes={userTypes} setUserTypes={setUserTypes}
        />
      )}

      {activeTab === 'Identity' && (
        <IdentitySection
          archetypes={archetypes} setArchetypes={setArchetypes}
          mbti={mbti} setMbti={setMbti}
        />
      )}

      {activeTab === 'Values' && (
        <ValuesSection
          valuesList={valuesList} setValuesList={setValuesList}
          lifePrinciples={lifePrinciples} setLifePrinciples={setLifePrinciples}
        />
      )}

      {activeTab === 'Personality' && (
        <PersonalitySection ocean={ocean} setOcean={setOcean} />
      )}

      {activeTab === 'Goals' && (
        <GoalsSection
          shortTermGoal={shortTermGoal} setShortTermGoal={setShortTermGoal}
          longTermGoal={longTermGoal} setLongTermGoal={setLongTermGoal}
          lifeVision={lifeVision} setLifeVision={setLifeVision}
          currentProject={currentProject} setCurrentProject={setCurrentProject}
          creativeMediums={creativeMediums} setCreativeMediums={setCreativeMediums}
          skills={skills} setSkills={setSkills}
          interests={interests} setInterests={setInterests}
          favoriteColor={favoriteColor} setFavoriteColor={setFavoriteColor}
          favoriteAnimal={favoriteAnimal} setFavoriteAnimal={setFavoriteAnimal}
        />
      )}

      {activeTab === 'Community' && (
        <CommunitySection
          idealCommunityVibe={idealCommunityVibe} setIdealCommunityVibe={setIdealCommunityVibe}
          dealBreakers={dealBreakers} setDealBreakers={setDealBreakers}
          openToTravel={openToTravel} setOpenToTravel={setOpenToTravel}
          travelStyle={travelStyle} setTravelStyle={setTravelStyle}
        />
      )}

      {activeTab === 'Offers' && (
        <OffersSection
          offers={offers} setOffers={setOffers}
          requests={requests} setRequests={setRequests}
          travel={travel} setTravel={setTravel}
        />
      )}
    </div>
  )
}

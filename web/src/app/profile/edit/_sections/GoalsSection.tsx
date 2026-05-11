'use client'
import { useState } from 'react'

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

interface Props {
  shortTermGoal: string; setShortTermGoal: (v: string) => void
  longTermGoal: string; setLongTermGoal: (v: string) => void
  lifeVision: string; setLifeVision: (v: string) => void
  currentProject: string; setCurrentProject: (v: string) => void
  creativeMediums: string[]; setCreativeMediums: (v: string[]) => void
  skills: string[]; setSkills: (v: string[]) => void
  interests: string[]; setInterests: (v: string[]) => void
  favoriteColor: string; setFavoriteColor: (v: string) => void
  favoriteAnimal: string; setFavoriteAnimal: (v: string) => void
}

export default function GoalsSection(p: Props) {
  const [skillInput, setSkillInput] = useState('')

  const toggleMedium = (m: string) =>
    p.setCreativeMediums(p.creativeMediums.includes(m) ? p.creativeMediums.filter(x => x !== m) : [...p.creativeMediums, m])

  const toggleInterest = (i: string) =>
    p.setInterests(p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i])

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !p.skills.includes(s)) p.setSkills([...p.skills, s])
    setSkillInput('')
  }

  const removeSkill = (s: string) => p.setSkills(p.skills.filter(x => x !== s))

  return (
    <div>
      <Card title="Goals & vision">
        <Field label="Now (1-2 years)">
          <textarea value={p.shortTermGoal} onChange={e => p.setShortTermGoal(e.target.value)} rows={2}
            placeholder="What are you focused on building or achieving right now?" />
        </Field>
        <Field label="Long-term (3-10 years)">
          <textarea value={p.longTermGoal} onChange={e => p.setLongTermGoal(e.target.value)} rows={2}
            placeholder="Where do you want to be in ten years?" />
        </Field>
        <Field label="Life vision">
          <textarea value={p.lifeVision} onChange={e => p.setLifeVision(e.target.value)} rows={3}
            placeholder="The bigger picture — the kind of life, community, or world you want to help create." />
        </Field>
      </Card>

      <Card title="Creative focus">
        <Field label="Current project" hint="A title, URL, or one-line description">
          <input value={p.currentProject} onChange={e => p.setCurrentProject(e.target.value)}
            placeholder="e.g. Co-founding an ecovillage in Colombia" />
        </Field>
        <Field label="Creative mediums">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CREATIVE_MEDIUMS.map(m => {
              const selected = p.creativeMediums.includes(m)
              return (
                <button key={m} type="button" onClick={() => toggleMedium(m)} style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5,
                  border: `1.5px solid ${selected ? 'var(--clips)' : 'var(--rule)'}`,
                  background: selected ? 'rgba(6,182,212,0.1)' : 'transparent',
                  color: selected ? 'var(--clips)' : 'var(--ink-3)',
                  fontWeight: selected ? 600 : 400, transition: 'all 0.1s',
                }}>{m}</button>
              )
            })}
          </div>
        </Field>
      </Card>

      <Card title="Skills" hint="Add the skills you have to offer — free text, as specific as you like">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
            placeholder="Type a skill and press Enter..." style={{ flex: 1 }} />
          <button type="button" onClick={addSkill} style={{
            padding: '9px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--rule)',
            background: 'var(--surface)', color: 'var(--ink-2)', fontWeight: 500, fontSize: 13,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Add</button>
        </div>
        {p.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {p.skills.map(s => (
              <span key={s} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20, fontSize: 12.5,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                {s}
                <button type="button" onClick={() => removeSkill(s)} style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
                }}>x</button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card title="Interests">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {INTERESTS.map(i => {
            const selected = p.interests.includes(i)
            return (
              <button key={i} type="button" onClick={() => toggleInterest(i)} style={{
                padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5,
                border: `1.5px solid ${selected ? 'var(--governance)' : 'var(--rule)'}`,
                background: selected ? 'rgba(139,92,246,0.1)' : 'transparent',
                color: selected ? 'var(--governance)' : 'var(--ink-3)',
                fontWeight: selected ? 600 : 400, transition: 'all 0.1s',
              }}>{i}</button>
            )
          })}
        </div>
      </Card>

      <Card title="Fun facts">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Favourite colour">
            <input value={p.favoriteColor} onChange={e => p.setFavoriteColor(e.target.value)} placeholder="e.g. Deep forest green" />
          </Field>
          <Field label="Favourite animal">
            <input value={p.favoriteAnimal} onChange={e => p.setFavoriteAnimal(e.target.value)} placeholder="e.g. Octopus" />
          </Field>
        </div>
      </Card>
    </div>
  )
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-lg)', padding: '22px', marginBottom: 20,
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--ink-2)' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, marginTop: 5, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
  )
}

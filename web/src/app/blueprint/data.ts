export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'number'

export interface StepField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: string[]
  hint?: string
  required?: boolean
}

export interface Step {
  id: string
  phase: 'SPARK' | 'PROVE' | 'BUILD' | 'LIVE'
  title: string
  description: string
  fields: StepField[]
}

export const PHASES = ['SPARK', 'PROVE', 'BUILD', 'LIVE'] as const
export type Phase = typeof PHASES[number]

export const PHASE_META: Record<Phase, { label: string; description: string; color: string }> = {
  SPARK: { label: 'Spark', description: 'Define your vision and core idea', color: 'var(--alchemy)' },
  PROVE: { label: 'Prove', description: 'Validate your concept and gather your team', color: 'var(--clips)' },
  BUILD: { label: 'Build', description: 'Establish legal, land, and systems', color: 'var(--accent)' },
  LIVE:  { label: 'Live',  description: 'Operate, grow, and iterate', color: 'var(--governance)' },
}

export const STEPS: Step[] = [
  // SPARK
  {
    id: '1.1', phase: 'SPARK', title: 'Core vision',
    description: 'What kind of community are you building, and why?',
    fields: [
      { key: 'vision_statement', label: 'Vision statement', type: 'textarea', required: true,
        placeholder: 'Describe the community you want to build in 2-3 sentences.' },
      { key: 'primary_motivation', label: 'Primary motivation', type: 'select', required: true,
        options: ['Ecological regeneration', 'Economic resilience', 'Cultural revival', 'Spiritual growth', 'Social belonging', 'Creative expression', 'Other'],
        hint: 'What is the deepest "why" behind this project?' },
      { key: 'community_size_target', label: 'Target community size', type: 'select',
        options: ['2-5 people (household)', '6-15 people (small group)', '16-30 people (village scale)', '31-100 people (small village)', '100+ people (town scale)'] },
    ],
  },
  {
    id: '1.2', phase: 'SPARK', title: 'Values & culture',
    description: 'What principles will guide how your community lives and makes decisions?',
    fields: [
      { key: 'core_values', label: 'Core values', type: 'multiselect',
        options: ['Ecological regeneration', 'Community & belonging', 'Simplicity', 'Spiritual growth', 'Social justice', 'Economic justice', 'Education', 'Health & wellbeing', 'Autonomy', 'Collaboration', 'Open source', 'Decentralisation', 'Food sovereignty', 'Nonviolence'] },
      { key: 'governance_model', label: 'Governance model', type: 'select',
        options: ['Sociocracy / holacracy', 'Consensus-based', 'Representative democracy', 'Benevolent founder', 'Liquid democracy', 'Not yet decided'],
        hint: 'How will decisions be made?' },
      { key: 'conflict_resolution', label: 'Conflict resolution approach', type: 'textarea',
        placeholder: 'How will you handle disagreements and interpersonal conflict?' },
    ],
  },
  {
    id: '1.3', phase: 'SPARK', title: 'Economic model',
    description: 'How will your community sustain itself financially?',
    fields: [
      { key: 'economic_model', label: 'Economic model', type: 'select',
        options: ['Common purse (full income sharing)', 'Partial income sharing', 'Individual ownership + shared costs', 'Co-op / member owned', 'Non-profit foundation', 'Mixed model', 'Not yet decided'] },
      { key: 'income_sources', label: 'Planned income sources', type: 'multiselect',
        options: ['Agriculture / food production', 'Workshops & retreats', 'Digital / remote work', 'Tourism / hosting', 'Crafts & manufacturing', 'Education programs', 'Consulting / services', 'Donations & grants', 'Community bonds / crowdfunding'] },
      { key: 'startup_budget', label: 'Estimated startup budget (USD)', type: 'text',
        placeholder: 'e.g. $500,000 for land + build-out' },
    ],
  },
  {
    id: '1.4', phase: 'SPARK', title: 'Location criteria',
    description: 'Where do you want to build, and what does the land need to offer?',
    fields: [
      { key: 'preferred_regions', label: 'Preferred regions / countries', type: 'textarea',
        placeholder: 'e.g. Costa Rica, Portugal, Pacific Northwest USA...' },
      { key: 'climate_preference', label: 'Climate preference', type: 'select',
        options: ['Tropical', 'Mediterranean', 'Temperate', 'Semi-arid / dry', 'Any / flexible'] },
      { key: 'land_size_acres', label: 'Land size needed (acres)', type: 'text',
        placeholder: 'e.g. 10-50 acres' },
      { key: 'land_requirements', label: 'Key land requirements', type: 'multiselect',
        options: ['Water source (spring/river)', 'Good soil for farming', 'Existing structures', 'Off-grid capable', 'Road access', 'Near town / services', 'Forest cover', 'Coastal / beach', 'Mountain setting'] },
    ],
  },

  // PROVE
  {
    id: '2.1', phase: 'PROVE', title: 'Founding team',
    description: 'Who is committed to building this with you?',
    fields: [
      { key: 'founder_count', label: 'Number of committed founders', type: 'number',
        hint: 'People who are fully bought in and ready to act' },
      { key: 'team_skills', label: 'Skills represented in your founding team', type: 'multiselect',
        options: ['Project management', 'Architecture / building', 'Agriculture / permaculture', 'Legal / governance', 'Finance / accounting', 'Marketing / community', 'Technology / software', 'Teaching / facilitation', 'Healthcare / wellness', 'Crafts / making'] },
      { key: 'missing_skills', label: 'Key skills you still need', type: 'textarea',
        placeholder: 'What gaps do you need to fill before you can move forward?' },
    ],
  },
  {
    id: '2.2', phase: 'PROVE', title: 'Proof of concept',
    description: 'Have you tested your concept at smaller scale?',
    fields: [
      { key: 'has_pilot', label: 'Have you run a pilot or prototype?', type: 'boolean' },
      { key: 'pilot_description', label: 'Describe your pilot / prototype', type: 'textarea',
        placeholder: 'e.g. We ran a 6-month co-living trial with 4 people in a rented house...' },
      { key: 'key_learnings', label: 'Key learnings so far', type: 'textarea',
        placeholder: 'What worked? What surprised you? What would you do differently?' },
    ],
  },
  {
    id: '2.3', phase: 'PROVE', title: 'Community demand',
    description: 'Is there enough interest from potential members?',
    fields: [
      { key: 'interested_members', label: 'Number of interested potential members', type: 'number' },
      { key: 'outreach_channels', label: 'How you are reaching potential members', type: 'multiselect',
        options: ['Word of mouth', 'Social media', 'Tribes Platform', 'Events / festivals', 'Newsletter', 'Podcast / media', 'Online community', 'Local networks'] },
      { key: 'member_commitment_level', label: 'Level of commitment from interested members', type: 'select',
        options: ['Curious / following along', 'Attending events / calls', 'On a waiting list', 'Financial deposit placed', 'Fully committed to join'] },
    ],
  },

  // BUILD
  {
    id: '3.1', phase: 'BUILD', title: 'Legal structure',
    description: 'What legal entity will hold your land and govern your community?',
    fields: [
      { key: 'legal_entity_type', label: 'Legal entity type', type: 'select',
        options: ['LLC / Limited company', 'Co-operative', 'Non-profit / NGO', 'Foundation', 'Land trust', 'Community land trust', 'Association', 'Not yet established'] },
      { key: 'legal_jurisdiction', label: 'Jurisdiction / country of incorporation', type: 'text',
        placeholder: 'e.g. Portugal, California USA, Costa Rica' },
      { key: 'membership_agreements', label: 'Do you have membership agreements drafted?', type: 'boolean' },
      { key: 'legal_notes', label: 'Legal notes / questions', type: 'textarea',
        placeholder: 'Any outstanding legal questions or decisions?' },
    ],
  },
  {
    id: '3.2', phase: 'BUILD', title: 'Land & infrastructure',
    description: 'What is the status of your land and initial build-out?',
    fields: [
      { key: 'land_status', label: 'Land status', type: 'select',
        options: ['Still searching', 'In negotiation', 'Under contract', 'Purchased', 'Long-term lease secured'] },
      { key: 'land_description', label: 'Land description', type: 'textarea',
        placeholder: 'Where is it? How many acres? What is on it?' },
      { key: 'infrastructure_phase', label: 'Infrastructure development phase', type: 'select',
        options: ['No infrastructure yet', 'Basic utilities (water/power)', 'Temporary structures', 'Permanent structures under construction', 'Move-in ready'] },
      { key: 'building_approach', label: 'Building approach', type: 'multiselect',
        options: ['Natural building (cob, straw bale)', 'Timber frame', 'Earthship / passive', 'Modular / prefab', 'Renovation of existing', 'Container', 'Conventional construction'] },
    ],
  },
  {
    id: '3.3', phase: 'BUILD', title: 'Food & ecology',
    description: 'How will your community feed itself and care for the land?',
    fields: [
      { key: 'food_production_goal', label: 'Food production goal', type: 'select',
        options: ['No on-site production', '10-25% self-sufficient', '25-50% self-sufficient', '50-75% self-sufficient', '75-100% self-sufficient'] },
      { key: 'agriculture_approaches', label: 'Agricultural approaches', type: 'multiselect',
        options: ['Permaculture', 'Biodynamic', 'Agroforestry', 'Market garden', 'CSA / food box', 'Orchards', 'Aquaponics', 'Animal husbandry', 'Wild harvesting / foraging'] },
      { key: 'ecological_goals', label: 'Ecological restoration goals', type: 'textarea',
        placeholder: 'What do you want to do for the land beyond food production?' },
    ],
  },
  {
    id: '3.4', phase: 'BUILD', title: 'Systems & technology',
    description: 'What systems will run your community?',
    fields: [
      { key: 'energy_system', label: 'Energy system', type: 'select',
        options: ['Grid-connected', 'Solar + battery (off-grid)', 'Solar + grid backup', 'Wind', 'Micro-hydro', 'Biogas', 'Not yet decided'] },
      { key: 'water_system', label: 'Water system', type: 'select',
        options: ['Municipal supply', 'Well', 'Spring / gravity fed', 'Rainwater harvesting', 'Multiple sources', 'Not yet decided'] },
      { key: 'digital_tools', label: 'Digital tools you plan to use', type: 'multiselect',
        options: ['Tribes Platform', 'Open collective', 'Loomio (governance)', 'Discord / community chat', 'Notion / knowledge base', 'Custom software', 'Minimal digital footprint'] },
    ],
  },

  // LIVE
  {
    id: '4.1', phase: 'LIVE', title: 'Onboarding & membership',
    description: 'How do people join your community?',
    fields: [
      { key: 'onboarding_process', label: 'Onboarding process', type: 'textarea',
        placeholder: 'Step by step, how does someone go from interested to full member?' },
      { key: 'trial_period', label: 'Trial / probationary period?', type: 'boolean' },
      { key: 'trial_duration', label: 'Trial period duration', type: 'select',
        options: ['1 month', '3 months', '6 months', '1 year', 'No trial period'] },
      { key: 'membership_fee', label: 'Membership / buy-in fee structure', type: 'textarea',
        placeholder: 'What do members contribute financially to join?' },
    ],
  },
  {
    id: '4.2', phase: 'LIVE', title: 'Shared life & rhythm',
    description: 'What does day-to-day communal life look like?',
    fields: [
      { key: 'shared_meals', label: 'Shared meals', type: 'select',
        options: ['Every meal', 'Once daily', '3-4 times per week', 'Weekly', 'Optional / rarely', 'None'] },
      { key: 'shared_work', label: 'Shared work / labour hours per week', type: 'select',
        options: ['0 hours (fully individual)', '1-5 hours', '5-10 hours', '10-20 hours', '20+ hours (full income sharing)'] },
      { key: 'shared_spaces', label: 'Shared spaces', type: 'multiselect',
        options: ['Kitchen & dining', 'Living room / common room', 'Workshop / makerspace', 'Library', 'Meditation / ceremony space', 'Childcare / school', 'Guest accommodation', 'Co-working space'] },
      { key: 'private_space', label: 'Private living arrangement', type: 'select',
        options: ['Private rooms in shared house', 'Private apartments', 'Private small homes / cabins', 'Mixed (some private, some shared)', 'Context-dependent'] },
    ],
  },
  {
    id: '4.3', phase: 'LIVE', title: 'Growth & evolution',
    description: 'How will your community grow and adapt over time?',
    fields: [
      { key: 'max_size', label: 'Maximum intended community size', type: 'text',
        placeholder: 'e.g. 30 adults + children' },
      { key: 'growth_strategy', label: 'Growth strategy', type: 'select',
        options: ['Grow organically (no target)', 'Slow and intentional', 'Expand through satellite communities', 'Inspire others to replicate the model', 'Fixed size — no growth planned'] },
      { key: 'next_milestone', label: 'Your next key milestone', type: 'textarea', required: true,
        placeholder: 'What is the single most important thing you need to accomplish next?' },
      { key: 'support_needed', label: 'What support would help you most right now?', type: 'textarea',
        placeholder: 'e.g. Legal advice, finding land, recruiting a co-founder, funding...' },
    ],
  },
]

export function getPhaseSteps(phase: Phase) {
  return STEPS.filter(s => s.phase === phase)
}

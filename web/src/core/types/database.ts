export type UserStatus = 'looking' | 'open' | 'building' | 'traveling' | 'settled'
export type UserVisibility = 'public' | 'community' | 'private'
export type ConnectionStatus = 'pending' | 'connected' | 'declined' | 'blocked'
export type CommunityPhase = 'spark' | 'prove' | 'build' | 'live'
export type CommunityVisibility = 'public' | 'unlisted' | 'private'
export type MemberRole = 'co_creator' | 'resident' | 'guest' | 'follower'
export type MemberStatus = 'pending' | 'active' | 'inactive'
export type OfferCategory = 'skills' | 'resources' | 'funding' | 'space' | 'labor' | 'expertise'
export type RequestCategory = 'community' | 'connection' | 'skill' | 'resource' | 'opportunity'

export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  pronouns: string | null
  avatar_url: string | null
  bio: string | null
  current_location: string | null
  status: UserStatus
  visibility: UserVisibility
  website_url: string | null
  instagram_handle: string | null
  user_types: string[] | null
  created_at: string
  updated_at: string
}

export interface UserBio {
  user_id: string
  archetypes: string[]
  values_list: string[]
  life_principles: string | null
  ocean_openness: number
  ocean_conscientiousness: number
  ocean_extraversion: number
  ocean_agreeableness: number
  ocean_neuroticism: number
  short_term_goal: string | null
  long_term_goal: string | null
  life_vision: string | null
  current_project: string | null
  creative_mediums: string[]
  skills: string[]
  interests: string[]
  ideal_community_vibe: string | null
  deal_breakers: string | null
  open_to_travel: boolean
  travel_style: string | null
  mbti: string | null
  favorite_color: string | null
  favorite_animal: string | null
  updated_at: string
}

export interface UserOffer {
  id: string
  user_id: string
  category: OfferCategory
  title: string
  description: string | null
  tags: string[] | null
  created_at: string
}

export interface UserRequest {
  id: string
  user_id: string
  category: RequestCategory
  title: string
  description: string | null
  tags: string[] | null
  created_at: string
}

export interface UserTravelPlan {
  id: string
  user_id: string
  location: string
  date_from: string | null
  date_to: string | null
  description: string | null
  is_public: boolean
  created_at: string
}

export interface UserCommunityPrefs {
  user_id: string
  governance_style: string[] | null
  economic_model: string[] | null
  lifestyle: string[] | null
  ecology_priority: string[] | null
  geography_preference: string[] | null
  size_preference: string | null
  phase_interest: string[] | null
  updated_at: string
}

export interface Community {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  location: string | null
  phase: CommunityPhase
  visibility: CommunityVisibility
  cover_image_url: string | null
  wizard_values: Record<string, unknown> | null
  flagged_fields: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Blueprint {
  id: string
  user_id: string
  community_id: string | null
  title: string
  answers: Record<string, unknown>
  flags: Record<string, boolean>
  current_step: string | null
  created_at: string
  updated_at: string
}

export interface UserConnection {
  id: string
  from_user_id: string
  to_user_id: string
  status: ConnectionStatus
  intro_message: string | null
  created_at: string
  updated_at: string
}

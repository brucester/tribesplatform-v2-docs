-- Add user_types to profiles
alter table public.user_profiles
  add column if not exists user_types text[] default '{}';

-- Deep bio table
create table if not exists public.user_bio (
  user_id             uuid references public.user_profiles(id) on delete cascade primary key,
  -- Identity
  archetypes          text[] default '{}',
  values_list         text[] default '{}',
  life_principles     text,
  -- Personality (OCEAN, 1-10)
  ocean_openness      int default 5,
  ocean_conscientiousness int default 5,
  ocean_extraversion  int default 5,
  ocean_agreeableness int default 5,
  ocean_neuroticism   int default 5,
  -- Goals
  short_term_goal     text,
  long_term_goal      text,
  life_vision         text,
  -- Creative
  current_project     text,
  creative_mediums    text[] default '{}',
  -- Skills & interests
  skills              text[] default '{}',
  interests           text[] default '{}',
  -- Community fit
  ideal_community_vibe text,
  deal_breakers       text,
  -- Travel
  open_to_travel      boolean default true,
  travel_style        text,
  updated_at          timestamptz default now()
);

alter table public.user_bio enable row level security;

create policy "Bio: public read" on public.user_bio
  for select using (true);
create policy "Bio: manage own" on public.user_bio
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trg_user_bio_updated_at
  before update on public.user_bio
  for each row execute function update_updated_at();

-- Regen Platform — full schema
-- Run this in your Supabase SQL editor (Database → SQL Editor → New query)

create extension if not exists "uuid-ossp";

-- ─── User profiles ───────────────────────────────────────────────────────────
create table public.user_profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  username       text unique not null,
  display_name   text,
  pronouns       text,
  avatar_url     text,
  bio            text,
  current_location text,
  status         text default 'open'
                   check (status in ('looking','open','building','traveling','settled')),
  visibility     text default 'public'
                   check (visibility in ('public','community','private')),
  website_url    text,
  instagram_handle text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── Offers (what a user can contribute) ─────────────────────────────────────
create table public.user_offers (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.user_profiles(id) on delete cascade not null,
  category    text not null,   -- skills | resources | funding | space | labor | expertise
  title       text not null,
  description text,
  tags        text[],
  created_at  timestamptz default now()
);

-- ─── Requests (what a user is seeking) ───────────────────────────────────────
create table public.user_requests (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.user_profiles(id) on delete cascade not null,
  category    text not null,   -- community | connection | skill | resource | opportunity
  title       text not null,
  description text,
  tags        text[],
  created_at  timestamptz default now()
);

-- ─── Travel plans ────────────────────────────────────────────────────────────
create table public.user_travel_plans (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.user_profiles(id) on delete cascade not null,
  location    text not null,
  date_from   date,
  date_to     date,
  description text,
  is_public   boolean default true,
  created_at  timestamptz default now()
);

-- ─── Community preferences ───────────────────────────────────────────────────
create table public.user_community_prefs (
  user_id              uuid references public.user_profiles(id) on delete cascade primary key,
  governance_style     text[],  -- consensus | sociocracy | holacracy | council | flat
  economic_model       text[],  -- gift | cooperative | investment | sliding-scale | mixed
  lifestyle            text[],  -- vegan | vegetarian | alcohol-free | substance-free | spiritual | secular
  ecology_priority     text[],  -- food-forest | off-grid | permaculture | rewilding | zero-waste
  geography_preference text[],  -- tropical | temperate | desert | coastal | mountain | rural | peri-urban
  size_preference      text,    -- small (<20) | medium (20-100) | large (100+) | any
  phase_interest       text[],  -- spark | prove | build | live
  prefs_raw            jsonb,
  updated_at           timestamptz default now()
);

-- ─── Connections between users ───────────────────────────────────────────────
create table public.user_connections (
  id            uuid default uuid_generate_v4() primary key,
  from_user_id  uuid references public.user_profiles(id) on delete cascade not null,
  to_user_id    uuid references public.user_profiles(id) on delete cascade not null,
  status        text default 'pending'
                  check (status in ('pending','connected','declined','blocked')),
  intro_message text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(from_user_id, to_user_id)
);

-- ─── Communities ─────────────────────────────────────────────────────────────
create table public.communities (
  id              uuid default uuid_generate_v4() primary key,
  slug            text unique not null,
  name            text not null,
  tagline         text,
  description     text,
  location        text,
  phase           text default 'spark'
                    check (phase in ('spark','prove','build','live')),
  visibility      text default 'public'
                    check (visibility in ('public','unlisted','private')),
  cover_image_url text,
  wizard_values   jsonb,
  flagged_fields  jsonb,
  created_by      uuid references public.user_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── Community membership ────────────────────────────────────────────────────
create table public.community_members (
  community_id uuid references public.communities(id) on delete cascade,
  user_id      uuid references public.user_profiles(id) on delete cascade,
  role         text not null
                 check (role in ('co_creator','resident','guest','follower')),
  status       text default 'active'
                 check (status in ('pending','active','inactive')),
  joined_at    timestamptz default now(),
  primary key (community_id, user_id)
);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function update_updated_at();

create trigger trg_communities_updated_at
  before update on public.communities
  for each row execute function update_updated_at();

create trigger trg_community_prefs_updated_at
  before update on public.user_community_prefs
  for each row execute function update_updated_at();

create trigger trg_connections_updated_at
  before update on public.user_connections
  for each row execute function update_updated_at();

-- ─── Row-level security ──────────────────────────────────────────────────────
alter table public.user_profiles        enable row level security;
alter table public.user_offers          enable row level security;
alter table public.user_requests        enable row level security;
alter table public.user_travel_plans    enable row level security;
alter table public.user_community_prefs enable row level security;
alter table public.user_connections     enable row level security;
alter table public.communities          enable row level security;
alter table public.community_members    enable row level security;

-- user_profiles
create policy "Profiles: public read" on public.user_profiles
  for select using (visibility = 'public' or auth.uid() = id);
create policy "Profiles: insert own" on public.user_profiles
  for insert with check (auth.uid() = id);
create policy "Profiles: update own" on public.user_profiles
  for update using (auth.uid() = id);

-- user_offers
create policy "Offers: public read" on public.user_offers for select using (true);
create policy "Offers: manage own" on public.user_offers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_requests
create policy "Requests: public read" on public.user_requests for select using (true);
create policy "Requests: manage own" on public.user_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_travel_plans
create policy "Travel: read public or own" on public.user_travel_plans
  for select using (is_public = true or auth.uid() = user_id);
create policy "Travel: manage own" on public.user_travel_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_community_prefs
create policy "Prefs: read if authenticated" on public.user_community_prefs
  for select using (auth.role() = 'authenticated');
create policy "Prefs: manage own" on public.user_community_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_connections
create policy "Connections: read own" on public.user_connections
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Connections: insert as sender" on public.user_connections
  for insert with check (auth.uid() = from_user_id);
create policy "Connections: update own" on public.user_connections
  for update using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- communities
create policy "Communities: public read" on public.communities
  for select using (visibility = 'public' or auth.uid() = created_by);
create policy "Communities: authenticated insert" on public.communities
  for insert with check (auth.role() = 'authenticated');
create policy "Communities: co-creator update" on public.communities
  for update using (
    auth.uid() = created_by or
    exists (
      select 1 from public.community_members
      where community_id = id and user_id = auth.uid() and role = 'co_creator' and status = 'active'
    )
  );

-- community_members
create policy "Members: read if authenticated" on public.community_members
  for select using (auth.role() = 'authenticated');
create policy "Members: insert own" on public.community_members
  for insert with check (auth.uid() = user_id);
create policy "Members: update own" on public.community_members
  for update using (auth.uid() = user_id);

-- ─── Auto-create profile row on signup ───────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, username, display_name)
  values (
    new.id,
    lower(split_part(new.email, '@', 1)) || '_' || substring(new.id::text, 1, 6),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

# Module 01 — Community Network

**TribesPlatform v2 · MyCoNet Module 1**
Part of the regenerative neighborhood open source tech stack.

**Live URL:** https://regen-platform.vercel.app
**Supabase project:** vzgoulsqmhvhbjhzlzkf (West EU — Ireland)

---

## What This Module Does

Profile-based discovery and AI-powered matching for people building regenerative lives. Users build a deep bio, browse other members, and get ranked compatibility scores based on shared values, skills, interests, personality (OCEAN), and Myers-Briggs type.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Supabase Auth (magic link / OTP) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (avatars bucket) |
| Hosting | Vercel |
| Email | Resend SMTP (hello@regentribe.co — pending domain verification) |
| Language | TypeScript |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth/login` | Magic link login |
| `/auth/signup` | Magic link signup |
| `/auth/callback` | Supabase auth callback |
| `/onboarding` | Two-step profile setup after first signup |
| `/profile/edit` | Full bio wizard — edit all profile + bio data |
| `/u/[username]` | Public profile page |
| `/discover` | Browse + filter members with match scoring |

---

## Database Tables

| Table | Purpose |
|---|---|
| `user_profiles` | Core identity — username, display name, avatar, bio, status, location, user_types |
| `user_bio` | Deep matching data — archetypes, values, OCEAN, MBTI, goals, skills, interests, fun facts |
| `user_offers` | What the user offers (skills, resources, space, etc.) |
| `user_requests` | What the user is seeking |
| `user_travel_plans` | Travel plans (public) |
| `user_community_prefs` | Community preference data |
| `user_connections` | Connection requests between users |

**Schema files:**
- `supabase/schema.sql` — base tables
- `supabase/bio-schema.sql` — user_bio table + user_types column

---

## Bio Wizard Fields

**Basic:** display name, pronouns, avatar, location, status, bio, website, Instagram

**Identity:** user types (12 options), archetypes (max 3 of 10), values (18 options), life principles

**Personality:** OCEAN sliders (1–10), Myers-Briggs type (16 types with labels)

**Goals:** short-term goal, long-term goal, life vision

**Creative:** current project/focus, creative mediums

**Skills:** free-text add/remove tags

**Interests:** 25+ preset options

**Community fit:** ideal community vibe, deal breakers, open to travel, travel style

**Fun facts:** favourite colour, favourite animal

---

## Match Scoring Algorithm

Scores are computed client-side on the Discover page (max 100 pts):

| Signal | Max points |
|---|---|
| Shared values | 30 |
| Shared skills | 16 |
| Shared interests | 14 |
| OCEAN personality similarity | 18 |
| MBTI compatibility | 22 |

**MBTI compatibility tiers:**
- Ideal cognitive complement pair (e.g. INTJ ↔ ENFP) → 22 pts
- Secondary complement → 16 pts
- Same type → 12 pts
- Same temperament (NT/NF/SJ/SP) → 10 pts
- Share 2+ letters → 5 pts

---

## Local Development

```bash
cd Modules/m1_comm_network
npm install
npm run dev
# → http://localhost:3000
```

Env vars needed in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://vzgoulsqmhvhbjhzlzkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deploy

```bash
vercel --prod --yes
```

Project is linked to Vercel via `.vercel/project.json`.

---

## Key Files

```
src/
  app/
    page.tsx                  # Landing page
    globals.css               # Design system (CSS vars, shared classes)
    layout.tsx                # Root layout + theme init script
    auth/login/page.tsx       # Magic link login
    auth/signup/page.tsx      # Magic link signup
    auth/callback/route.ts    # Supabase callback handler
    onboarding/page.tsx       # First-time profile setup
    profile/edit/page.tsx     # Full bio wizard (client)
    discover/
      page.tsx                # Server: fetch all profiles + bios
      DiscoverClient.tsx      # Client: filter UI + match scoring
    u/[username]/page.tsx     # Public profile (server)
  components/
    Nav.tsx                   # Sticky nav with auth state
    ThemeToggle.tsx           # Dark/light mode toggle
  lib/
    supabase/client.ts        # Browser Supabase client
    supabase/server.ts        # Server Supabase client
  types/
    database.ts               # TypeScript interfaces for all tables
middleware.ts                 # Route protection
supabase/
  schema.sql                  # Base database schema
  bio-schema.sql              # user_bio table
```

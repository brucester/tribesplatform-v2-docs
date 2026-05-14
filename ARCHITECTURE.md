# MyCoNet v2 — Architecture & Database Schema

> Status: PHASE 0 LIVE | Updated: 2026-05-14

---

## 1. What We're Building

**MyCoNet** is a community operating system for regenerative neighborhoods. The current deployment is a **single-community portal** — one community, one URL, all users are members or prospective members of the same project.

The portal lets a community:
- Share a living community blueprint (planning document)
- Onboard new members through an application flow
- Manage active projects and post timeline updates
- Create and track collaboration agreements
- Browse member profiles and find collaborators

This is Phase 0. The platform is built to scale to multiple communities (Phase 1) and eventually an inter-community network (Phase 2 — Hive), but that is not the current concern. One community. One portal. Prove the loop first.

---

## 2. Module Status

| # | Module | Status | Notes |
|---|---|---|---|
| 00 | MyCoNet Dashboard | ✅ Live | Personal home screen for every member. Role-scoped panels. |
| 01 | Community Network | ✅ Live | Profiles, bio wizard, AI matching, discover, offers/seeks. |
| 02 | Neighborhood Directory | 🔗 v1 link | Links to v1 tribesplatform.app. Building in v2 next. |
| 03 | Resources & Tools | 🔗 v1 link | Links to v1 tribesplatform.app. Building in v2 next. |
| 04 | Blueprint | ✅ Live | Shared community document. Admin edits. All members read. AI scanning. |
| 05 | Join | ✅ Live | Application form. Admin reviews. Accept sets role to `joining`. |
| 06 | Agreements | ✅ Live | Collaboration proposals on open projects. Admin reviews. |
| 07 | Operations | ✅ Live | Admin creates projects, posts updates. Projects surface in M06. |
| 08 | Contribution Tracking | ⏳ Planned | Points + badges for contributions. |
| 09 | Governance | ⏳ Planned | AI-facilitated collective decision-making. |
| 10 | Genesis Bot | ⏳ Planned | Telegram bridge for DB change requests. |
| 11 | Quinn | ⏳ Planned | Personal AI per member. |
| 12 | MycoNet Agent | ⏳ Planned | Community brain. Coordinates all agents. |
| 13 | Hive | ⏳ Planned | Inter-community network layer. |

---

## 3. System Architecture

```
┌──────────────────────────────────────────┐
│           BROWSER / CLIENT               │
│   Next.js 16 App Router (React)          │
│   Deployed to Cloudflare Workers         │
│   via @opennextjs/cloudflare             │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│           SUPABASE                       │
│                                          │
│   Auth — magic link / email+password     │
│   PostgreSQL — all module data           │
│   Row Level Security — per-user access   │
│   Realtime — (planned for M12 agents)    │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│           AI LAYER                       │
│                                          │
│   MiniMax M2.7 — Blueprint doc scanning  │
│   Claude API — planned (Quinn, MycoNet,  │
│                 Governance, M01 match)   │
└──────────────────────────────────────────┘
```

**Routing:** All pages are Next.js App Router server components. Client components used only where interactivity is required (forms, wizards, real-time actions).

**Auth:** Supabase Auth with cookie-based sessions (`@supabase/ssr`). Server components read the session via `createClient()` from `@/lib/supabase/server`.

**RLS:** Every table has row-level security. A helper function `is_admin()` checks `user_profiles.role` to grant admin-level policies without exposing the service role key.

---

## 4. Actual Database Schema (Supabase)

### `user_profiles`
Extends Supabase auth users. Created by trigger on signup.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'explorer',
    -- explorer | joining | resident | circle_lead | project_lead | admin
  bio TEXT,
  location TEXT,
  user_types TEXT[],           -- Community Member, Vision Holder, Service Provider, etc.
  personality_details JSONB,   -- { myersBriggs, ocean: { openness, conscientiousness, ... } }
  archetypes JSONB,            -- { primary, secondary, description }
  offers JSONB[],              -- [{ category, title, description }]
  seeks JSONB[],
  places_traveling TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `blueprints`
One shared community document. Admin creates and edits; all members read.

```sql
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  answers JSONB DEFAULT '{}',  -- all wizard field values, keyed by field id
  flags JSONB DEFAULT '{}',    -- step completion / gate-check flags
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key answers field:** `join_application_questions` (text, one question per line) — read by M05 Join to build the application form.

### `applications`
Join applications submitted by prospective members.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  answers JSONB DEFAULT '{}',  -- keyed q0, q1, q2... matching blueprint questions
  status TEXT DEFAULT 'pending',
    -- pending | reviewing | accepted | rejected
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Accept flow:** Admin sets `status = 'accepted'` → `user_profiles.role` updated to `'joining'` → member gains M06 access.

### `projects`
Community projects created and managed by admin in M07 Operations.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
    -- active | paused | completed
  open_for_collaborators BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `project_updates`
Timeline updates posted by admin for each project.

```sql
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `collaboration_agreements`
Proposals submitted by `joining+` members on open projects.

```sql
CREATE TABLE collaboration_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  work_description TEXT NOT NULL,    -- what the member will do
  expected_reward TEXT NOT NULL,     -- what they expect in return
  status TEXT DEFAULT 'pending',
    -- pending | accepted | active | rejected | completed
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);
```

---

## 5. Role-Based Access Control

Access is enforced at two layers:

**1. Page level (server components)** — Every protected page calls `supabase.auth.getUser()` and fetches `user_profiles.role`. If a condition isn't met, it redirects or renders a gate message.

**2. Database level (RLS)** — Row-level security policies enforce the same rules at the data layer. A helper function handles admin checks:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'circle_lead', 'project_lead')
  );
$$;
```

| Role | Dashboard | Blueprint | Join form | Submit proposal | Admin review |
|---|---|---|---|---|---|
| `explorer` | ✅ (limited) | ✅ read-only | ✅ apply | ✗ | ✗ |
| `joining` | ✅ | ✅ read-only | ✅ view status | ✅ | ✗ |
| `resident` | ✅ | ✅ read-only | ✅ view status | ✅ | ✗ |
| `admin` | ✅ full | ✅ **edit** | ✅ review all | ✅ | ✅ |

---

## 6. Key Pages

| Route | Component | Description |
|---|---|---|
| `/dashboard` | Server | M00 — Personal home screen. Role-scoped modules. |
| `/network` | Server | M01 — Member directory and discover. |
| `/network/discover` | Server | M01 — AI-matched profiles. |
| `/network/profile` | Server | M01 — Your own profile. |
| `/blueprint` | Server + Client | M04 — Community Blueprint wizard. |
| `/join` | Server + Client | M05 — Application form (members) or review panel (admin). |
| `/agreements` | Server + Client | M06 — Open projects + proposals (members) or full review (admin). |
| `/agreements/[id]` | Server + Client | M06 — Submit a collaboration proposal. |
| `/ops` | Server | M07 — Projects list. |
| `/ops/new` | Server + Client | M07 (admin) — Create a project. |
| `/ops/[id]` | Server + Client | M07 — Project detail, updates, proposals panel (admin). |
| `/profile/edit` | Client | Edit profile (8-step wizard). |
| `/changelog` | Static | Release notes. |

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | Supabase Auth (@supabase/ssr) |
| Database | Supabase PostgreSQL |
| Access control | Supabase Row Level Security |
| Hosting | Cloudflare Workers (@opennextjs/cloudflare) |
| AI — Blueprint scanning | MiniMax M2.7 (via /api/claude route) |
| AI — future (Quinn, M09) | Claude API (Anthropic) |
| UI components | shadcn/ui (Radix primitives + Tailwind) |
| Styling | CSS custom properties + Tailwind |
| Payments (planned) | Stripe |
| Telegram (planned) | node-telegram-bot-api |

---

## 8. Deployment

```bash
# Build + deploy to Cloudflare Workers
cd web
npm run deploy
# Runs: opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

**Live URL:** `https://tribes-platform.correa-oscar11.workers.dev`

Environment variables are set in `.dev.vars` (local) and Cloudflare dashboard (production):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `MINIMAX_API_KEY` (for blueprint document scanning)

---

## 9. Module Color Order

All 14 modules follow a rainbow color order for consistent visual identity:

| # | Module | Color |
|---|---|---|
| 00 | Dashboard | Black `#18181b` |
| 01 | Community Network | Brown `#78350f` |
| 02 | Neighborhood Directory | Red `#dc2626` |
| 03 | Resources & Tools | Orange `#ea580c` |
| 04 | Blueprint | Yellow `#ca8a04` |
| 05 | Join | Green `#15803d` |
| 06 | Agreements | Blue `#1d4ed8` |
| 07 | Operations | Indigo `#4338ca` |
| 08 | Contribution Tracking | Violet `#7c3aed` |
| 09 | Governance | Pink `#db2777` |
| 10 | Genesis Bot | White `#e2e8f0` |
| 11 | Quinn | Silver `#94a3b8` |
| 12 | MycoNet Agent | Gold `#b45309` |
| 13 | Hive | (future) |

---

## 10. Relationship to Other Documents

| Document | Purpose |
|---|---|
| `EXECUTIVE-SUMMARY.md` | What the platform is, who it's for, what's live, the vision |
| `EXECUTION-PLAN.md` | Sprint-by-sprint build plan with module specs |
| `ARCHITECTURE.md` (this doc) | Actual DB schema, routes, tech stack, deployment |
| `log.md` | Running changelog of all decisions and changes |

---

*Document version: 2.0*
*Updated: 2026-05-14 — Phase 0 live: M00, M01, M04, M05, M06, M07*

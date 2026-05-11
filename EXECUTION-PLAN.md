# TribesPlatform v2 — Execution Plan

> Version: 1.0 | Date: 2026-05-10 | Status: ACTIVE

---

## Current State

| Module | Status | Notes |
|---|---|---|
| M01 — Community Network | ✅ Live | Profiles, bio wizard, avatar upload, discover page, match scoring (values + skills + interests + OCEAN + MBTI), dark mode |
| M04 — Blueprint Wizard | ✅ Live | 4 phases, 13 steps, guide popovers, AI document import, radar chart, Markdown/PDF export — data stored in browser localStorage |

---

## Architecture Decision

The architecture docs spec a full backend stack (NestJS/Go, Clerk, Redis, Meilisearch). M01 is already running **Supabase** as auth + DB + storage + realtime. The right call is to stay on Supabase and build all modules as Next.js apps on Vercel.

**Why:**
- No separate backend to maintain while the platform is still finding its shape
- Supabase Realtime gives event subscriptions for free — the foundation the agent stack needs
- Row-level security handles multi-tenancy (community isolation) at the DB layer
- Storage, auth, and edge functions all in one place
- Can add pgvector extension for Quinn/MycoNet embeddings without migrating

**Stack locked:**

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) — one app per module or unified monorepo |
| Auth | Supabase Auth (magic link / OTP) |
| Database | Supabase PostgreSQL + pgvector (for agent embeddings) |
| Realtime | Supabase Realtime (for agent event subscriptions) |
| Storage | Supabase Storage |
| Hosting | Vercel (web) + Railway or Fly.io (agent workers) |
| Payments | Stripe |
| AI | Claude API (Anthropic) — Quinn, MycoNet, Governance, M01 matching |
| Telegram | node-telegram-bot-api (Genesis Bot) |

---

## Phase 1 — Connect the Foundations
*Build on what's live. Zero new infra.*

### M04 → Supabase Migration
**What:** Move Blueprint Wizard data from `localStorage` to a `blueprints` Supabase table.
**Why first:** Quick win (mostly a data layer change, no new UI). Unlocks team collaboration on wizard data, enables M02 to link community profiles to their blueprint, and enables Quinn/MycoNet to read community plans.

**Work:**
- Add `blueprints` table to Supabase: `community_id`, `phase`, `values` (JSONB), `scores` (JSONB), `updated_at`
- Add Supabase auth to framework_wizard app (or integrate into M01 session)
- Replace all `localStorage.setItem/getItem` calls with Supabase upsert/select
- Auto-save on field change (debounced)
- Load wizard state on mount from DB, fall back to localStorage for guests

---

### M02 — Neighborhood Directory
**What:** Community profiles — who they are, where they are, what phase they're in, how to visit.
**Depends on:** M01 (user auth), M04 (blueprint link)

**Pages:**
- `/communities` — Browse communities: map view + list, filter by phase (SPARK/PROVE/BUILD/LIVE), location, size
- `/c/[slug]` — Community public profile: cover image, description, phase badge, member count, activity feed, guest book, link to their M04 blueprint
- `/c/[slug]/members` — Member directory with roles
- `/c/new` — Create a community profile (founders)

**DB tables:**
- `communities` — name, slug, description, vision, location, phase, status, cover_image_url, logo_url, created_by
- `community_members` — community_id, user_id, role (founder/core/resident/guest), joined_at
- `check_ins` — community_id, user_id, note, created_at (guest book)
- `posts` — community_id, user_id, content, post_type (update/milestone/question), created_at

---

### M05 — Join
**What:** Application flow from discovery to accepted member.
**Depends on:** M02 (communities exist), M01 (user identity)

**Pages:**
- `/c/[slug]/apply` — Application form (configurable questions per community)
- `/dashboard/applications` — Applicant's status tracker
- `/c/[slug]/admin/applications` — Community team reviews + accepts/rejects
- `/onboarding/[community]` — Post-acceptance orientation checklist + handbook

**DB tables:**
- `applications` — community_id, user_id, status (pending/reviewing/accepted/rejected), answers (JSONB), notes, created_at

**Flow:**
1. User finds community in M02 → clicks "Apply to visit / join"
2. Fills application form → submitted → status: pending
3. Community admin reviews in `/admin/applications` → accepts or rejects
4. On accept → `community_members` row created → onboarding checklist unlocked
5. Automated welcome message (Supabase Edge Function → email via Resend)

---

## Phase 2 — Daily Operations
*The tools communities need week to week.*

### M07 — Operations
**What:** Project boards, task management, basic budget tracking.
**Depends on:** M02, M05 (members assigned to tasks)

**Pages:**
- `/c/[slug]/ops` — Dashboard: active projects, open tasks, budget summary
- `/c/[slug]/ops/projects` — Project list + Kanban board
- `/c/[slug]/ops/projects/[id]` — Project detail: tasks, progress, timeline
- `/c/[slug]/ops/finance` — Income/expense log, budget categories, monthly summary

**DB tables:**
- `projects` — community_id, name, description, status, priority, due_date, created_by
- `tasks` — project_id, assigned_to, title, description, status (todo/in_progress/done/blocked), priority, due_date
- `transactions` — community_id, amount, currency, type (income/expense/contribution), description, created_at

---

### M03 — Resources & Tools
**What:** Curated library of regenerative knowledge — articles, tools, templates, case studies.
**Can build in parallel with M07.*

**Pages:**
- `/resources` — Browse: filter by topic (ecology/social/economy/hardware/governance), type (article/video/tool/template), difficulty
- `/resources/[id]` — Resource detail with description, upvote, save
- `/resources/new` — Submit a resource (community-contributed)

**DB tables:**
- `resources` — title, url, description, resource_type, topics (array), difficulty, submitted_by, community_id (null = global), created_at

**AI layer (later):** Auto-tag submitted resources by topic using Claude API.

---

### M06 — Agreements
**What:** Digital membership agreements + Stripe payment rails.
**Depends on:** M05 (members), M07 (budget context)

**Pages:**
- `/c/[slug]/agreements` — List of active agreements
- `/c/[slug]/agreements/new` — Template selector + clause builder
- `/c/[slug]/agreements/[id]` — View, sign, track signatures
- `/c/[slug]/agreements/[id]/pay` — Stripe payment link for financial agreements

**DB tables:**
- `agreements` — community_id, title, body, agreement_type, status, version, created_by
- `agreement_signatures` — agreement_id, user_id, signed_at
- `transactions` — reused from M07 for payment records

**Stripe integration:**
- Stripe Checkout for one-time payments (membership buy-in, land lease deposit)
- Stripe Subscriptions for recurring contributions
- Webhook → Supabase Edge Function → mark agreement as paid, create transaction record

---

### M08 — Contribution Tracking
**What:** Points + badges that make regenerative action visible.
**Depends on:** M07 (task completions drive points), M05 (onboarding milestones)

**Events that earn points:**
- Task completed → points based on priority/effort
- Application accepted → onboarding badge
- Resource submitted → curation points
- Governance vote cast → participation points
- Check-in at a community → network points

**Pages:**
- `/c/[slug]/contributions` — Community leaderboard, badge showcase
- `/profile/contributions` — Personal points history, badges earned

**DB tables:**
- `rewards` — user_id, community_id, points, badge_type, badge_name, reason, created_at

**Trigger pattern:** Supabase Database Webhooks fire on task/application/resource inserts → Edge Function calculates points → inserts into `rewards`.

---

## Phase 3 — Governance + Dashboard
*The intelligence layer over the operational foundation.*

### M09 — Governance
**What:** AI-facilitated decision-making and conflict resolution for communities.
**Depends on:** M04 (community values as context), M05 (membership roles), M07 (budget decisions)

**Pages:**
- `/c/[slug]/governance` — Active proposals + decision history
- `/c/[slug]/governance/new` — Submit a situation for decision
- `/c/[slug]/governance/[id]` — Situation detail, AI reasoning, vote, outcome

**Flow:**
1. Member submits a situation (e.g. "Should we accept 3 new members next month?")
2. AI (Claude) reasons from community values (M04), current membership (M05), budget (M07)
3. AI presents a recommendation with reasoning
4. Community votes (democracy / sociocracy / meritocracy — configurable)
5. Outcome logged in `governance_decisions`

**DB tables:**
- `governance_decisions` — community_id, title, situation, context_docs (JSONB), decision, governance_mode, status, decided_by, created_at, decided_at

---

### M00 — MyCoNet Dashboard
**What:** Real-time command center for community leadership.
**Depends on:** All modules above (aggregates their data)

**Pages:**
- `/dashboard` — Live view: pending decisions queue, open tasks, budget snapshot, recent member activity, agent status
- `/dashboard/decisions` — Full pending decisions queue with resolve/delegate
- `/dashboard/activity` — All module events in chronological feed

**Implementation:** Supabase Realtime subscriptions on all key tables. No new data — pure aggregation and presentation of what's already in the DB.

---

## Phase 4 — Agent Stack
*The three agents that make the platform alive.*

> Agents are **not** Vercel functions — they are long-running processes. Host on **Railway** or **Fly.io** as Node.js workers.

---

### M12 — MycoNet Agent
**What:** The community brain. Subscribes to all module events and coordinates everything.
**Build first** — Genesis and Quinn depend on it.

**Architecture:**
```
Supabase Realtime listener
    → on any table insert/update (tasks, governance, members, transactions...)
    → classify event type
    → write to community_memory (structured JSONB + vector embedding via pgvector)
    → if MycoNet Pro: push notification to Leadership Telegram group
    → if pending_decisions threshold: send 30-min heartbeat reminder
    → if approval requested by Genesis: route to pending queue
```

**DB tables:**
- `community_memory` — community_id, memory_type, content (JSONB), embedding (vector), importance, created_at
- `pending_decisions` — community_id, source_module, title, description, urgency, status, created_at

**AI:** Claude API with tool use — reads community context, reasons about events, composes leadership summaries.

---

### M10 — Genesis Bot
**What:** Telegram bridge. Members request database changes in chat; leadership approves in chat.
**Depends on:** M12 (routes requests through MycoNet approval queue)

**Architecture:**
```
Community Member in Telegram Group
    @Genesis "record that I finished the garden task"
           ↓
    Genesis parses intent → creates genesis_request record
    Genesis posts structured request to Leadership Group
           ↓
    Leader replies "approve" or "reject"
           ↓
    Genesis → MycoNet API → executes DB write (if approved)
    Genesis confirms outcome in Community Group
           ↓
    MycoNet logs to community_memory
    Quinn notifies affected member
```

**Two Telegram groups per community:**
- Community Group — all members + Genesis
- Leadership Group — CM + dept leads + MycoNet + Genesis

**DB tables:**
- `genesis_requests` — community_id, user_id, request_text, status (pending/approved/rejected), reviewed_by, created_at

**Library:** `node-telegram-bot-api`

---

### M11 — Quinn
**What:** Personal AI per member. Reads across all modules to serve the individual.
**Depends on:** M12 (for cross-module context), M01–M09 (data sources)

**Capabilities:**
- Daily check-in message (Telegram or in-app)
- Goal tracking — remembers what the member said they wanted to work on
- Personalized recommendations: communities, people, skills, resources
- Surfaces relevant governance decisions or tasks
- Reflects member's own patterns back to them over time
- Privacy controls — member can clear Quinn's memory at any time

**Architecture:**
```
Per-member Quinn instance
    → reads personal_ai_memories (goals, history, preferences)
    → reads user's activity across M01–M09
    → Claude API: reason + compose personalized message
    → deliver via in-app notification OR Telegram DM
```

**DB tables:**
- `personal_ai_memories` — user_id, memory_type (goal/preference/history/relationship), content (JSONB), importance, last_accessed

---

### M13 — Hive
**What:** Inter-community network — shared resources, cross-community projects, mutual aid.
**Depends on:** Multiple communities live in M02, M07, M03

**Pages:**
- `/hive` — Network-wide feed: opportunities, needs, milestones, community spotlights
- `/hive/resources` — Shared resource library across all communities
- `/hive/projects` — Cross-community projects + collaboration requests
- `/hive/mutual-aid` — Open mutual aid requests

**DB tables:**
- `hive_nodes` — community_id, node_type (project/resource/opportunity/need), title, description, visibility, created_at

---

## Milestone Gates

| Gate | Condition | Unlocks |
|---|---|---|
| **Foundation** | M01 live + M04 on Supabase | M02 build starts |
| **Community** | M02 + M05 live | M06, M07, M08 build starts |
| **Operations** | M06 + M07 live | M09 build starts |
| **Command** | M09 live | M00 build starts |
| **Agent ready** | M00 live + all DB tables stable | M12 → M10 → M11 build starts |
| **Network** | 3+ communities live in M02 | M13 build starts |

---

## Immediate Next Steps

1. **M04 → Supabase** — migrate wizard localStorage to `blueprints` table (first, quick win)
2. **M02 — Neighborhood Directory** — community profiles, map, activity feed
3. **M05 — Join** — application flow
4. Add `pgvector` extension to Supabase project (needed for M11/M12, add now before schema grows)
5. Add `communities`, `community_members`, `applications`, `posts`, `check_ins` tables to Supabase schema

---

*Document version: 1.0*
*Authors: Oz + Claude*
*Last updated: 2026-05-10*

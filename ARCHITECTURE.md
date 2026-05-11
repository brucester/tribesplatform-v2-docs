# TribesPlatform v2 — Architecture & Database Schema

> Status: ITERATING | Date: 2026-04-11 (updated 2026-05-08)
> This document is the implementation blueprint. See `techstack_AiNSP_RnDev.md` for event-driven architecture, agents, and data flow.

---

## 1. Executive Summary

**What we're building:**
A multi-sided platform ecosystem that supports the entire lifecycle of regenerative community development — from discovering like-minded people, to forming a plan, building the community, and sustaining it long-term.

**Core insight:**
Each of the 14 modules (00–13) represents a functional area that can operate independently but shares data with the whole ecosystem. This is a **modular monolith** with a **shared database** — each module is standalone but communicates through a common data layer.

**Why this platform exists:**
Building a regenerative community is **hard**. You need a way to **find** like-minded people, a way to **plan** your community with proven frameworks, a way to **govern** decisions fairly, a way to **track** finances and projects, a way to **connect** people intentionally, and a way to **learn** from other communities. **TribesPlatform v2 does all of this.**

**Three AI agents work alongside the modules:**
- **Quinn** (Module 11) — personal AI per member
- **MycoNet** (Module 12) — community brain + dashboard (Module 00)
- **Genesis** (Module 10) — Telegram bridge bot

---

## 2. The 14 Modules

| #   | Module                  | Description | Status |
|-----|-------------------------|-------------|--------|
| 00  | MyCoNet Dashboard       | Real-time command center for core team — all module activity, pending decisions, community pulse, agent status. | Planning |
| 01  | Community Network       | Profile-based discovery with AI matching for four archetypes: community members, vision holders, service providers, resource holders. | Building V2 |
| 02  | Neighborhood Directory  | Live map of regenerative neighborhoods. Community profiles, posts, milestones, check-ins, guest book, events. | Building V2 |
| 03  | Resources & Tools       | Curated, community-powered archive of regenerative resources, tools, guides, and case studies — smart-tagged by AI. | Building V2 |
| 04  | Blueprint               | The Regenerative Neighborhood Wizard — guided planning through SPARK → PROVE → BUILD → LIVE with 5 pillars and milestone gates. | Building |
| 05  | Join                    | Application and full onboarding flow — from initial inquiry to welcome. | V1 Building |
| 06  | Agreements              | Digital agreements and Stripe payment rails for community participation. | Planned |
| 07  | Operations              | Project boards, task assignment, budget tracking, and reporting for community teams. | Planned |
| 08  | Contribution Tracking   | Points, badges, and reputation tracking that make regenerative action visible and rewarding. | Planned |
| 09  | Governance              | AI-facilitated governance — mediates conflicts, surfaces proposals, guides decisions across democracy, sociocracy, meritocracy. | V2 Planned |
| 10  | Genesis Bot             | Telegram bot living in community group chat. Can see the database and share what's happening. When a change is requested, posts it to leadership for approval, then MycoNet makes the DB changes. | Planning |
| 11  | Quinn                   | Personal AI guide for each resident — daily reminders, goal tracking, routing community info, helping each member participate at their best. | Planned |
| 12  | MycoNet Agent           | The community brain. Reads across all modules, connects the dots, pushes updates to leadership, runs the approval queue, keeps Genesis and Quinn informed. | Planning |
| 13  | Hive                    | Inter-community layer — connecting neighborhoods into a living network for shared resources, collaboration, and mutual aid. | Planning |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│        Web App (Next.js) • Mobile App (React Native)        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       API GATEWAY                           │
│           REST API + GraphQL • Authentication (Clerk/Auth0)   │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   MODULES     │    │   MODULES     │    │   MODULES     │
│               │    │               │    │               │
│ • Module 01  │    │ • Module 04   │    │ • Module 07   │
│ • Module 02  │    │ • Module 05  │    │ • Module 08   │
│ • Module 03  │    │ • Module 06  │    │ • Module 09   │
│ • Module 10  │    │ • Module 11  │    │ • Module 12   │
│   (Genesis)  │    │   (Quinn)    │    │ (MycoNet)     │
│ • Module 13  │    │              │    │               │
│   (Hive)     │    │              │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    SHARED DATABASE                          │
│                  PostgreSQL + pgvector                       │
│     (All 14 modules share the same DB, row-level隔离)       │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │Meilisearch│        │  Redis   │          │  S3/R2   │
   │ (Search) │          │(Cache)  │          │ (Files) │
   └─────────┘          └─────────┘          └─────────┘
```

**Event-driven updates:** All module writes (01–09, 11, 12, 13) fire PostgreSQL LISTEN/NOTIFY events. MycoNet Agent (12) and Quinn (11) subscribe to these events. See `techstack_AiNSP_RnDev.md` for the full event-driven architecture.

---

## 4. Database Schema

### Core Tables

```sql
-- USERS (all user types)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50), -- 'email', 'google', 'apple'
  profile_type VARCHAR(50), -- 'seeker', 'community', 'provider'
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  interests TEXT[], -- array of tags
  skills TEXT[],
  looking_for TEXT[],
  ai_persona JSONB, -- Quinn's memory of this person
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- COMMUNITIES (Regenerative Neighborhoods)
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  vision TEXT,
  location VARCHAR(255),
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  status VARCHAR(50) DEFAULT 'planning', -- planning, building, live
  phase INTEGER DEFAULT 1, -- 1-4 (SPARK, PROVE, BUILD, LIVE)
  member_count INTEGER DEFAULT 0,
  max_members INTEGER,
  blueprints JSONB, -- links to Blueprint module data
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- COMMUNITY MEMBERS (junction)
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- founder, core, resident, guest
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, pending
  department VARCHAR(100), -- for operations tracking
  joined_at TIMESTAMP DEFAULT NOW(),
  level INTEGER DEFAULT 1, -- for rewards/earn
  UNIQUE(community_id, user_id)
);

-- PROJECTS (within communities - Module 07)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planned',
  priority INTEGER DEFAULT 3,
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TASKS (Module 07)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, done, blocked
  priority INTEGER DEFAULT 3,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TRANSACTIONS (financial - Module 07)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  type VARCHAR(50), -- contribution, expense, distribution, reward
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AGREEMENTS (Module 06)
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL, -- rich text / markdown
  agreement_type VARCHAR(50), -- membership, collaboration, land_lease, etc.
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, active, expired
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AGREEMENT SIGNATURES
CREATE TABLE agreement_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  signature_url TEXT,
  signed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agreement_id, user_id)
);

-- POSTS (Module 02 - Neighborhood Directory)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id), -- null for global
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'update', -- update, milestone, question, resource
  visibility VARCHAR(50) DEFAULT 'network', -- public, network, community, private
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CHECK-INS (Module 02)
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  check_in_type VARCHAR(50), -- guest, resident, visitor
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONNECTIONS (Module 01 - Community Network)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES users(id),
  user_id_2 UUID REFERENCES users(id),
  connection_type VARCHAR(50), -- friend, mentor, collaborator, match
  match_score DECIMAL(5,2), -- 0-100
  status VARCHAR(50) DEFAULT 'pending', -- pending, connected, archived
  created_at TIMESTAMP DEFAULT NOW()
);

-- EVENTS (Module 01 - Community Network calendar)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  created_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50), -- social, governance, learning, work, other
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location VARCHAR(255),
  virtual_link TEXT,
  max_attendees INTEGER,
  rsvp_count INTEGER DEFAULT 0,
  visibility VARCHAR(50) DEFAULT 'community', -- community, network, public
  created_at TIMESTAMP DEFAULT NOW()
);

-- EVENT RSVP
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'going', -- going, maybe, not_going
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- REQUESTS & OFFERS (Module 01)
CREATE TABLE requests_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  request_type VARCHAR(50) NOT NULL, -- 'request' or 'offer'
  category VARCHAR(100), -- skills, items, time, knowledge, other
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, fulfilled, closed
  created_at TIMESTAMP DEFAULT NOW()
);

-- GOVERNANCE DECISIONS (Module 09)
CREATE TABLE governance_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  title VARCHAR(255) NOT NULL,
  situation TEXT NOT NULL, -- the situation requiring decision
  context_docs JSONB, -- links to relevant documentation
  decision TEXT, -- the AI's decision
  governance_mode VARCHAR(50), -- democracy, sociocracy, meritocracy
  status VARCHAR(50) DEFAULT 'pending', -- pending, decided, appealed
  decided_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  decided_at TIMESTAMP
);

-- REWARDS (Module 08 - Contribution Tracking)
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  community_id UUID REFERENCES communities(id), -- null for global
  points INTEGER DEFAULT 0,
  badge_type VARCHAR(50),
  badge_name VARCHAR(100),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RESOURCES (Module 03 - Resources & Tools)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  url TEXT,
  description TEXT,
  resource_type VARCHAR(50), -- article, video, tool, template, course
  topics TEXT[], -- array of topic tags: ecology, human_systems, hardware, economy, technology
  difficulty VARCHAR(50), -- beginner, intermediate, advanced
  community_id UUID REFERENCES communities(id), -- null for global
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PERSONAL AI MEMORIES (Module 11 - Quinn)
CREATE TABLE personal_ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  memory_type VARCHAR(50), -- preference, history, goal, relationship
  content JSONB NOT NULL,
  importance INTEGER DEFAULT 5, -- 1-10
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CROSS-COMMUNITY CONNECTIONS (Module 13 - Hive)
CREATE TABLE hive_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  node_type VARCHAR(50), -- project, resource, opportunity, need
  title VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(50) DEFAULT 'network',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ONBOARDING APPLICATIONS (Module 05 - Join)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
  answers JSONB, -- their responses to application questions
  notes TEXT, -- internal notes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GENESIS REQUESTS (Module 10 - approval queue)
CREATE TABLE genesis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  request_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- COMMUNITY MEMORY (Module 12 - MycoNet Agent)
CREATE TABLE community_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  memory_type VARCHAR(50), -- decision, pattern, relationship, milestone
  content JSONB NOT NULL,
  embedding VECTOR(1536), -- for semantic search
  importance INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MODULE 00: PENDING DECISIONS QUEUE
CREATE TABLE pending_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  source_module VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  urgency VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  status VARCHAR(50) DEFAULT 'open', -- open, resolved
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

---

## 5. Module Specifications

### Module 00: MyCoNet Dashboard
**Purpose:** Real-time command center for core team.

**Features:**
- All module activity in one view
- Pending decisions queue
- Budget status overview
- Member activity feed
- Governance status
- Agent status (Quinn, MycoNet, Genesis)

**Data used:** All tables — aggregated view

---

### Module 01: Community Network
**Purpose:** Profile-based discovery and AI matching.

**Features:**
- User profiles with interests, skills, looking_for
- AI matching for four archetypes: community members, vision holders, service providers, resource holders
- "Near me" geographic search
- Interest and skill filtering
- Direct messaging
- Activity status (online/offline)
- Community calendar with events
- RSVP tracking
- Requests and offers system
- Icebreaker conversation starters
- Weekly connection notifications

**Data used:** `users`, `connections`, `events`, `event_rsvps`, `requests_offers`

---

### Module 02: Neighborhood Directory
**Purpose:** Live map of regenerative neighborhoods.

**Features:**
- Community profiles with cover image, logo, description, vision
- Phase status (SPARK/PROVE/BUILD/LIVE)
- Member directory with roles
- Guest check-ins / guest book
- Activity feed (posts, milestones, updates)
- Project showcase
- Community events

**Data used:** `communities`, `community_members`, `check_ins`, `posts`

---

### Module 03: Resources & Tools
**Purpose:** Curated community archive of regenerative knowledge.

**Features:**
- Filterable resource feed by topics (ecology, human_systems, hardware, economy, technology)
- Difficulty level filtering
- Resource type filtering (article, video, tool, template, course)
- Upvoting / trending
- Personal reading list (save for later)
- Community-contributed resources
- Search (Meilisearch)

**Data used:** `resources`, `users`, `communities`

---

### Module 04: Blueprint
**Purpose:** Guided planning wizard for regenerative neighborhoods.

**Features:**
- Guided wizard: SPARK → PROVE → BUILD → LIVE
- 5 pillars: Ecology, Social, Economy, Hardware, Governance
- 5 milestone gates
- Framework integration (RNF, Community Alchemy, RCOS, CLIPS)
- Auto-save progress
- Export to PDF
- Link plan to community profile

**Data used:** `communities.blueprints` (JSONB)

---

### Module 05: Join
**Purpose:** Application and onboarding flow.

**Features:**
- Configurable application questions per community
- Application status tracking (pending/under review/accepted/rejected)
- Internal notes for core team
- Automated onboarding checklist
- Orientation content / community handbook
- Probationary period tracking
- Welcome sequence

**Data used:** `applications`, `community_members`, `users`

---

### Module 06: Agreements
**Purpose:** Digital agreements and payment rails.

**Features:**
- Agreement templates: membership, land lease, collaboration, financial contribution
- Custom clause builder
- Digital signatures
- Version history
- Stripe integration for payments, subscriptions, recurring billing, escrow
- Full transaction history

**Data used:** `agreements`, `agreement_signatures`, `transactions`

---

### Module 07: Operations
**Purpose:** Project management, task tracking, financial management.

**Features:**
- **Project Boards:** Kanban view, Gantt charts
- **Tasks:** Assignment, priorities, due dates, comments
- **Finance:** Income/expense tracking, budget categories, monthly reports, distribution voting
- **Calendar:** Shared events, meetings, deadlines
- **Documents:** Shared files, SOPs

**Data used:** `projects`, `tasks`, `transactions`, `users`, `communities`

---

### Module 08: Contribution Tracking
**Purpose:** Gamification and rewards for engagement.

**Features:**
- Points system: contributions, milestones, community service, event attendance
- Badge types: Founder, Builder, Helper, Learner, etc.
- Levels and leaderboards (global + per community)
- Reputation scores
- Redeemable rewards (future)

**Data used:** `rewards`, `users`, `community_members`

---

### Module 09: Governance
**Purpose:** AI-facilitated decision-making and conflict resolution.

**Features:**
- Situation submission with context gathering
- AI decision engine reasoned from community values
- Governance modes: democracy, sociocracy, meritocracy
- Searchable decision history
- Anonymous submission option
- Appeal process
- Decision logging

**Data used:** `governance_decisions`, `agreements`, `community_members`

---

### Module 10: Genesis Bot
**Purpose:** Telegram bridge — members request database changes via chat.

**Features:**
- Lives in Community Group and Leadership Group
- Members invoke with "@Genesis record that..." or "@Genesis request..."
- Can see database and share what's happening
- Posts approval requests to Leadership Group
- Confirms approved/rejected outcomes in Community Group
- Approval queue managed via MycoNet Dashboard

**Data used:** `genesis_requests`, all tables (read for context)

---

### Module 11: Quinn
**Purpose:** Personal AI assistant for each resident.

**Features:**
- Personal AI memory per user
- Daily check-ins and reminders
- Goal tracking
- Personalized recommendations: communities, people, resources, skills
- Calendar management help
- Reflection prompts
- Privacy controls — user controls what Quinn remembers
- Integration with all modules (read access)

**Data used:** `personal_ai_memories`, `users`, all tables (read)

---

### Module 12: MycoNet Agent
**Purpose:** Community brain — coordinates all agents and modules.

**Features:**
- Event-driven subscription to all module writes (PostgreSQL LISTEN/NOTIFY)
- Maintains community memory (structured JSONB + vector embeddings via pgvector)
- Pushes real-time updates to Leadership Group (MycoNet Pro)
- Runs Genesis approval queue
- Sends 30-minute heartbeat reminders for pending decisions
- Cross-module intelligence — surfaces connections like "Your governance decision affects your budget"
- Responds to leadership queries in natural language

**Data used:** `community_memory`, `pending_decisions`, `genesis_requests`, all tables

---

### Module 13: Hive
**Purpose:** Inter-community network for collaboration and mutual support.

**Features:**
- Network-wide feed of opportunities and needs
- Cross-community project collaboration
- Shared resource libraries
- Inter-community events
- Mutual aid requests
- Network-wide votes and decisions
- Community spotlight
- Partnership tools

**Data used:** `hive_nodes`, `posts`, `resources`, `communities`

---

## 6. Development Roadmap

### Phase 1: Foundation (Weeks 1–4)
- Database setup (PostgreSQL + pgvector)
- Authentication (Clerk/Auth0)
- User profiles (Module 01)
- Community profiles (Module 02)
- Blueprint integration (Module 04)
- MyCoNet Dashboard skeleton (Module 00)

### Phase 2: Community Building (Weeks 5–8)
- Join module (Module 05)
- Neighborhood Directory feeds (Module 02)
- Resources & Tools (Module 03)
- Basic Operations (Module 07)
- Genesis Bot skeleton (Module 10)

### Phase 3: Governance & Payments (Weeks 9–12)
- Agreements (Module 06)
- Governance (Module 09)
- Stripe integration
- Genesis approval flow

### Phase 4: Intelligence (Weeks 13–16)
- Contribution Tracking (Module 08)
- MycoNet Agent (Module 12) — event-driven brain
- Quinn (Module 11) — personal AI
- MycoNet Pro push layer
- Hive (Module 13)

---

## 7. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js (web) + React Native (mobile) |
| **Backend** | Node.js + NestJS OR Go + Fiber |
| **Database** | PostgreSQL + pgvector |
| **Real-time** | Supabase Realtime OR Postgres LISTEN/NOTIFY |
| **Search** | Meilisearch |
| **Cache** | Redis |
| **Storage** | S3 / Cloudflare R2 |
| **Auth** | Clerk or Auth0 |
| **Payments** | Stripe |
| **AI** | OpenAI GPT-4o / Claude API (for Quinn, MycoNet, Governance) |
| **Telegram** | python-telegram-bot / Node.js telegram libs |
| **Hosting** | Vercel (frontend) + Railway/Fly.io (backend) |

---

## 8. Why "Modular Monolith"?

**Alternative considered: Microservices**

Microservices would add complexity (service discovery, network latency, distributed tracing) for a platform that's still finding its shape.

**Chosen approach: Modular Monolith**

- Each module is a "domain" with its own business logic and API routes
- All modules share one PostgreSQL database
- Modules communicate via direct DB queries (reads) and events (writes)
- Event-driven updates via LISTEN/NOTIFY keep MycoNet and Quinn in sync
- Easy to extract a module to a microservice later if needed

---

## 9. Relationship to Other Documents

| Document | Purpose |
|----------|---------|
| `EXECUTIVE-SUMMARY.md` | High-level overview — what the platform is, 14 modules, 3 agents, user journey |
| `AiNSP_RnDev.md` | Business concept — MycoNet as service provider, SPARK/THRIVE phases, revenue model |
| `techstack_AiNSP_RnDev.md` | Event-driven architecture — data flow, agents, Telegram groups, API design |
| **This document** | Implementation blueprint — module specs, SQL schema, roadmap, tech stack |

---

## 10. Next Steps

1. ~~Oz approves this architecture~~ ✅
2. **Confirm tech stack decisions** — frontend, backend, hosting
3. **Design API contracts** — REST/GraphQL endpoints per module
4. **Sprint planning** — break Phase 1 into weekly tasks
5. **Start building** — begin with database + auth + Module 01

---

*Document version: 1.1*
*Quinn — AI Software Engineer for Oz / RegenTribe*
*Updated: 2026-05-08 — 14 modules (00–13), Genesis=10, Quinn=11, MycoNet=12, Hive=13*
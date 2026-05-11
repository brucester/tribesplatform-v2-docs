# TribesPlatform v2 — Executive Summary

> Version: 2.0 | Date: 2026-05-07 | Status: ITERATING

---

## What Is TribesPlatform v2?

**TribesPlatform v2** is an AI-native operating system for regenerative neighborhoods — a modular ecosystem for building, growing, and sustaining communities that regenerate the land and the people on it.

It's the all-in-one platform: from finding your tribe, to designing your community, forming agreements, governing collectively, and coordinating daily operations. Everything in one place, built for real communities in the real world.

**Three AI agents** work together to keep the system alive:
- **Quinn** — personal AI assistant for each member
- **MycoNet** — the community brain and coordination layer
- **Genesis** — Telegram interface that connects members to the system

---

## The 14 Modules

| #   | Module                    | Description | Status |
| --- | ------------------------- | ----------- | ------ |
| 00  | MyCoNet Dashboard         | Real-time view of all module activity. Core team sees pending tasks, decisions, community pulse, and agent status in one place. | Planning |
| 01  | Community Network         | Profile-based discovery with AI matching for the four key archetypes: community members, vision holders, service providers, resource holders. | Building V2 |
| 02  | Neighborhood Directory    | Live map of regenerative neighborhoods. Community profiles, posts, milestones, check-ins, guest book, events. Onboards neighborhoods via Module 04. | Building V2 |
| 03  | Resources & Tools         | Curated, community-powered archive of regenerative resources, tools, guides, and case studies — smart-tagged by AI. | Building V2 |
| 04  | Blueprint                 | The Regenerative Neighborhood Wizard — guided planning through SPARK → PROVE → BUILD → LIVE with 5 pillars and milestone gates. | Building |
| 05  | Join                      | Application and full onboarding flow — from initial inquiry to welcome. | V1 Building |
| 06  | Agreements                | Digital agreements and Stripe payment rails for community participation. | Planned |
| 07  | Operations                | Project boards, task assignment, budget tracking, and reporting for community teams. | Planned |
| 08  | Contribution Tracking     | Points, badges, and reputation tracking that make regenerative action visible and rewarding. | Planned |
| 09  | Governance                | AI-facilitated governance — mediates conflicts, surfaces proposals, guides decisions across democracy, sociocracy, meritocracy. | V2 Planned |
| 10  | Genesis Bot               | Telegram bot living in community group chat. Can see the database and share what's happening. When a change is requested, Genesis posts it to the leadership chat for approval, then MycoNet makes the changes in the DB. | Planning |
| 11  | Quinn                     | Personal AI guide for each resident — daily reminders, goal tracking, routing community info, helping each member participate at their best. | Planned |
| 12  | MycoNet Agent             | The community brain. Reads across all modules, connects the dots, pushes updates to leadership, runs the approval queue, keeps Genesis and Quinn informed. | Planning |
| 13  | Hive                      | Inter-community layer — connecting neighborhoods into a living network for shared resources, collaboration, and mutual aid. | Planning |

---

## The Three Agents

### Quinn — Personal AI (one per member)
Every member gets their own Quinn. It learns their goals, preferences, and community involvement — then proactively reminds, suggests, and helps them show up well.

- Daily check-ins and reminders
- Personalized community recommendations
- Routes member input up to MycoNet
- Lives in the member's dashboard, Telegram, or WhatsApp

### MycoNet — Community Brain (one per community)
MycoNet is the operating system layer for the whole community. It subscribes to every module event, maintains community memory, pushes real-time updates to leadership, and coordinates the approval queue.

- Subscribes to all module writes (event-driven via PostgreSQL LISTEN/NOTIFY)
- Pushes notifications to the Leadership Telegram group on every module event
- Sends 30-minute heartbeat reminders for pending decisions
- Maintains structured community memory and vector embeddings
- Routes approved changes to the database
- Coordinates with Genesis on approval outcomes

### Genesis — Telegram Bridge (one per community)
Genesis is the community's Telegram bot. Members interact with it in the Community Group to request changes, ask questions, and get confirmations.

- Present in both the Community Group and the Leadership Group
- Members invoke it with "@Genesis record that..." or "@Genesis request..."
- Posts structured requests to the Leadership Group for approval
- Confirms approved/rejected outcomes back in the Community Group
- Passes requests to MycoNet for processing
- Can share database activity info with community group
- All requests require human approval before any database write

---

## How the Three Agents Work Together

```
MEMBER (Telegram Community Group)
    @Genesis "record that I finished the garden task"
           ↓
    Genesis → MycoNet API → MycoNet dashboard (pending queue)
    Genesis → Leadership Group (approval request)
           ↓
    Leader approves in chat OR dashboard
           ↓
    MycoNet → executes DB write → notifies Genesis
           ↓
    Genesis confirms in Community Group
           ↓
    MycoNet → pushes update to Leadership Group
           ↓
    Quinn → notifies affected members
```

**Heartbeat:** Every 30 minutes, MycoNet Pro reminds leadership of all pending decisions until resolved.

### Two Telegram Groups (per community)
- **Community Group** — All members + Genesis. Members make requests, receive confirmations. Genesis shares what's happening in the database.
- **Leadership Group** — Community Manager + Department Leads + MycoNet + Genesis. Approvals happen here. MycoNet Pro pushes all activity here in real-time.

---

## MycoNet Pro — Premium Tier

The free MycoNet tier gives every community the dashboard and database. **MycoNet Pro** adds the proactive AI agent layer:

- Pushes to Leadership Group on every module write (not just dashboard views)
- 30-minute heartbeat reminder for all pending decisions
- Cross-module intelligence — connects patterns across modules
- Reads and synthesizes community data to surface insights
- Responds to leadership queries in natural language

---

## User Journey

1. **Stranger → Member** — Someone discovers the platform, joins Module 01 (Community Network), builds their profile, gets matched with communities.
2. **Member → Applicant** — They explore neighborhoods in Module 02, apply to visit through Module 05.
3. **Applicant → Resident** — Complete onboarding, sign agreements in Module 06, get oriented.
4. **Resident → Contributor** — Work projects in Module 07, earn recognition via Module 08, participate in governance via Module 09.
5. **Resident → Leader** — Access the MycoNet Dashboard (Module 00), oversee all modules, coordinate agents.

Throughout all stages, **Quinn** accompanies each member. **MycoNet** coordinates the community. **Genesis** handles the Telegram interface.

---

## Module Feature Breakdown

### Module 00: MyCoNet Dashboard
Real-time command center for core team. Displays all module activity, pending decisions, budget status, member activity, governance queue, and agent status. Passive view — leaders check it when they want.

### Module 01: Community Network
Profile-based discovery. AI matching for four archetypes: community members, vision holders, service providers, resource holders. Interest and skill filters, geographic search, direct messaging, events, requests/offers.

### Module 02: Neighborhood Directory
Live map of regenerative neighborhoods. Community profiles with phase status (SPARK/PROVE/BUILD/LIVE), activity feeds, milestone tracking, guest check-ins, community events. Onboards new neighborhoods through Module 04.

### Module 03: Resources & Tools
Curated community archive. AI smart-tags uploads (ecology, human systems, hardware, economy, technology). Searchable, filterable, upvotable library of articles, tools, templates, and case studies.

### Module 04: Blueprint
The Regenerative Neighborhood Wizard. Guided planning through SPARK → PROVE → BUILD → LIVE. Five pillars (Ecology, Social, Economy, Hardware, Governance). Five milestone gates. Framework integration (RNF, Community Alchemy, RCOS). PDF export, template library, progress tracking.

### Module 05: Join
Application and onboarding. Configurable application forms, status tracking (pending/under review/accepted/rejected), orientation content, onboarding checklists, probation tracking, automated welcome sequences.

### Module 06: Agreements
Digital agreement templates (membership, land lease, collaboration). Custom clause builder. Digital signatures. Stripe integration for payments, subscriptions, recurring billing, escrow. Full transaction history.

### Module 07: Operations
Project boards (Kanban), Gantt charts, task management, finance dashboard (income/expenses/budget categories), monthly reports, shared calendar, document storage.

### Module 08: Contribution Tracking
Points and badge system. Earn for contributions and milestones. Levels and leaderboards. Reputation scores. Founder, Builder, Helper, Learner badges and more.

### Module 09: Governance
AI-facilitated decision-making. Situation submission with context gathering. AI decision engine reasoned from community values. Supports democracy, sociocracy, meritocracy modes. Searchable decision history. Anonymous option. Appeal process.

### Module 10: Genesis Bot
Telegram bot living in the community group chat. Members invoke it with "@Genesis record that..." or "@Genesis request...". Can see the database and shares what's happening with the community. When a change is requested, posts it to the Leadership Group for approval. Confirms approved/rejected outcomes in the Community Group. All requests require human approval before database write.

### Module 11: Quinn
Personal AI assistant per member. Daily check-ins, goal tracking, personalized recommendations (communities, people, resources, skills), calendar help, reflection prompts. Privacy controls. Reads across all modules to serve the member.

### Module 12: MycoNet Agent
The community brain. Event-driven subscription to all module writes (PostgreSQL LISTEN/NOTIFY). Maintains community memory (structured JSONB + vector embeddings). Pushes real-time updates to Leadership Group via MycoNet Pro. Runs the Genesis approval queue. Sends 30-minute heartbeat reminders for pending decisions. Cross-module intelligence — surfaces connections like "Your governance decision affects your budget."

### Module 13: Hive
Inter-community network layer. Network-wide feed, shared resource libraries, cross-community project collaboration, mutual aid requests, network votes, community spotlight, partnership tools.

---

## Database Architecture

One PostgreSQL database. All modules share data — enabling JOINs across modules and AI reasoning across the full community context.

```
USERS & AUTH
├── users
├── community_members
└── personal_ai_memories

COMMUNITIES
├── communities
├── applications
└── check_ins

CONTENT & SOCIAL
├── posts
├── comments
├── resources
└── events

OPERATIONS
├── projects
├── tasks
├── transactions
└── agreements

CONNECTIONS
├── connections
├── event_rsvps
├── requests_offers
└── governance_decisions

REWARDS
└── rewards
```

---

## Development Phases

### Phase 1: Foundation (Weeks 1–4)
Database setup, authentication, user profiles (Module 01), community profiles (Module 02), Blueprint integration (Module 04).

### Phase 2: Community Building (Weeks 5–8)
Join module (Module 05), Network/Feed (Module 02), Resources & Tools (Module 03), basic Operations (Module 07).

### Phase 3: Governance & Payments (Weeks 9–12)
Agreements (Module 06), Governance (Module 09), Stripe integration.

### Phase 4: Intelligence (Weeks 13–16)
Contribution Tracking (Module 08), Genesis Bot (Module 10), Quinn (Module 11), MycoNet Agent (Module 12), Hive (Module 13), MyCoNet Dashboard (Module 00).

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js (Web) + React Native (Mobile) |
| Backend    | Node.js + NestJS or Go + Fiber     |
| Database   | PostgreSQL + pgvector              |
| Real-time  | Supabase Realtime or Postgres LISTEN/NOTIFY |
| Search     | Meilisearch                         |
| Cache      | Redis                               |
| Storage    | S3 / Cloudflare R2                  |
| Auth       | Clerk or Auth0                      |
| Payments   | Stripe                              |
| AI         | OpenAI GPT-4o / Claude API          |
| Telegram   | python-telegram-bot / Node.js libs |

---

## Why This Platform Exists

Building a regenerative community is hard. You need to find like-minded people, plan with proven frameworks, form legal agreements, govern decisions fairly, track finances and projects, and coordinate daily life — all at the same time.

Most tools are generic. None of them are built for the specific complexity of regenerative neighborhoods — where the goal is not just efficiency but regeneration, not just governance but ecological and social healing.

**TribesPlatform v2 is built for this.**

---

*Status: ITERATING — document updated 2026-05-08*
*Three agents: Quinn (personal, Module 11) · MycoNet (community, Module 12) · Genesis (Telegram bridge, Module 10)*
*14 modules: 00 Dashboard · 01–09 Core modules · 10 Genesis · 11 Quinn · 12 MycoNet Agent · 13 Hive*
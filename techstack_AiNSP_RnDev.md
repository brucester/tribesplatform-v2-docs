# Tech Stack — AiNSP Regenerative Neighborhood Development

> Status: PLANNING | Date: 2026-05-08

---

## Goal

Technical architecture for MycoNet as an AI-native service provider for regenerative communities.

**Core requirements:**
1. 14 modules (00–13) sharing a single PostgreSQL database
2. Every module write fires an event to trigger real-time updates
3. Three agents: Quinn (per member), MycoNet (per community), Genesis (per community)
4. MycoNet Pro pushes to Telegram leadership group on every module write
5. Genesis bridges Telegram community chat to structured database updates
6. All Genesis requests require human approval before database write

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MODULES 00 — 13                          │
│       (All 14 modules write to shared PostgreSQL DB)        │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    [PostgreSQL DATABASE]
                              ↓
            Postgres LISTEN/NOTIFY (or Supabase Realtime)
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
  [MycoNet Agent (Module 12)]               [Quinn Agents]
  - Subscribes to ALL module events         - Per community member
  - Pushes to Leadership Group (Pro)        - Pushes to member's channel
  - Heartbeat: 30 min for pending           - Routes input to MycoNet
  - Maintains community memory               - Holds member memory
        ↓                                           ↓
  [MyCoNet Dashboard (Module 00)]            [Member]
  [CM + Dept Leads control center]           [Dashboard / Telegram / WhatsApp]
        ↓
  [Genesis Telegram Bot (Module 10)]
  - Posts to Leadership Group
  - Confirms in Community Group
  - Receives @Genesis requests
  - Shares DB activity info
        ↓
  [Telegram: Community Group]
  [All members]
```

---

## Data Layer

### PostgreSQL (Primary Database)
- All 14 modules (00–13) write to a **single shared PostgreSQL database**
- Modules are not microservices — they share data, enabling JOINs across modules
- Each community has row-level isolation or its own schema
- Community memory stored as JSONB (structured state) + pgvector (embeddings)

### Why Event-Driven is Required
- MycoNet and Quinn must know immediately when module data changes
- Without events, they are blind — leadership wouldn't get push updates
- Every module write fires an event via Postgres LISTEN/NOTIFY or Supabase Realtime
- This is mandatory for all writable modules (01–09, 11, 12, 13)

---

## The 14 Modules

| #   | Module                  | Database writes fire events? |
|-----|-------------------------|------------------------------|
| 00  | MyCoNet Dashboard       | No (read-only view)          |
| 01  | Community Network       | Yes                          |
| 02  | Neighborhood Directory  | Yes                          |
| 03  | Resources & Tools       | Yes                          |
| 04  | Blueprint               | Yes                          |
| 05  | Join                    | Yes                          |
| 06  | Agreements              | Yes                          |
| 07  | Operations              | Yes                          |
| 08  | Contribution Tracking   | Yes                          |
| 09  | Governance              | Yes                          |
| 10  | Genesis Bot             | No (Telegram bot — reads events, posts to groups) |
| 11  | Quinn                   | Yes                          |
| 12  | MycoNet Agent           | Yes                          |
| 13  | Hive                    | Yes                          |

---

## Event System

### Event Flow
```
Module writes to Postgres
         ↓
   Postgres fires LISTEN/NOTIFY
         ↓
   Event router (filters by event type)
         ↓
   ┌─────────┴─────────┐
   ↓                   ↓
MycoNet             Quinn
(Module 12)         (Module 11)
(pro)               (per member)
```

- Every module write = one event (Modules 01–09, 11, 12, 13)
- Event payload: `{ module, record_type, record_id, action, timestamp, actor }`
- Events are JSON

### Event Types

| Event | Triggered By | Who Receives |
|-------|-------------|--------------|
| `task.created` | Module 07 | MycoNet Pro → Leadership Group |
| `task.completed` | Module 07 | MycoNet Pro → Leadership Group, Quinn → assignee |
| `member.joined` | Module 05 | MycoNet Pro → Leadership Group, Quinn → member |
| `governance.vote_started` | Module 09 | MycoNet Pro → Leadership Group, Quinn → affected members |
| `agreement.signed` | Module 06 | MycoNet Pro → Leadership Group |
| `genesis.request.pending` | Genesis | MycoNet Dashboard (pending queue) |
| `genesis.request.approved` | Leader (chat or dashboard) | Genesis → Community Group, MycoNet → Leadership Group |
| `genesis.request.rejected` | Leader (chat or dashboard) | Genesis → Community Group |

---

## MycoNet — Technical Design

### MyCoNet Dashboard (Module 00) — Viewing Layer
- Web app displaying all 14 modules in real-time
- Community Manager and Department Leads use it as their control center
- Shows: pending decisions, active tasks, budget status, member activity, governance queue, agent status
- Passive view — leaders check it when they want, or leave it open

### MycoNet Agent (Module 12) — Coordination Layer
- AI agent that subscribes to ALL module events (Modules 01–09, 11, 12, 13)
- Maintains community memory: structured state (JSONB) + vector embeddings (pgvector)
- Receives approval signals from leadership (in Telegram chat or dashboard)
- Executes database writes after approval
- Notifies Genesis when a request is approved

### MycoNet Pro — Premium Agentic Layer
- AI agent that pushes to the Telegram Leadership Group on **every module write**
- Makes cross-module connections: "Your governance decision affects Module 7's budget"
- Sends heartbeat reminder every 30 minutes: "Pending decisions: N items awaiting your approval"
- Responds to leadership queries in natural language
- Cross-module intelligence synthesizing data across all 14 modules

### MycoNet Community Memory

```
Incoming Events (from all writable modules)
       ↓
 Event Router
       ↓
 MycoNet Memory Store
       ↓
 ┌─────────────────────────────┐
 │ Structured State (JSONB)    │ ← Current: tasks, members, decisions, calendar
 │ Vector Embeddings (pgvector)│ ← Past: decisions, patterns, community history
 └─────────────────────────────┘
       ↓
 Leadership queries MycoNet → Synthesized natural language response
```

### Hosting
- One MycoNet instance per community
- Can be self-hosted per community OR multi-tenant on a cloud provider
- PostgreSQL per community with row-level isolation OR separate schemas

---

## Quinn — Technical Design (Module 11)

### What It Does
- One Quinn instance per community member
- Receives events relevant to its member (from any module)
- Pushes notifications via: in-app dashboard + Telegram + WhatsApp
- Receives member input and routes it upward to MycoNet
- Maintains per-member memory: profile, preferences, recent activity, goals

### Communication Interface
- **Push (proactive):** Quinn pushes reminders, recommendations, updates
- **Pull (reactive):** Member can chat with Quinn directly at any time
- Member chooses preferred notification channel in settings

### Quinn Memory (Per Member)
```
Static: name, skills, interests, role, community standing
Dynamic: goals, preferences, recent activity, relationships, upcoming tasks
```
Stored in PostgreSQL, updated on events from all modules.

### Hosting
- Single inference instance per community serves all members
- Each member has their own conversation context and memory
- Connects to Telegram/WhatsApp via bot APIs

---

## Genesis — Technical Design (Module 10)

### What It Does
- Telegram bot present in both Community Group and Leadership Group
- Listens for member requests in Community Group: "@Genesis record that..."
- Posts approval requests to Leadership Group chat
- Confirms outcomes back in Community Group
- Can share database activity info with the community group
- Two-way communication with MycoNet: passes requests, receives approval notifications

### Genesis ↔ MycoNet Interface
```
Genesis → MycoNet: New request from member  (POST /genesis-requests)
MycoNet → Genesis: Approval/rejection notification (webhook or polling)
```

### Approval Flow (Technical)
```
1. Member sends "@Genesis record X" in Community Group
         ↓
2. Genesis parses intent, formats as structured request
         ↓
3. Genesis → MycoNet API: POST /genesis-requests { request, member_id, timestamp }
         ↓
4. MycoNet: adds to pending queue in Dashboard
   Genesis: posts request to Leadership Group chat
         ↓
5. Leader approves (in Telegram chat OR on Dashboard)
         ↓
6. MycoNet: executes DB write
   MycoNet: messages Leadership Group (confirms write)
   MycoNet: notifies Genesis
         ↓
7. Genesis: posts "✅ Recorded" confirmation in Community Group
```

### When Leader Approves in Dashboard
- MycoNet messages the Leadership Group chat to notify leaders
- MycoNet notifies Genesis via webhook/polling
- Genesis confirms in Community Group

### Hosting
- One Genesis bot per community
- Telegram Bot API (python-telegram-bot or Node.js telegram libs)
- Connects to MycoNet via REST API

---

## Two-Group Telegram Architecture

### Community Group (Full Community)
- All community members + Genesis bot
- Members invoke Genesis for database change requests
- Genesis shares info about what's happening in the database
- Members receive confirmation notifications
- Organic, conversational interface

### Leadership Group (Private)
- Community Manager + Department Leads only
- MyCoNet Dashboard open as control center
- MycoNet Pro pushes all module write notifications here (real-time)
- Genesis posts approval requests here
- Leaders approve/reject in chat
- MycoNet Pro heartbeat (30 min) posts here

### Telegram Bots Needed
| Bot | Where | Purpose |
|-----|-------|---------|
| **MycoNet Bot** | Leadership Group only | Pushes proactive updates (Pro tier), responds to leadership queries |
| **Genesis Bot** | Both groups | Receives requests, posts approvals, confirms outcomes, shares DB info |

---

## Module Integration Requirement

**Every module write (Modules 01–09, 11, 12, 13) must emit an event.** This is mandatory.

```
Module 07: task status changes to "done"
         ↓
Module 07: fires event "task.completed" { task_id, assignee_id, timestamp }
         ↓
Postgres LISTEN/NOTIFY fires
         ↓
Event reaches MycoNet Pro → pushes notification to Leadership Group
Event reaches Quinn (for assignee) → pushes notification to member
```

---

## Recommended Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend (Dashboard)** | Next.js (web) + React Native (mobile) |
| **Backend** | Node.js + NestJS OR Go + Fiber |
| **Database** | PostgreSQL + pgvector (for embeddings) |
| **Real-time Events** | Supabase Realtime OR Postgres LISTEN/NOTIFY |
| **Search** | Meilisearch |
| **Cache** | Redis |
| **Storage** | S3 / Cloudflare R2 |
| **Auth** | Clerk or Auth0 |
| **Payments** | Stripe |
| **AI (Quinn + MycoNet Pro)** | OpenAI GPT-4o or Claude API |
| **Telegram Bots** | python-telegram-bot / Node.js telegram libs |
| **Hosting** | Vercel (frontend) + Railway/Fly.io (backend) |

---

## Open Technical Questions

1. **Event schema** — JSON schema for all events? Who owns schema versioning?
2. **MycoNet hosting** — Per-community self-hosted OR multi-tenant SaaS on cloud?
3. **Quinn hosting** — One inference server serves all members per community?
4. **Genesis security** — How to prevent spam/abuse? Rate limiting? Member verification?
5. **Offline handling** — What happens when MycoNet goes down? Can community still operate?
6. **Vector DB** — pgvector in Postgres OR separate Pinecone/Milvus?
7. **Data isolation** — Row-level security in Postgres OR separate schemas per community?
8. **Genesis + MycoNet API** — REST? Webhooks? Message queue?

---

*In active iteration with Oz*
*Last updated: 2026-05-08*
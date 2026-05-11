# AiNSP — Regenerative Neighborhood Development
## AI-Native Service Provider for Regenerative Neighborhood Development

> Status: PLANNING — In active iteration with Oz | Date: 2026-05-08

---

## Core Concept

**MycoNet** is an AI-native service provider for launching and sustaining regenerative neighborhoods.

It is NOT just software. It is a **three-agent AI system** that coordinates communities, plus a modular platform of **14 shared apps** (Modules 00–13) that all share a common PostgreSQL database.

**Two-phase service model:**
- **SPARK** — Help people find their people, create the plan, launch the community
- **THRIVE** — Operating system for live communities to run, grow, and govern

---

## The 14 Modules

| #   | Module                  | Role in AiNSP                                                                                          |
|-----|-------------------------|--------------------------------------------------------------------------------------------------------|
| 00  | MyCoNet Dashboard       | Real-time command center for core team — all module activity, pending decisions, community pulse      |
| 01  | Community Network       | Free public funnel — profile-based discovery, AI matching for 4 archetypes                            |
| 02  | Neighborhood Directory  | Discovery layer — live map, community profiles, activity feeds, milestones                            |
| 03  | Resources & Tools       | Curated regenerative knowledge base — AI smart-tagged                                                 |
| 04  | Blueprint               | Guided planning wizard — SPARK → PROVE → BUILD → LIVE with 5 pillars and milestone gates             |
| 05  | Join                    | Application and onboarding flow                                                                        |
| 06  | Agreements              | Digital contracts and Stripe payment rails                                                            |
| 07  | Operations              | Project boards, tasks, budgets, financial tracking                                                    |
| 08  | Contribution Tracking   | Points, badges, reputation — regenerative action made visible                                        |
| 09  | Governance              | AI-facilitated governance — decisions, conflicts, proposals, voting                                  |
| 10  | Genesis Bot             | Telegram bridge — lives in community group, sees DB, shares info, posts change requests to leadership for approval |
| 11  | Quinn                   | Personal AI agent for each resident — daily support, reminders, routing                               |
| 12  | MycoNet Agent           | The community brain — coordinates all agents, aggregates all modules, maintains community memory      |
| 13  | Hive                    | Opt-in network layer — communities share learnings across the MycoNet network                         |

---

## The Three Agents

### 1. Quinn — Personal AI (Module 11)
One Quinn per community member. Personal AI assistant that lives with each individual.

**What it does:**
- Daily reminders: tasks, events, agreements due, responsibilities
- Personalized community, people, and resource recommendations
- Receives input from members and routes it appropriately
- Feeds member context upward to MycoNet (preferences, confirmations, concerns)
- Pushes to members via: in-app dashboard + Telegram + WhatsApp

**Direction:** Bottom-up — individual context flows to MycoNet

---

### 2. MycoNet — Community Brain + Dashboard (Modules 00 + 12)
One MycoNet per community. The operating system layer that coordinates everything.

**Two components:**

**MyCoNet Dashboard (Module 00)** — Viewing layer:
- Real-time display of all 14 modules
- Community Manager and Department Leads use it as their command center
- Shows: pending decisions, active tasks, budget status, member activity, governance queue

**MycoNet Agent (Module 12)** — AI coordination layer:
- Subscribes to all module events (every database write triggers a notification)
- Maintains community memory — structured state (JSONB) + vector embeddings (pgvector)
- **MycoNet Pro** (premium tier): pushes proactive updates to leadership on every module write
- Makes cross-module connections: "Your governance decision affects your budget"
- Sends heartbeat reminders every 30 minutes for pending decisions
- Holds approval queue — all Genesis requests show here pending human approval
- Executes database writes after leadership approves

**Direction:** Top-down + bottom-up — community synthesis flows both ways

---

### 3. Genesis — Telegram Bridge (Module 10)
One Genesis per community. Bridge between organic Telegram conversation and structured database updates.

**Presence:** Lives in both the Community Group and the Leadership Group

**Community Group:**
- Members invoke Genesis: "@Genesis record that we decided X"
- Genesis confirms approvals back to the community
- Can share info about what's happening in the database

**Leadership Group:**
- Genesis posts approval requests directly to the group chat
- Leaders see all pending requests immediately and can approve/reject in chat

**Permission model:**
- Community members can suggest database changes via Genesis
- Only Community Manager and Department Leads can approve
- All requests require human approval before database write

**Direction:** Conversational input → structured database output

---

## How They Work Together

```
MEMBER (Telegram Community Group)
  @Genesis "record that I finished the garden task"
         ↓
  Genesis → MycoNet API → MycoNet Dashboard (pending queue)
  Genesis → posts to Leadership Group (approval request)
         ↓
  Leader approves in chat OR dashboard
         ↓
  MycoNet → writes database
  MycoNet → messages Leadership Group (confirms write)
  MycoNet → notifies Genesis
         ↓
  Genesis confirms in Community Group: "✅ Recorded"
         ↓
  MycoNet Pro → pushes update to Leadership Group
         ↓
  Quinn → notifies affected members
```

**Heartbeat:** Every 30 minutes, MycoNet Pro reminds leadership of all pending decisions until resolved.

---

## Two-Group Telegram Architecture

### Community Group (Full Community)
- All community members + Genesis bot
- Members make requests via @Genesis, receive confirmations
- Genesis shares info about what's happening in the database
- Organic, conversational interface

### Leadership Group (Private)
- Community Manager + Department Leads only
- MyCoNet Dashboard open as control center
- MycoNet Pro pushes proactive updates on every module write
- Genesis posts approval requests
- Leaders approve/reject directly in chat OR on the dashboard

### Telegram Bots Needed
| Bot | Where | Purpose |
|-----|-------|---------|
| **MycoNet Bot** | Leadership Group only | Pushes proactive updates, responds to leadership queries |
| **Genesis Bot** | Both groups | Receives requests, posts approvals, confirms outcomes, shares DB info |

---

## Approval Flow (Full Cycle)

```
1. Member in Community Group: "@Genesis record that we decided to postpone the garden meeting"

2. Genesis → MycoNet API: POST /genesis-requests { request, member_id, timestamp }
         ↓
   MycoNet: adds to pending queue in Dashboard
   Genesis: posts request to Leadership Group chat

3. Leaders see it in Leadership Group chat
   OR check pending queue on MyCoNet Dashboard

4. Leader approves (in chat or dashboard):
   - MycoNet writes to database
   - MycoNet messages Leadership Group (confirms write)
   - MycoNet notifies Genesis

5. Genesis confirms in Community Group: "✅ Recorded: Garden meeting postponed. Updated in Module 7."
   OR if rejected: "❌ Request not approved"
```

**When leader approves in dashboard:** MycoNet messages the Leadership Group chat AND notifies Genesis so Genesis knows to confirm in the Community Group.

---

## User Journey

```
Social media / ads
       ↓
Module 01 (Community Network) — free, public funnel
       ↓
Create your context → Module 04 (Blueprint onboarding)
       ↓
Show up in Module 02 (Neighborhood Directory)
       ↓
Connect with existing communities OR start your own
       ↓
Community gets its own MycoNet instance
       ↓
SPARK (planning, founding, launching)
       ↓
THRIVE (operating, growing, governing)
```

### SPARK Phase
**For:** Communities still planning/building — no land, no structures, no residents yet

**Goal:** Find co-founders, create the blueprint, match with land, build, onboard first residents

**Key modules:** 01, 02, 03, 04, 05, 06

**Exit condition:** First residents move in, community is "live"

### THRIVE Phase
**For:** Live communities transitioning from SPARK, or existing communities that need better systems

**Goal:** Operating system for running, growing, and governing the community

**Key modules:** 07, 08, 09, 10 (Genesis), 11 (Quinn), 12 (MycoNet), 13 (Hive)

**Always includes:** Artifacts of SPARK — onboarding new guests (Module 05), new agreements (Module 06)

---

## Revenue Model

### SPARK Phase — Setup & Matching Revenue

| Revenue Stream             | Description                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| **Resident Commission**    | Commission on residents who find the community through MycoNet and convert (invest or pay rent) |
| **Setup & Onboarding Fee** | One-time fee to set up MycoNet system + guide usage                                             |
| **MycoNet Pro**            | Agent-assisted premium — AI + human support for seamless onboarding                             |

### THRIVE Phase — Ongoing Platform Revenue

| Revenue Stream | Description |
|---------------|-------------|
| **Platform Subscription** | Monthly/annual fee for MycoNet operating system |
| **MycoNet Pro** | Ongoing AI agent support for community management |
| **Hive Network Value** | Communities benefit from aggregated learnings across the network |

---

## Key Definitions

| Term | Definition |
|------|-----------|
| **Quinn** | Personal AI agent for each member (Module 11) — daily support, reminders, notifications, routes context upward |
| **MycoNet** | Community brain + dashboard per community — Module 00 (dashboard) + Module 12 (agent), coordinates all agents |
| **MycoNet Pro** | Premium agentic layer — proactive push updates to leadership on every module write, cross-module intelligence, 30-min heartbeat |
| **Genesis** | Telegram bot (Module 10) in both groups — members invoke for DB change requests, posts to leadership, confirms in community, shares DB info |
| **Hive** | Module 13 — opt-in network layer for sharing learnings across the MycoNet community network |
| **Leadership Group** | Private Telegram group: CM + Dept Leads + MycoNet bot + Genesis |
| **Community Group** | Public Telegram group: all community members + Genesis |

---

*In active iteration with Oz*
*Last updated: 2026-05-08*
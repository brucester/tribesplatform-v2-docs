# TribesPlatform v2 — Change Log

## 2026-05-08
### Module Structure Updated to 14 Modules (00–13)

| #   | Module                 | Description                                           |
| --- | ---------------------- | ----------------------------------------------------- |
| 00  | MyCoNet Dashboard      | Real-time command center for core team                |
| 01  | Community Network      | Profile-based discovery + AI matching                 |
| 02  | Neighborhood Directory | Live map of regenerative neighborhoods                |
| 03  | Resources & Tools      | Curated community archive, AI smart-tagged            |
| 04  | Blueprint              | Guided planning wizard (SPARK → PROVE → BUILD → LIVE) |
| 05  | Join                   | Application and onboarding flow                       |
| 06  | Agreements             | Digital agreements + Stripe payments                  |
| 07  | Operations             | Project boards, tasks, budget tracking                |
| 08  | Contribution Tracking  | Points, badges, reputation                            |
| 09  | Governance             | AI-facilitated governance                             |
| 10  | Genesis Bot            | Telegram bridge for DB change requests                |
| 11  | Quinn                  | Personal AI assistant per member                      |
| 12  | MycoNet Agent          | Community brain — coordinates agents + modules        |
| 13  | Hive                   | Inter-community network layer                         |

### Three Agents Added
- **Quinn** (Module 11) — personal AI per member
- **MycoNet** (Module 12) — community brain + dashboard (Module 00)
- **Genesis** (Module 10) — Telegram bot bridging members to the system

### Documents Updated
- `EXECUTIVE-SUMMARY.md` — v2.0, full 14-module table, 3 agents, user journey, approval flow
- `AiNSP_RnDev.md` — 14-module table, agent architecture, SPARK/THRIVE phases
- `techstack_AiNSP_RnDev.md` — event-driven architecture, MycoNet Pro, Genesis approval flow
- `ARCHITECTURE.md` — v1.1, updated module specs, expanded DB schema, complementary to techstack

### Key Architecture Changes
- **Modular Monolith** with event-driven updates via PostgreSQL LISTEN/NOTIFY
- MycoNet Agent (12) and Quinn (11) subscribe to all module events
- Genesis (10) handles Telegram bridge — member requests → leadership approval → MycoNet writes DB
- Two Telegram groups: Community Group (all members + Genesis) and Leadership Group (CM + Dept Leads + MycoNet + Genesis)
- MycoNet Pro tier: proactive push updates to Leadership Group on every module write

---

## 2026-04-13
### Executive Summary Created
- Created `EXECUTIVE-SUMMARY.md` — comprehensive feature breakdown
- **Merged Module 5 (Feed) into Module 2 (Network)** — both serve same purpose
- Each module has detailed feature table
- Development phases outlined
- Tech stack documented

### Module Changes
- Removed: Module 5 (Feed) — features merged into Network (#2)
- Module 2 (Network) now includes: posts, comments, activity feed, milestones, network-wide sharing

### Key Architecture Decision
- **Modular Monolith** chosen over microservices
- Reason: Platform still finding its shape; complexity should match maturity
- Each module is a "domain" with its own logic, routes, schemas
- All share one PostgreSQL database
- Can extract to microservices later if needed

---

## 2026-04-11 (Earlier)
- Created project folder: `tribesplatform-v2/`
- Created README.md with project overview
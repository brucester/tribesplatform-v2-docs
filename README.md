# TribesPlatform v2

> AI-native operating system for regenerative neighborhoods.

> Last updated: 2026-05-09 21:50 UTC

## Quick Start

**New to the project?** Start with `EXECUTIVE-SUMMARY.md` — it covers what the platform is, all 14 modules, the three agents, and how it works.

## The Docs

Each document serves a different purpose. Read them in order.

| Document | What it's for |
|----------|---------------|
| `EXECUTIVE-SUMMARY.md` | **Start here.** Full platform overview — what it is, all 14 modules, 3 agents, user journey, development phases, tech stack. Broad and accessible. |
| `AiNSP_RnDev.md` | MycoNet as a service. SPARK/THRIVE business model, revenue streams, how the three agents work together, full approval flow. Goes deeper on the AI-native service layer that sits on top of the platform. |
| `ARCHITECTURE.md` | Implementation blueprint — module specs, SQL schema, roadmap, tech stack decisions. For builders and engineers. |
| `techstack_AiNSP_RnDev.md` | Technical architecture — event-driven data flow, PostgreSQL LISTEN/NOTIFY, Telegram groups, Genesis↔MycoNet API, hosting decisions. For engineers building it. |
| `log.md` | Project change log — tracks major decisions, module changes, architecture shifts over time. |
| `README.md` | This file. Quick index and quick reference. |

## The 14 Modules

| # | Module | Purpose |
|---|--------|---------|
| 00 | MyCoNet Dashboard | Core team's real-time command center |
| 01 | Community Network | Profile discovery + AI matching |
| 02 | Neighborhood Directory | Live map of regenerative neighborhoods |
| 03 | Resources & Tools | Curated regenerative knowledge base |
| 04 | Blueprint | Guided planning wizard (SPARK → PROVE → BUILD → LIVE) |
| 05 | Join | Application and onboarding |
| 06 | Agreements | Digital contracts + Stripe payments |
| 07 | Operations | Projects, tasks, budgets |
| 08 | Contribution Tracking | Points, badges, reputation |
| 09 | Governance | AI-facilitated decisions and conflict resolution |
| 10 | Genesis Bot | Telegram bridge — DB change requests via chat |
| 11 | Quinn | Personal AI assistant per member |
| 12 | MycoNet Agent | Community brain — coordinates all agents and modules |
| 13 | Hive | Inter-community network layer |

## Three Agents

- **Quinn** (Module 11) — personal AI, daily reminders, routes member input
- **MycoNet** (Module 12) — community brain, pushes updates, maintains memory
- **Genesis** (Module 10) — Telegram bot, members request changes, leadership approves

## Links

- **Live Platform:** https://tribes-platform.correa-oscar11.workers.dev

## Status

🟡 Iterating — Architecture approved, building V2 (2026-05-09)# test

# TribesPlatform v2 — Change Log

## 2026-05-10
### Module 04 — Blueprint / Framework Wizard: Migrated into Platform
- All files from `agnetO/projects/active/framework regenerative-neighborhood/` moved into `tribesplatform-v2/Modules/m4_framework_wizard/`
- Wizard app (`framework_wizard/`), source framework docs (`framework/`), log and README all present
- Module docs rewritten to reflect current state, correct Vercel URL, and platform context
- Live at: https://framework-wizard.vercel.app

---

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

## 2026-05-02
### Module 01 — Community Network: Full Build (Phase A + B)

#### Auth & Onboarding
- Magic link login + signup pages (`/auth/login`, `/auth/signup`, `/auth/callback`)
- Two-step onboarding flow (`/onboarding`) — username + display name on first sign-in
- Middleware protecting all routes except auth pages

#### Profile System
- `user_profiles` table: username, display_name, avatar_url, bio, status, location, user_types
- `user_bio` table: archetypes, values, OCEAN sliders, MBTI type, goals, skills, interests, creative focus, community fit, fun facts
- Full bio wizard at `/profile/edit` — tabbed cards covering all bio sections
- Avatar upload to Supabase Storage (`avatars` bucket)
- Public profile page at `/u/[username]` displaying all bio data
- Current project URL auto-detected and rendered as clickable link

#### Bio Fields Added
- MBTI type selector — 16 types with cognitive role labels (Architect, Mediator, etc.)
- Favourite colour + favourite animal (fun facts section)
- `ALTER TABLE user_bio ADD COLUMN mbti TEXT, favorite_color TEXT, favorite_animal TEXT`

#### Discover Page (Phase B)
- Server component fetches all profiles + bios
- Client component with live filters: search, status, user type
- Match scoring computed client-side (max 100 pts):
  - Values overlap: 30 pts
  - Skills overlap: 16 pts
  - Interests overlap: 14 pts
  - OCEAN similarity: 18 pts
  - MBTI cognitive compatibility: 22 pts (ideal pair / secondary / same type / temperament / letters)
- MBTI compatibility uses cognitive function theory — not just letter matching
- MemberCard shows: avatar, name, MBTI badge, status, location, types, archetypes, skills, match score + reason pills

#### UI / Design
- Dark mode toggle (`ThemeToggle.tsx`) with localStorage persistence
- Flash-prevention inline script in `layout.tsx`
- `suppressHydrationWarning` on `<html>` to handle theme attribute mismatch

#### Email / Auth Rate Limits
- Identified Supabase default: 4 OTP emails/hour per project
- Configured Resend SMTP (`smtp.resend.com`) in Supabase Auth settings
- Domain `regentribe.co` needs DNS verification in Cloudflare (in progress)
- Interim workaround: `mailer_autoconfirm: true` (bypasses email for now)
- Pending: Add Resend DKIM + SPF records in Cloudflare, then set sender to `hello@regentribe.co`

#### Project Migration
- App codebase moved from `/Users/oscacorrea/dev/regen-platform` to
  `tribesplatform-v2/Modules/m1_comm_network`
- Verified with `diff -rq` (only `.DS_Store` differences)
- Original directory deleted; Vercel link travels with `.vercel/project.json`

#### Docs Updated
- `Modules/m1_comm_network/README.md` — full module spec (stack, pages, DB tables, bio fields, match scoring, local dev, deploy, key files)

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
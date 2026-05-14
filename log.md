# MyCoNet v2 — Change Log

---

## 2026-05-14 — Conflict-aware AI review panel

### Blueprint — AI import conflict resolution
- When AI proposes an answer for a field that already has content, both values are now shown side by side in the review panel
- Conflict fields default to "Keep current" (not auto-accept) to prevent silent overwrites
- Each conflict card shows a status badge while collapsed; click to expand, compare, and choose
- Non-conflict fields (AI-only answers) retain the existing accept/reject toggle behavior

---

## 2026-05-14 — PDF upload, nav links, admin review panels

### Blueprint — PDF upload (large file support)
- Added `pdfjs-dist` for client-side PDF text extraction
- PDF.js loaded dynamically; worker loaded from cdnjs CDN to avoid bundle bloat
- New `extractPdfText()` function extracts text page-by-page with progress callback
- New `extracting` stage shown during PDF parsing with live page progress bar
- File dropzone now accepts `.pdf,application/pdf` in addition to text files
- CHUNK_SIZE increased from 5,000 → 15,000 chars (3× fewer API calls for same document)
- MAX_CHUNKS cap of 30 (450,000 chars) with truncation warning shown in review panel
- Hint text updated: "Works with PDF, .txt, and .md files"

### Nav — direct links for logged-in users
- Operations, Agreements, and Join added to the desktop nav bar
- Edit profile link removed from desktop bar (still in hamburger dropdown)

### Admin role
- Oscar accounts reset to `joining` and manually restored to `admin`
- `is_admin()` RLS function correctly gates admin-only operations

## 2026-05-14 — Phase 0 Complete

### Platform identity clarified
MyCoNet is a **single-community portal** — one URL, one community, all users are members or prospective members of the same project. The platform lets a community share its blueprint, onboard new members, manage active projects, create collaboration agreements, track contributions, and decide together. Multi-community and inter-community features come in later phases.

### M00 — Dashboard (Live)
- Personal home screen for every logged-in member
- Role-scoped panels: Blueprint progress, profile completeness, join application status, active projects, collaboration proposals
- Modules displayed in numeric order with rainbow color scheme
- M02 and M03 shown as coming-soon with v1 external links
- Live counts pulled from M05, M06, M07

### M04 — Blueprint (Shared Community Document)
- Migrated from per-user blueprints to one shared community document
- Admin accounts (role: admin, circle_lead, project_lead) see the Blueprint in edit mode
- All other members see the same Blueprint in read-only mode
- `readOnly` prop added to `BlueprintClient` — skips auto-save, hides import/upload UI, shows "viewing community blueprint" notice
- Added `join_application_questions` field at step 1.4 (First Agreements) — admin writes one question per line; these appear on the M05 Join form
- AI document scanning (MiniMax M2.7) fills wizard fields from uploaded PDFs/docs; reduced chunk size to 5,000 chars, CONCURRENCY reduced to 2 to avoid MiniMax 524 timeouts

### M05 — Join (Application + Admin Review)
- Members see an application form (questions pulled from Blueprint step 1.4)
- Explorer gate: must create account to apply
- Submitted: shows status badge (pending / reviewing / accepted / rejected) and answers
- **Admin view**: full review panel at `/join` — filter by status, expand each applicant to read answers, add admin notes, accept / mark reviewing / decline
- Accepting sets `collaboration_agreements.status = 'accepted'` and updates `user_profiles.role` to `joining`
- RLS policies added: `is_admin()` function grants admin read-all + update-all on `applications` and update-role on `user_profiles`

### M06 — Agreements (Collaboration Proposals)
- Joining+ members browse projects open for collaboration and submit proposals (what I'll do + what I expect in return)
- One proposal per project per user (enforced by UNIQUE constraint)
- **Admin view**: full review panel at `/agreements` — shows all proposals across all projects, filtered by status (pending / accepted / active / completed / rejected)
- Each proposal shows the proposer's name, project name, work description, expected reward
- Admin actions: Accept → Active → Complete; or Decline at any stage
- Admin notes field on each proposal
- Status badge updates immediately in the UI (optimistic update)

### M07 — Operations (Project Management)
- Admin creates projects with title, description, open-for-collaborators toggle
- Project detail page: timeline updates feed (admin posts), right panel with settings and collaboration proposals
- Open projects with `open_for_collaborators = true` surface in M06 for member proposals
- Non-admin members see the updates feed and a "Propose collaboration" link if the project is open

### Role system
- Roles: `explorer` / `joining` / `resident` / `circle_lead` / `project_lead` / `admin`
- Oscar and Sonia accounts set to `admin`
- Logo routes logged-in users to `/dashboard`, logged-out users to landing page

### Module colors — rainbow order
Black → Brown → Red → Orange → Yellow → Green → Blue → Indigo → Violet → Pink → White → Silver → Gold
(M00–M13)

### Profile edit improvements
- OCEAN personality sliders restored to show pole labels (e.g. "Conventional / Curious & creative" for Openness)
- Myers-Briggs type field now has "click here to find yours" link → 16personalities.com

### Deployment
- Migrated from Vercel to Cloudflare Workers using `@opennextjs/cloudflare`
- Vercel Hobby capped function execution at 60s; Cloudflare Workers charge CPU time only — MiniMax 524 gateway timeouts resolved
- Deploy command: `cd web && npm run deploy`
- Live: `https://tribes-platform.correa-oscar11.workers.dev`

### Documents updated
- `EXECUTIVE-SUMMARY.md` — v3.0, reflects single-community portal, live modules, core loop, tech stack
- `ARCHITECTURE.md` — v2.0, actual Supabase schema, RLS setup, routes, color order
- `EXECUTION-PLAN.md` — v2.0, Phase 0 marked complete, Phases 1–5 planned with specs

---

## 2026-05-10 — Execution Plan Created

### Stack decision
Staying on Supabase (auth + DB + realtime) and Next.js App Router on Cloudflare Workers — no separate backend while platform is finding its shape.

### Documents created
- `EXECUTION-PLAN.md` v1.0 — Phase-by-phase build plan

---

## 2026-05-08 — Module Structure Updated to 14 Modules (00–13)

### Three agents added
- **Quinn** (Module 11) — personal AI per member
- **MycoNet** (Module 12) — community brain + dashboard
- **Genesis** (Module 10) — Telegram bridge bot

### Documents updated
- `EXECUTIVE-SUMMARY.md` v2.0 — full 14-module table, 3 agents, user journey, approval flow
- `ARCHITECTURE.md` v1.1 — updated module specs, expanded DB schema

### Key architecture decisions
- Modular monolith with event-driven updates via PostgreSQL LISTEN/NOTIFY
- Two Telegram groups per community: Community Group (all members + Genesis) and Leadership Group (CM + Dept Leads + MycoNet + Genesis)
- MycoNet Pro tier: proactive push updates to Leadership Group on every module write

---

## 2026-04-13 — Executive Summary Created

- Created `EXECUTIVE-SUMMARY.md` — comprehensive feature breakdown
- Merged Module 5 (Feed) into Module 2 (Network)
- Modular Monolith chosen over microservices — complexity should match maturity

---

## 2026-04-11 — Project Start

- Created project folder `tribesplatform-v2/`
- Created README with project overview

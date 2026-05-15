# MyCoNet v2 — Claude Code Context

Read this first. It gives you everything you need to work effectively on this project.

---

## What this project is

**MyCoNet** is a **member portal for a single regenerative community project**. It is not a multi-community marketplace — it is one community's operating system. All users on the platform are members (or prospective members) of the same project.

New members join **by invitation only** — someone already in the community shares a link. The invite is tracked so the community always knows who brought who in.

### Member role journey

| Role | How they get it | What they can access |
|---|---|---|
| `explorer` | Invited → creates account | View Blueprint (M04), browse member profiles (M01) |
| `joining` | Completes Module 5 (Join onboarding) | Everything above + their own profile editing |
| `resident` | Signs agreements in Module 6 | Everything above + Operations (M07, scoped to their agreements), shows up in Contribution Tracking (M08), can vote in Governance (M09) |
| `circle_lead` | Assigned by admin | Resident access + can edit their circle's sections in Blueprint (M04) |
| `project_lead` | Assigned by admin | Resident access + can manage members, see admin views |
| `admin` | Assigned directly | Full access — edit entire Blueprint, manage roles, generate invite links |

### The two live modules

1. **Blueprint Wizard (M04)** — The community's living planning document. Walks through SPARK → PROVE → BUILD → LIVE phases. Only `admin` (and later `circle_lead`) can edit. All members can view. AI document scanning pre-fills the wizard from uploaded PDFs/docs. Export to Markdown/PDF.

2. **Community Network (M01)** — Member profiles, match scoring, offers/seeks. All members fill their own profile. Explorers can browse but are read-only until they advance to `joining`.

---

## Deployment

- **Platform:** Cloudflare Workers (NOT Vercel — migrated away due to Vercel Hobby's 60s timeout being incompatible with MiniMax M2.7's 60–120s response time)
- **Live URL:** https://tribes-platform.correa-oscar11.workers.dev
- **Deploy command:** `cd web && npm run deploy`
- **Config:** `web/wrangler.jsonc`
- **Adapter:** `@opennextjs/cloudflare` v1.19.9 (OpenNext)
- **Current version:** v3.01 (shown on Blueprint welcome screen upload button)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.6 (App Router) |
| Database / Auth | Supabase |
| Hosting | Cloudflare Workers via OpenNext |
| AI model | MiniMax M2.7 (reasoning model) |
| Styling | CSS custom properties + Tailwind (minimal), no component library |

---

## Repository structure

```
tribesplatform-v2/
├── web/                        ← The live Next.js app (this is what you work in)
│   ├── src/app/
│   │   ├── blueprint/          ← Blueprint wizard (BlueprintClient.tsx is the big one)
│   │   │   ├── BlueprintClient.tsx   ← Main wizard UI, document export, AI import
│   │   │   ├── wizard-data.ts        ← All FW_DATA: phases, steps, fields, pillars
│   │   │   └── wizard.css            ← Wizard-specific styles
│   │   ├── api/claude/route.ts ← MiniMax proxy API endpoint
│   │   ├── changelog/page.tsx  ← Release notes page
│   │   ├── network/            ← Community network module
│   │   └── layout.tsx / page.tsx / globals.css
│   ├── src/components/
│   │   ├── Nav.tsx             ← Global nav (Network, Blueprint, Changelog links)
│   │   └── ThemeToggle.tsx
│   └── wrangler.jsonc          ← Cloudflare deployment config
│
├── Modules/
│   ├── m4_framework_wizard/    ← Original standalone wizard app (reference only)
│   └── m1_comm_network/        ← Original standalone network app (reference only)
│
└── CLAUDE.md                   ← This file
```

The `Modules/` folder contains the original working standalone apps. **Use them as reference** when something isn't working in the web app — especially `document.jsx` for export logic and `import.jsx` for AI scanning logic.

---

## AI document scanning — critical config

File: `web/src/app/api/claude/route.ts`

- **Model:** MiniMax M2.7 (reasoning model — always outputs `<think>...</think>` blocks)
- **`max_completion_tokens: 8192`** — covers BOTH thinking tokens AND output. Do not raise above 8192 (causes MiniMax 524 gateway timeout). Do not lower below 8192 (JSON gets truncated mid-object).
- **`CHUNK_SIZE = 5000`** chars in `BlueprintClient.tsx` — do not increase (larger chunks = longer thinking = MiniMax timeout)
- **`CONCURRENCY = 4`** parallel chunk calls
- **No system message** — adding one makes M2.7 think much harder, burning the token budget
- **`temperature: 0.3`**
- **No `export const runtime = 'edge'`** — breaks the OpenNext bundler with `TypeError: Cannot read properties of undefined (reading 'default')`
- The `extractJSON()` function on the server strips `<think>` blocks before parsing

### Environment variables
- `MINIMAX_API_KEY` — set as a Cloudflare Worker secret via `wrangler secret put MINIMAX_API_KEY` (NOT in wrangler.jsonc)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — in `wrangler.jsonc` vars section
- Local dev: `.dev.vars` file in `/web` (gitignored)

### Email (auth magic links)
- **Provider:** Resend (configured in Supabase → Authentication → SMTP Settings)
- **From address:** `noreply@tribesplatform.app`
- **Domain verified:** `tribesplatform.app` DNS records added via SiteGround DNS Zone Editor
- **SMTP host:** `smtp.resend.com`, port `465`, username `resend`, password = Resend API key
- If magic link emails stop working: check Resend dashboard for sending errors, verify domain hasn't expired

---

## What has been built (as of v3.01)

### Infrastructure
- Migrated from Vercel → Cloudflare Workers (May 2026)
- OpenNext adapter configured and working
- Supabase auth + user_profiles + blueprints tables connected

### Blueprint Wizard
- Full 4-phase RNF wizard (SPARK, PROVE, BUILD, LIVE) with ~30+ steps
- Gate checkpoints between phases (with pass/fail/soft-pass status)
- Radar chart for 5 RNF pillars (Ecology, Social, Economy, Hardware, Governance)
- 5-Spiral timeline visualization
- Mobile swipe navigation (3-tab: Steps / Content / Radar)
- AI document scanning (MiniMax M2.7) — working as of v2.11
- "← Home" link in wizard sidebar and mobile nav
- Document export: modal preview + Download Markdown + Print/Save PDF

### Community Network
- Profile discovery with match scoring
- Offers/seeks/travel plan fields

### Other pages
- `/changelog` — timeline release notes page
- `/` — landing page with module overview

---

## What is next / ideas to explore

### Immediate priorities
- **M00 MyCoNet Dashboard** — personal heads-up display for every member. The home screen after login. Role-scoped panels: explorer sees Blueprint + profiles; resident adds tasks, contributions, governance votes; admin adds pending decisions + member management. Built on top of existing module data — no new DB tables needed to start.
- **Invite system** — admin generates invite links with a code; invite row tracks `created_by`, `used_by`, `role_on_join`, `expires_at`. `/join?code=abc123` validates the code and routes to signup.
- **Role column on user_profiles** — `role` text field (explorer/joining/resident/circle_lead/project_lead/admin). Gates Blueprint editing, Operations, Contribution Tracking, Governance behind the right roles.
- **M04 → Supabase migration** — Blueprint data is still in localStorage. Needs to move to a `blueprints` table so all members see the same community plan (not per-browser).
- **M05 Join module** — application/onboarding flow that advances a user from `explorer` → `joining`
- **M06 Agreements** — digital agreements that advance `joining` → `resident` and scope their M07 access

### Later
- **Dashboard as home screen** — personal dashboard after login, not just a landing page
- **GitHub → Cloudflare auto-deploy** — currently deploying manually with `npm run deploy`
- **Improve document export styling** — better typography and page breaks for PDF export
- **Circle lead Blueprint sections** — scope M04 edit permissions to specific pillars per circle_lead

---

## Key things NOT to do

- Do NOT add `export const runtime = 'edge'` to any route — breaks OpenNext
- Do NOT raise `max_completion_tokens` above 8192 for MiniMax calls — causes 524 timeout
- Do NOT increase `CHUNK_SIZE` above ~7000 chars — same timeout issue
- Do NOT add a system message to MiniMax calls — makes the model think much harder
- Do NOT deploy secrets in `wrangler.jsonc` — use `wrangler secret put`

---

## Common commands

```bash
# Deploy to Cloudflare
cd web && npm run deploy

# Local dev
cd web && npm run dev

# Tail live Cloudflare logs
npx wrangler tail tribes-platform --format=pretty

# Type check
cd web && npx tsc --noEmit
```

---

## Version history summary

| Version | What changed |
|---------|-------------|
| v3.01 | Version bump |
| v2.13 | Document export modal (preview + Markdown download + Print/PDF) |
| v2.12 | Changelog page at /changelog, "← Home" nav in wizard |
| v2.11 | AI scanning working — chunk size 5000, max_completion_tokens 8192 |
| v2.10 | Raised tokens to 16384 — caused MiniMax 524 timeout, reverted |
| v2.09 | Debug logging in /api/claude |
| v2.08 | Cloudflare Workers migration, removed runtime='edge', extractJSON() |
| v2.07 | Parallel scanning (CONCURRENCY=4), fixed token budget |
| v2.06 | Version label on upload button |
| v2.05 | Initial foundation |

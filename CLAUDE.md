# MyCoNet v2 — Claude Code Context

Read this first. It gives you everything you need to work effectively on this project.

---

## What this project is

**MyCoNet** is a **member portal for a single regenerative community project**. It is not a multi-community marketplace — it is one community's operating system. All users on the platform are members (or prospective members) of the same project.

New members join **by invitation only** — someone already in the community shares a link. The invite is tracked so the community always knows who brought who in.

### Member role journey

| Role | How they get it | What they can access |
|---|---|---|
| `explorer` | Invited → creates account | /home explainer, Blueprint (M04), browse member profiles (M01) |
| `joining` | Completes Module 5 (Join onboarding) | Everything above + their own profile editing |
| `resident` | Signs agreements in Module 6 | Everything above + Operations (M07), Contributions (M08), can vote in Governance (M09) |
| `circle_lead` | Assigned by admin | Resident access + can edit their circle's sections in Blueprint (M04) |
| `project_lead` | Assigned by admin | Resident access + can manage members, see admin views |
| `admin` | Assigned directly | Full access — edit entire Blueprint, manage roles, generate invite links |

---

## Deployment

- **Platform:** Cloudflare Workers (NOT Vercel — migrated due to 60s timeout incompatibility with MiniMax M2.7)
- **Live URL:** https://myconet.correa-oscar11.workers.dev
- **Deploy command:** `cd web && npm run deploy:cf`
- **Config:** `web/wrangler.jsonc`
- **Adapter:** `@opennextjs/cloudflare` v1.19.9 (OpenNext)
- **Current version:** v3.01 (shown under logo in AppTopBar)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.6 (App Router) |
| Database / Auth | Supabase |
| Hosting | Cloudflare Workers via OpenNext |
| AI model | MiniMax M2.7 (reasoning model) — Blueprint doc scanning only |
| Styling | CSS custom properties + inline styles (no Tailwind in new components) |

---

## Repository structure

```
tribesplatform-v2/
├── web/                        ← The live Next.js app (this is what you work in)
│   ├── src/app/
│   │   ├── home/               ← /home — portal explainer with live DB content per module
│   │   ├── dashboard/          ← M00 — 4 stat cards + module grid + activity feed
│   │   ├── network/            ← M01 — member profiles, discovery, AI matching
│   │   ├── blueprint/          ← M04 — shared community planning document
│   │   │   ├── BlueprintClient.tsx   ← Main wizard UI, AI import, export
│   │   │   ├── wizard-data.ts        ← All FW_DATA: phases, steps, fields, pillars
│   │   │   └── wizard.css
│   │   ├── join/               ← M05 — application form + admin review
│   │   ├── agreements/         ← M06 — collaboration proposals
│   │   ├── ops/                ← M07 — project management
│   │   ├── contributions/      ← M08 — achievements (Profile Pioneer badge live)
│   │   ├── governance/         ← M09 — proposals, consent/concern/object voting
│   │   ├── profile/edit/       ← 8-step profile wizard
│   │   ├── u/[username]/       ← Public member profile pages
│   │   ├── api/claude/route.ts ← MiniMax proxy API endpoint
│   │   └── auth/               ← Login, signup, callback, reset-password
│   ├── src/components/
│   │   ├── AppShell.tsx        ← Shell layout (top bar + side nav) for all app pages
│   │   ├── AppTopBar.tsx       ← Top navigation — logo, search, user pill, profile completion bar
│   │   ├── AppSideNav.tsx      ← Left module navigation (M00–M09)
│   │   └── [legacy components]
│   ├── src/contexts/
│   │   └── ProfileCompletion.tsx  ← Shared context for profile completion % (AppTopBar ↔ wizard)
│   ├── src/lib/
│   │   └── module-meta.ts      ← All 14 module colors, labels, descriptions
│   └── wrangler.jsonc          ← Cloudflare deployment config
│
├── Modules/
│   ├── m4_framework_wizard/    ← Original standalone wizard app (reference only)
│   └── m1_comm_network/        ← Original standalone network app (reference only)
│
└── CLAUDE.md                   ← This file
```

---

## App Shell architecture

Every page (except `/` and `/auth/*`) is wrapped in `AppShell.tsx`:
- **AppTopBar** — logo + v3.01 + search bar + bell + user pill (→ `/profile/edit`) + profile completion bar
- **AppSideNav** — M00–M09 module links
- **main** — page content

`ProfileCompletionProvider` wraps the shell. `AppTopBar` seeds the `%` value on load from DB; the profile wizard pushes live updates as the user fills fields.

---

## AI document scanning — critical config

File: `web/src/app/api/claude/route.ts`

- **Model:** MiniMax M2.7 (reasoning model — always outputs `<think>...</think>` blocks)
- **`max_completion_tokens: 8192`** — do not raise (524 gateway timeout). Do not lower (JSON truncation).
- **`CHUNK_SIZE = 5000`** chars in `BlueprintClient.tsx` — do not increase
- **`CONCURRENCY = 4`** parallel chunk calls
- **No system message** — adding one makes M2.7 think harder, burning the token budget
- **`temperature: 0.3`**
- **No `export const runtime = 'edge'`** — breaks the OpenNext bundler
- The `extractJSON()` function on the server strips `<think>` blocks before parsing

### Environment variables
- `MINIMAX_API_KEY` — Cloudflare Worker secret via `wrangler secret put MINIMAX_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — in `wrangler.jsonc` vars section
- Local dev: `.dev.vars` file in `/web` (gitignored)

### Email (auth magic links)
- **Provider:** Resend (configured in Supabase → Authentication → SMTP Settings)
- **From address:** `noreply@tribesplatform.app`
- **Domain verified:** `tribesplatform.app` DNS records via SiteGround DNS Zone Editor
- **SMTP host:** `smtp.resend.com`, port `465`, username `resend`, password = Resend API key

---

## What has been built (v3.01)

### Infrastructure
- Cloudflare Workers via OpenNext — deployed and stable
- Supabase auth + all module tables connected
- AppShell with consistent top bar + side nav on all pages

### `/home` — Portal Explainer
- Server component fetching live DB data for all modules
- Interactive sections for M01 (real members), M04 (animated blueprint phases), M05 (values checkboxes), M06 (projects + proposal form), M07 (live deliverables), M08/M09 (demo)
- All module content links to the respective module route
- M01 member cards link to `/u/[username]`

### M00 — Dashboard (`/dashboard`)
- 4 stat cards: Members, Blueprint readiness, Open projects, Open proposals
- 2-column: module grid (left) + activity feed + next-step card (right)
- Redirects unauthenticated users to `/home`

### M01 — Community Network
- Profile discovery, AI match scoring, tile/list view
- Public member profiles at `/u/[username]`

### M04 — Blueprint
- Full 4-phase wizard with AI document scanning
- Conflict-aware import review panel
- Document export (Markdown + Print/PDF)

### M05 — Join
- Application form from Blueprint questions
- Admin review panel
- Reapply flow: rejected applicants can submit a new application

### M06 — Agreements
- Collaboration proposals on open projects
- Admin review + status flow

### M07 — Operations
- Project management with timeline updates

### M08 — Contributions (`/contributions`)
- Achievements catalog page
- **Profile Pioneer badge** — awarded when profile reaches 100% completion
- `user_achievements` table with RLS

### M09 — Governance (`/governance`)
- Open proposals list with 4 decision mode filters (Consent ☉, Democracy ☑, Meritocracy △, AI ◇)
- Vote: consent / concern / object (click again to un-vote)
- Concern banner when concerns are logged
- Discussion thread per proposal (post with ⌘↵)
- New proposal modal (title, description, decision mode, days open)
- `proposals`, `proposal_votes`, `proposal_comments` tables with RLS

### Profile completion bar
- Thin bar under the top nav showing profile % (11-point check)
- Disappears at 100%
- Updates live as the user fills the profile wizard (shared via `ProfileCompletionContext`)
- Completion checks: avatar, first_name, headline, city, user_types, values_principles, skills, goals, 1+ offer, 1+ request, 1+ travel plan

### Profile wizard
- 8-step wizard at `/profile/edit`
- Reachable by clicking user icon in top nav
- Pushes live completion % to AppTopBar via context

---

## Key things NOT to do

- Do NOT add `export const runtime = 'edge'` to any route — breaks OpenNext
- Do NOT raise `max_completion_tokens` above 8192 for MiniMax calls — 524 timeout
- Do NOT increase `CHUNK_SIZE` above ~7000 chars — same timeout
- Do NOT add a system message to MiniMax calls — token budget burn
- Do NOT deploy secrets in `wrangler.jsonc` — use `wrangler secret put`
- Do NOT use `npm run deploy` — use `npm run deploy:cf`

---

## Common commands

```bash
# Deploy to Cloudflare
cd web && npm run deploy:cf

# Local dev
cd web && npm run dev

# Tail live Cloudflare logs
npx wrangler tail myconet --format=pretty

# Type check
cd web && npx tsc --noEmit
```

---

## Version history summary

| Version | What changed |
|---------|-------------|
| v3.01 | /home portal explainer, M08 contributions + achievements, M09 governance (proposals/votes/comments), profile completion bar, AppShell with side nav, reapply flow, M01 member card links |
| v2.13 | Document export modal (preview + Markdown + Print/PDF) |
| v2.12 | Changelog page, "← Home" nav in wizard |
| v2.11 | AI scanning — chunk size 5000, max_completion_tokens 8192 |
| v2.08 | Cloudflare Workers migration, removed runtime='edge', extractJSON() |
| v2.07 | Parallel scanning (CONCURRENCY=4) |

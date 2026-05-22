# Contributing to MyCoNet

MyCoNet is an open-source community platform built with Next.js and Supabase. This guide explains how to contribute to a specific module without needing to understand the whole codebase.

## Quick start

```bash
git clone https://github.com/your-org/tribesplatform-v2
cd tribesplatform-v2/web
cp .env.example .env.local   # fill in Supabase credentials
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project structure

```
web/src/
├── app/          Next.js routes (thin entry points — mostly re-exports)
├── core/         Shared infrastructure (DB client, UI components, types)
└── modules/      Feature modules — one folder per module
    ├── m00-dashboard/
    ├── m01-network/
    ├── m04-blueprint/
    ├── m05-join/
    ├── m06-agreements/
    ├── m07-ops/
    ├── m08-contributions/
    ├── m09-governance/
    └── home/
```

## Working on a module

Each module is self-contained. Pick the one you want to contribute to and read its `README.md`:

| Module | Path | Route |
|--------|------|-------|
| M00 Dashboard | `src/modules/m00-dashboard/` | `/dashboard` |
| M01 Network | `src/modules/m01-network/` | `/network` |
| M04 Blueprint | `src/modules/m04-blueprint/` | `/blueprint` |
| M05 Join | `src/modules/m05-join/` | `/join` |
| M06 Agreements | `src/modules/m06-agreements/` | `/agreements` |
| M07 Operations | `src/modules/m07-ops/` | `/ops` |
| M08 Contributions | `src/modules/m08-contributions/` | `/contributions` |
| M09 Governance | `src/modules/m09-governance/` | `/governance` |

## Import conventions

| What you need | Import from |
|--------------|-------------|
| Supabase client (server) | `@/core/lib/supabase/server` |
| Supabase client (browser) | `@/core/lib/supabase/client` |
| UI primitives (Button, Card…) | `@/core/components/ui/...` |
| Database types | `@/core/types/database` |
| Module metadata | `@/core/lib/module-meta` |
| Match scoring | `@/modules/m01-network/lib/match-score` |
| Blueprint compute | `@/modules/m04-blueprint/lib/blueprint-compute` |

Do **not** import from `@/lib/`, `@/components/`, `@/contexts/`, or `@/types/` — those paths are legacy and should not be used.

## Route files

Files under `src/app/` are thin entry points. If you need to change page logic, edit the component in `src/modules/`, not the `page.tsx` in `src/app/`.

```ts
// src/app/governance/page.tsx — just a re-export, don't edit
export { default } from '@/modules/m09-governance/GovernanceClient'
```

## Database migrations

We use Supabase for the database. If your contribution requires a schema change:

1. Write the SQL migration
2. Apply it to the dev project: `supabase db push` or use the Supabase dashboard
3. Regenerate types: `npm run cf-typegen` (or update `src/core/types/database.ts` manually)
4. Include the migration SQL in your PR description

## Submitting a PR

1. Fork the repo and create a feature branch: `git checkout -b feature/m07-deliverable-tags`
2. Make your changes inside the relevant `src/modules/mXX-*/` folder
3. Run `npx tsc --noEmit` to check for TypeScript errors
4. Run `npm run dev` and test the relevant route manually
5. Open a PR with a clear description of what changed and why

## Code style

- No comments unless the *why* is non-obvious
- No error handling for impossible scenarios — trust the DB schema and Next.js guarantees
- Inline styles for component-specific layout; CSS classes (in `globals.css`) for responsive overrides
- Server Components for data fetching; Client Components (`'use client'`) only when you need state or browser events

## Questions

Open an issue or start a discussion in the repo. Tag the relevant module number (e.g., `[M07]`) in your issue title.

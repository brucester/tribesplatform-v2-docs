# Core

Shared infrastructure used by every module. Contributors building a module should import from here but rarely need to edit it.

## Structure

```
core/
├── components/
│   ├── shell/          App layout: top bar, side nav, shell wrapper
│   │   ├── AppTopBar.tsx      Top navigation bar with version badge and search
│   │   ├── AppSideNav.tsx     Left sidebar — module links gated by role
│   │   └── AppShell.tsx       Root layout wrapper that receives role from server
│   ├── ui/             shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── ModuleHeader.tsx  Colored module banner with number + description
│   ├── Nav.tsx           Legacy nav bar (used on landing page)
│   └── ThemeToggle.tsx   Light/dark mode switch
├── contexts/
│   └── ProfileCompletion.tsx  React context for the profile completion bar
├── lib/
│   ├── supabase/
│   │   ├── client.ts   Browser Supabase client (use in 'use client' files)
│   │   └── server.ts   Server Supabase client (use in Server Components / route handlers)
│   ├── roles.ts        Role authority helpers — isFullMember, isCircleAdmin, isOpsAdmin, isAdmin, etc.
│   ├── promotions.ts   Member promotion logic — promoteToMemberIfEligible()
│   ├── modules.ts      Module registry — the canonical list of all M00–M13 modules
│   ├── module-meta.ts  Display metadata (bg color, label, desc) for each module number
│   └── utils.ts        Tailwind class merge helper (cn)
└── types/
    └── database.ts     TypeScript types generated from the Supabase schema
```

## Import alias

Everything under `core/` is available via `@/core/`:

```ts
import { createClient } from '@/core/lib/supabase/server'
import { Button } from '@/core/components/ui/button'
import type { Database } from '@/core/types/database'
import { isFullMember, isCircleAdmin, isOpsAdmin } from '@/core/lib/roles'
import { promoteToMemberIfEligible } from '@/core/lib/promotions'
```

## Supabase clients

| File | When to use |
|------|-------------|
| `core/lib/supabase/server.ts` | Server Components, route handlers (`async` functions without `'use client'`) |
| `core/lib/supabase/client.ts` | Client Components (`'use client'` files, `useEffect`, event handlers) |

## Role helpers (`core/lib/roles.ts`)

All role checks in the app go through this file. Never hard-code role arrays in page files.

| Helper | Returns true when |
|--------|------------------|
| `isFullMember(role)` | `member`, `circle_lead`, `project_lead`, or `admin` |
| `isJoiningOrAbove(role)` | `joining` or any full member role |
| `isCircleAdmin(role)` | `circle_lead` or `admin` — gates Blueprint, Join admin, Agreements admin |
| `isOpsAdmin(role)` | `circle_lead`, `project_lead`, or `admin` — gates Ops management |
| `isAdmin(role)` | `admin` only — gates destructive edit actions |

Constants `MEMBER_ROLES` and `JOINING_OR_ABOVE` are also exported for use in `.filter()` calls.

## Member promotion (`core/lib/promotions.ts`)

`promoteToMemberIfEligible(supabase, userId, currentRole)` — called in server pages for `joining` users. Checks in parallel whether the user has an accepted agreement **or** an active project. If either condition is met, it updates `user_profiles.role` to `'member'` and upserts the `community_member` achievement, then returns the new role string.

```ts
role = await promoteToMemberIfEligible(supabase, user.id, role)
```

This runs at the top of `app/agreements/page.tsx` and `app/ops/page.tsx`.

## App shell and role delivery

The sidebar (`AppSideNav`) receives the user's role as a prop from `AppShell`, which receives it from `app/layout.tsx`. The role is fetched once server-side on every request — no client-side fetch, no flash of wrong state.

```
layout.tsx (server) → fetches role → AppShell → AppSideNav (initialRole prop)
```

## Adding to core

Only add things here if they are genuinely shared across 3+ modules. Module-specific helpers belong in the module's own `lib/` folder.

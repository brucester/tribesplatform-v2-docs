# M00 — Dashboard

The personal heads-up display. Summarises a member's role, community stats, active modules, and recent activity in one place.

## Routes

| Route | File |
|-------|------|
| `/dashboard` | `app/dashboard/page.tsx` → `DashboardPage.tsx` |

## Files

| File | Purpose |
|------|---------|
| `DashboardPage.tsx` | Server Component — fetches all data, renders stat cards, module grid, activity feed |
| `DashCardTooltip.tsx` | Client Component — hover tooltip wrapper for dashboard cards |

## Database tables

| Table | Access |
|-------|--------|
| `user_profiles` | Read — display name, role, count |
| `blueprints` | Read — community blueprint readiness |
| `projects` | Read — active project count |
| `applications` | Read — user's join application status |

## Role gating

Dashboard is accessible to all roles. Module cards for M06–M09 render as locked for `explorer` role.

## How to work on this module

```bash
# Start dev server
cd web && npm run dev

# Navigate to
http://localhost:3000/dashboard
```

Relevant imports from core:
```ts
import { createClient } from '@/core/lib/supabase/server'
import { computeOverallReadiness } from '@/modules/m04-blueprint/lib/blueprint-compute'
```

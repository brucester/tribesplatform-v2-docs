# M07 — Operations

Active community projects with deliverables, sprint tracking, and update posts. Admins create and manage projects; all members can see what's happening and post updates.

## Routes

| Route | File |
|-------|------|
| `/ops` | `app/ops/page.tsx` → `OpsClient` |
| `/ops/new` | `app/ops/new/page.tsx` → `NewProjectClient` |
| `/ops/[id]` | `app/ops/[id]/page.tsx` → `ProjectDetailClient` |

## Files

| File | Purpose |
|------|---------|
| `OpsClient.tsx` | Project list with deliverable progress bars and update feed |
| `NewProjectClient.tsx` | Admin form to create a new project |
| `ProjectDetailClient.tsx` | Full project view — details, updates, agreements, deliverables |

## Database tables

| Table | Access |
|-------|--------|
| `projects` | Read/write — project records |
| `deliverables` | Read/write — tasks with assignee, due date, status, progress |
| `project_updates` | Read/write — freeform status posts |
| `collaboration_agreements` | Read — agreements linked to a project |

## Role gating

- **Explorer**: can browse but not post updates
- **Joining / Member**: can post project updates
- **Admin / project_lead**: can create/edit projects, manage deliverables

## Project status flow

`active` → `paused` | `completed` | `archived`

Deliverable statuses: `backlog` → `in_progress` → `review` → `done`

## How to work on this module

```bash
cd web && npm run dev
# http://localhost:3000/ops
# Admin only: http://localhost:3000/ops/new
```

To add a new deliverable field, update `OpsClient.tsx` / `ProjectDetailClient.tsx` and add a Supabase migration for the `deliverables` table.

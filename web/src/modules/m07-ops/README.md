# M07 — Operations

Active community projects with deliverables, sprint tracking, and update posts. Any member can browse projects and see collaborations. Project creators and admins can manage subtasks, post updates, and review proposals.

## Routes

| Route | File |
|-------|------|
| `/ops` | `app/ops/page.tsx` → `OpsClient` |
| `/ops/new` | `app/ops/new/page.tsx` → `NewProjectClient` |
| `/ops/[id]` | `app/ops/[id]/page.tsx` → `ProjectDetailClient` |

## Files

| File | Purpose |
|------|---------|
| `OpsClient.tsx` | Board view with Kanban columns, stat cards, pending proposals panel (admin), and tab switcher |
| `DeliverablesTab.tsx` | Table view of all deliverables across projects — extracted tab component |
| `UpdatesTab.tsx` | Timeline view of all project updates — extracted tab component |
| `NewProjectClient.tsx` | Admin form to create a new project directly (without proposal flow) |
| `ProjectDetailClient.tsx` | Full project view — subtasks, active collaborations, updates, admin settings panel |

## Database tables

| Table | Access |
|-------|--------|
| `projects` | Read/write — project records (`title`, `description`, `status`, `created_by`, `lead_user_id`) |
| `deliverables` | Read/write — subtasks with `title`, `status`, `due_date`, `progress` |
| `project_updates` | Read/write — freeform status posts linked to a project |
| `collaboration_agreements` | Read — agreements linked to a project (two queries: all for admin, active-only for everyone) |

## Role gating and permissions

| Who | Can do |
|-----|--------|
| Any logged-in user | Browse `/ops`, click into any project, read subtasks and active collaborations |
| Project creator (`created_by` or `lead_user_id`) | Add/update/delete subtasks, post project updates |
| `circle_lead` / `project_lead` / `admin` (`isOpsAdmin`) | Everything above + project settings, activate/decline pending proposals, accept/reject agreement proposals |

`canManage = isAdmin || isProjectCreator` inside `ProjectDetailClient`.

Role checks use `isOpsAdmin(role)` from `@/core/lib/roles`.

## Project detail page (`/ops/[id]`)

The page runs **five parallel queries**:
1. User profile (role check)
2. Project row (includes `created_by` and `lead_user_id`)
3. Project updates
4. All agreements — admin management panel (sent only to admins)
5. Active agreements (`accepted`, `active`, `completed`) — visible to everyone
6. Deliverables for the project

`ProjectDetailClient` receives `isAdmin` and `isProjectCreator` and renders accordingly.

## Subtask management (project creator + admin)

- Subtasks live in the `deliverables` table (RLS: any authenticated user can read/write)
- The add form takes a title (required) and an optional due date
- Status dropdown is an inline `<select>` with optimistic updates — no reload
- Statuses: `backlog` → `in_progress` → `review` → `done`
- Completed tasks are shown struck-through and dimmed; all others see them in read-only pill form

## Project status flow

```
pending   →  active  →  paused | completed
(proposed)   (admin activates)
```

Pending projects are proposed via `NewProjectModal` in M06 Agreements or by admins directly via `/ops/new`. Admins see a **Pending proposals** panel on the `/ops` board to activate or decline.

## Kanban board

Cards on the Ops board are clickable links to `/ops/[id]`. Projects with no deliverables appear in the **In Progress** column as project-level cards.

## How to work on this module

```bash
cd web && npm run dev
# http://localhost:3000/ops             — board view (all users)
# http://localhost:3000/ops/[id]        — project detail (all users)
# http://localhost:3000/ops/new         — admin only
```

To add a new deliverable field (e.g., `priority`):
1. Add the column to the `deliverables` table via a Supabase migration
2. Update the add form and list rendering in `ProjectDetailClient.tsx`
3. Update `DeliverablesTab.tsx` if it should appear in the table view

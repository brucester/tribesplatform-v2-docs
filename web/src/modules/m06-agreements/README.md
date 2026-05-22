# M06 — Agreements

Members propose collaboration on active community projects. They describe what they'll contribute and what they expect in return. Admins review and confirm or reject the agreement.

## Routes

| Route | File |
|-------|------|
| `/agreements` | `app/agreements/page.tsx` → `AgreementsClient` or `AgreementsAdminClient` |
| `/agreements/[id]` | `app/agreements/[id]/page.tsx` → `AgreementFormClient` |

## Files

| File | Purpose |
|------|---------|
| `AgreementsClient.tsx` | Artboard of open projects with a "Propose" button for each |
| `AgreementsAdminClient.tsx` | Admin table of all submitted agreements with approve/reject |
| `AgreementFormClient.tsx` | Inline form for writing a collaboration proposal on a specific project |

## Database tables

| Table | Access |
|-------|--------|
| `collaboration_agreements` | Read/write — proposals (work_description, expected_reward, status) |
| `projects` | Read — project list for artboard |
| `user_profiles` | Read — member names for admin view |

## Role gating

- **Explorer**: blocked — redirect to `/join`
- **Joining / Member**: can browse projects and submit proposals
- **Admin / circle_lead / project_lead**: sees admin review panel

## Agreement statuses

`pending` → `reviewing` → `accepted` | `rejected`

## How to work on this module

```bash
cd web && npm run dev
# http://localhost:3000/agreements
```

To add a new field to the proposal form (e.g., "estimated hours"), add it to `AgreementFormClient.tsx` and add the column to `collaboration_agreements` via a Supabase migration.

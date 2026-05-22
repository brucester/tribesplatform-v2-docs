# M05 — Join

The full onboarding flow. Guides an `explorer` through three steps: (1) sign community values, (2) fill the application form, (3) wait for admin review. Admins see a separate review panel to accept or reject applications.

## Routes

| Route | File |
|-------|------|
| `/join` | `app/join/page.tsx` → `JoinClient` or `JoinAdminClient` |

## Files

| File | Purpose |
|------|---------|
| `JoinClient.tsx` | Multi-step join flow for explorers — sign values, write application, submit |
| `JoinAdminClient.tsx` | Admin review panel — list of applications with accept/reject/notes |

## Database tables

| Table | Access |
|-------|--------|
| `applications` | Read/write — user's application (status, answers) |
| `community_values` | Read — values list for the signing step |
| `value_signatures` | Read/write — which values a user has signed |
| `user_profiles` | Read — role check; Write — role promotion on acceptance |

## Role gating

- **Explorer**: sees JoinClient (join flow)
- **Admin / circle_lead / project_lead**: sees JoinAdminClient (review panel)
- **Joining / Resident**: sees their existing application status

## Application flow

```
Explorer → Signs values → Fills application → Submits
                                              ↓
                              Admin reviews in JoinAdminClient
                                              ↓
                    Accept (role → 'joining') | Reject
```

When an admin accepts, the user's role in `user_profiles` is updated from `explorer` to `joining`. The `community_joiner` achievement badge is awarded automatically by `modules/home/HomePage.tsx` the next time the user visits `/home`.

## How to work on this module

```bash
cd web && npm run dev
# Explorer path: http://localhost:3000/join
# Admin path: login with admin account, then http://localhost:3000/join
```

Application questions are driven by the community blueprint (`blueprints.answers.join_application_questions`), so they're configurable without code changes.

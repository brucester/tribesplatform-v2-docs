# Home Portal

The public and member-facing landing page for the community. Shows live data from all modules: blueprint phase, recent members, community values, active projects, deliverables feed, and match scores.

## Routes

| Route | File |
|-------|------|
| `/home` | `app/home/page.tsx` → `HomePage` → `HomeClient` |

## Files

| File | Purpose |
|------|---------|
| `HomePage.tsx` | Server Component — fetches all cross-module data and passes it as props |
| `HomeClient.tsx` | Client Component — renders the full home portal with all sections |

## Data fetched in `HomePage.tsx`

| Source | Data |
|--------|------|
| `blueprints` | Phase progress, readiness score |
| `user_profiles` | Member count, recent members |
| `community_values` | Values signing list |
| `projects` | Active projects summary |
| `deliverables` | Recent deliverables feed |
| `user_bio` | Match scores for logged-in user |
| `applications` | Whether user has applied |
| `user_achievements` | Awards `community_joiner` badge on first visit with joining+ role |

## Role-adaptive content

The home page adapts to the viewer's role:
- **Guest**: sees community overview with sign-up CTA
- **Explorer**: sees overview + "access tiers" strip showing next steps
- **Joining**: sees joining reward banner + full portal
- **Member / above**: sees full portal with match scores

## How to work on this module

```bash
cd web && npm run dev
# http://localhost:3000/home
```

To add a new section, add the data fetch to `HomePage.tsx` and render it in `HomeClient.tsx`. Keep `HomePage.tsx` as a thin data layer — all rendering belongs in `HomeClient.tsx`.

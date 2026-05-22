# M04 — Blueprint

Guided community planning wizard. Takes a community through four phases — SPARK → PROVE → BUILD → LIVE — across five pillars (Ecology, Governance, Economy, Culture, Infrastructure). Admins fill in the blueprint; all members can read it.

## Routes

| Route | File |
|-------|------|
| `/blueprint` | `app/blueprint/page.tsx` → `BlueprintClient` |

## Files

| File | Purpose |
|------|---------|
| `BlueprintClient.tsx` | Full wizard UI — pillar tabs, step fields, AI scan, scoring panels |
| `lib/blueprint-compute.ts` | Pure scoring functions — readiness, gates, phase progress |
| `lib/wizard-data.ts` | Static wizard structure — all phases, pillars, steps, and field definitions |
| `wizard.css` | Wizard-specific styles (scoped to blueprint, not global) |

## Scoring functions (`lib/blueprint-compute.ts`)

These are pure functions with no side effects — great for testing.

| Function | Returns |
|----------|---------|
| `computeOverallReadiness(answers)` | `number` 0–10 readiness score |
| `computeGatesPassed(answers)` | `number` 0–4 milestone gates cleared |
| `computePhaseProgress(answers)` | `PhaseProgress[]` per-phase completion ratios |
| `computePillarScores(answers)` | `PillarScore[]` per-pillar score objects |

These functions are also imported by `m00-dashboard` and `modules/home` to display community status.

## Database tables

| Table | Access |
|-------|--------|
| `blueprints` | Read/write — single community blueprint row (`is_community = true`) |

## Role gating

- **Admin / circle_lead / project_lead**: read + write
- **All other roles**: read only

## AI scanning

The blueprint integrates with `/api/claude` to scan uploaded documents and suggest answers. The API route calls MiniMax M2.7 via the Cloudflare Worker.

## How to work on this module

```bash
cd web && npm run dev
# Navigate to http://localhost:3000/blueprint
# (You'll need an admin account to edit)
```

To add a new blueprint field:
1. Add the field definition to `lib/wizard-data.ts`
2. Add scoring logic to `lib/blueprint-compute.ts` if it should affect readiness
3. `BlueprintClient.tsx` auto-renders fields from the wizard data structure

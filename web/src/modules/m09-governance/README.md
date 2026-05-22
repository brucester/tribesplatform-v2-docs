# M09 — Governance

AI-facilitated community decision-making. Members submit proposals; the system runs them through four decision layers (Consent, Democracy, Meritocracy, AI Facilitation) with live vote tracking.

## Routes

| Route | File |
|-------|------|
| `/governance` | `app/governance/page.tsx` → `GovernanceClient` |

## Files

| File | Purpose |
|------|---------|
| `GovernanceClient.tsx` | Full governance UI — proposal list, filter tabs, vote breakdown bars, new proposal modal |

## Database tables

| Table | Access |
|-------|--------|
| `proposals` | Read/write — proposal records (title, description, decision_mode, status, closes_at) |
| `proposal_votes` | Read/write — individual votes per user per proposal |
| `proposal_comments` | Read/write — threaded comments on proposals |

## Decision modes

| Mode | Description |
|------|-------------|
| `consent` | Passes unless someone blocks |
| `democratic` | Simple majority |
| `meritocratic` | Weighted by contribution score |
| `ai_facilitated` | AI surfaces tradeoffs; humans vote |

## Role gating

- **Explorer / Joining**: can view proposals and comments
- **Resident / circle_lead / project_lead / admin**: can vote and create proposals

## Proposal lifecycle

`open` → `closed` (when `closes_at` is reached or manually closed)

## How to work on this module

```bash
cd web && npm run dev
# http://localhost:3000/governance
```

To add a new vote type or decision layer, update `GovernanceClient.tsx` and the `evalLayers()` logic within it.

To add proposal comments, the `proposal_comments` table exists in the DB — the UI is the next feature to build here.

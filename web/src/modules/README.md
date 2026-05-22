# Modules

Each module is an independently workable feature of the MyCoNet platform. You can contribute to any module without touching the others.

## Module list

| Folder | Number | Route | Status |
|--------|--------|-------|--------|
| `m00-dashboard/` | M00 | `/dashboard` | Live |
| `m01-network/` | M01 | `/network` | Live |
| `m04-blueprint/` | M04 | `/blueprint` | Live |
| `m05-join/` | M05 | `/join` | Live |
| `m06-agreements/` | M06 | `/agreements` | Live |
| `m07-ops/` | M07 | `/ops` | Live |
| `m08-contributions/` | M08 | `/contributions` | Live |
| `m09-governance/` | M09 | `/governance` | Live |
| `home/` | — | `/home` | Live |

M02 (Neighborhood Directory) and M03 (Resources) are hosted externally and not in this codebase.

## Module conventions

Each module folder contains:
- Component files (`.tsx`) — the UI and logic
- `lib/` — module-local utilities and algorithms (no side effects, easy to test)
- `README.md` — what the module does, which DB tables it touches, how to work on it

Route files live in `src/app/[route]/page.tsx` (Next.js requirement) and simply re-export from the module:

```ts
// src/app/governance/page.tsx
export { default } from '@/modules/m09-governance/GovernanceClient'
```

See `CONTRIBUTING.md` at the root of `web/` for the full contribution guide.

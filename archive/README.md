# Archive

Historical, reference, and spec documents that aren't part of the running app.

## What's here

- **`Modules/`** — Pre-v2 module sources and design handoffs:
  - `m1_comm_network/` — The original standalone Next.js v1 of the Community Network module. Deployed to Vercel before the v2 consolidation. Functionality has since been merged into `web/src/modules/m01-network/` (now on Cloudflare Workers).
  - `m4_framework_wizard/` — The original standalone CDN-React framework wizard. Its concepts and content moved into `web/src/modules/m04-blueprint/`. Contains the full source framework documents (RNF, RCOS, CLIPS, Community Alchemy Playbook) — keep as conceptual reference.
  - `design_handoff_portal_explainer/` — High-fidelity HTML/JSX design references for a future Welcome / Portal Explainer page (not yet built).
  - `MycoNetv1.0/` — Original v1 MyCoNet spec docs and attached assets (executive summaries, user journey, development process notes).

## What lives where in the current app

| Old | New (current source of truth) |
|-----|------------------------------|
| `archive/Modules/m1_comm_network/` | `web/src/modules/m01-network/` |
| `archive/Modules/m4_framework_wizard/` | `web/src/modules/m04-blueprint/` |
| `archive/Modules/design_handoff_portal_explainer/` | (planned) `web/src/app/welcome/` |
| `archive/Modules/MycoNetv1.0/` | `web/` (the whole v2 codebase) |

Functional module READMEs live alongside the code in `web/src/modules/mXX-*/README.md`. Edit those — don't edit anything under `archive/`.

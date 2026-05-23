# Module 04 — Blueprint / Framework Wizard — Change Log

## 2026-05-10
### Migrated into TribesPlatform v2 module structure
- Moved all files from `agnetO/projects/active/framework regenerative-neighborhood/` into `tribesplatform-v2/Modules/m4_framework_wizard/`
- Now lives alongside M01 (Community Network) under the unified platform repo
- README.md and log.md rewritten to reflect current state, correct paths, and platform context

---

## 2026-04-11
### Full Wizard Build — v2.0 Shipped

#### App architecture
- Multi-file React 18 app (CDN + in-browser Babel — no build step)
- `app.jsx` — shell, routing, state, localStorage persistence
- `views.jsx` — step renderer, welcome screen, dashboard view
- `components.jsx` — shared UI: sliders, checklists, status buttons, guide popovers, radar chart
- `document.jsx` — full project document export (Markdown download + print/PDF)
- `import.jsx` — AI document import modal
- `data.js` — all step + field definitions with sourced guide content (~1650 lines)
- `styles.css` — full design system, dark/light mode
- `api/claude.js` — MiniMax-M2.7 serverless proxy (Vercel function)

#### Four frameworks integrated
- **RNF** — 5 pillars (Ecology, Social, Economy, Hardware, Governance) + 5-spiral timeline
- **Community Alchemy** — 11 sequential areas for community development
- **RCOS** — 7-layer governance operating system
- **CLIPS** — concentric health check model

#### 13-step wizard across 4 phases
- SPARK (1.1–1.4): Why, Team, Purpose, Agreements
- PROVE (2.1–2.3): Business Model, Site, Funding
- BUILD (3.1–3.4): Capital, Master Plan, Infrastructure, Activation
- LIVE (4.1–4.3): Operations, Governance, Evolution

#### Key features
- Guide popovers on every question (sourced from frameworks + playbooks)
- Three-state status per field: No answer / Almost there / Ready to go
- Live radar chart (5-pillar pentagon, updates in real time)
- Gate checkpoints at end of PROVE and BUILD phases
- AI document import — paste existing docs, AI proposes answers for review
- Full project document export: Markdown download + print-to-PDF
- Dark / light mode with localStorage persistence

#### Deployed
- **Live:** https://framework-wizard.vercel.app
- Vercel project: `framework-wizard`
- Linked via `framework_wizard/.vercel/project.json`

---

## 2026-03-25
### Session Lost (Not Saved)
- Files claimed in session summary were never actually created due to tilde path bug (`~/projects/...` not resolving)

---

## 2026-03-18
### Project Started
- First ideation session for the Regenerative Neighborhood Framework wizard
- Concept: guided self-assessment for founding teams using RNF + Alchemy + RCOS + CLIPS

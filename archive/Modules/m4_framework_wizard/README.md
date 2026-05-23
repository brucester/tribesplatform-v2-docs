# Module 04 — Blueprint / Framework Wizard

**TribesPlatform v2 · MyCoNet Module 4**
Part of the regenerative neighborhood open source tech stack.

**Live URL:** https://framework-wizard.vercel.app
**Vercel project:** `framework-wizard`

---

## What This Module Does

A guided self-assessment wizard for founding teams building intentional communities and regenerative neighborhoods. Teams walk through four developmental phases — from initial spark to living, operating community — answering the questions that matter at each stage.

Output is twofold: a **live diagnostic radar** showing balance across five RNF pillars, and a **project document** exportable as Markdown or PDF.

---

## Stack

| Layer | Technology |
|---|---|
| UI | React 18 (CDN) + Babel JSX transpiled in-browser |
| Hosting | Vercel (static) |
| AI backend | Node.js serverless function (`api/claude.js`) |
| AI model | MiniMax-M2.7 via `https://api.minimax.io` |
| Storage | Browser localStorage (`rnf_wizard_v1`) |
| No database | All data lives client-side |

---

## Four Frameworks

Every wizard question is grounded in one or more of these research-backed frameworks:

| Framework | Focus | Contributes |
|---|---|---|
| **RNF** — Regenerative Neighborhood Framework | 5 pillars + 5-spiral timeline | WHAT to include and WHEN |
| **Alchemy** — Community Alchemy Playbook | 11 sequential areas for community creation | STEPS and ORDER |
| **RCOS** — Regenerative Community Operating System | 7 governance layers | HOW the community governs itself |
| **CLIPS** — Community Learning Incubator Programme | Concentric health check | Coherence between intention, structure, practice |

**Five RNF Pillars:** Ecology · Social · Economy · Hardware · Governance

---

## Four Phases + 13 Steps

| Phase | Steps | Description |
|---|---|---|
| **01 SPARK** — From Idea to Core Team | 1.1 Finding Your Why, 1.2 Assembling the Founding Group, 1.3 Clarifying Purpose, 1.4 First Agreements | Who are you? Why this? What do you believe? |
| **02 PROVE** — Feasibility Validation | 2.1 Business Model Planning, 2.2 Site Selection, 2.3 Funding Strategy | Site, business model, funding, feasibility |
| **03 BUILD** — Capital & Construction | 3.1 Securing Capital, 3.2 Master Planning, 3.3 Infrastructure & Construction, 3.4 Community Activation | Master plan, infrastructure, capital, community culture |
| **04 LIVE** — Operations & Evolution | 4.1 Operations Go Live, 4.2 Culture & Ongoing Governance, 4.3 Learning & Evolution | Operations, governance, learning |

---

## Key Features

- **Guide buttons** — every question has a `?` popover explaining what it's really asking, which framework it comes from, examples, and common mistakes
- **Three-state status** — each text field can be marked: No answer / Almost there / Ready to go — the "Almost there" flag routes coaching attention exactly where it's needed
- **Live radar chart** — pentagon showing current scores across the 5 RNF pillars, updates in real time
- **Gate checkpoints** — at end of phases 2 and 3, reviews readiness criteria (green / amber / red)
- **AI import** — paste existing documents (charter, vision deck, meeting notes) and the AI proposes answers for review before saving
- **Project document export** — full formatted Markdown or PDF of all answers
- **Dark / light mode** — preference saved to localStorage

---

## File Structure

```
m4_framework_wizard/
├── README.md                     # This file
├── log.md                        # Change log
├── framework/                    # Source framework documents
│   ├── EXECUTIVE-SUMMARY.md
│   ├── execution-plan-v2.md
│   ├── execution-plan-regen-neighborhood.md
│   ├── community-alchemy-playbook.md
│   ├── CLIPS.md
│   ├── RCOS.md
│   ├── HOW_TO_USE.md
│   ├── agent-workbook.md
│   ├── Spiral-Framework_How_to_Use_This_Model.md
│   ├── Spiral-Framework_Quick_Reference_One_Pager.md
│   └── Spiral-Framework_RNF_Hybrid_Sequencing_Model_Complete.md
└── framework_wizard/             # Wizard app (deployed)
    ├── index.html                # Entry point
    ├── app.jsx                   # App shell, routing, state
    ├── views.jsx                 # Step renderer, welcome, dashboard
    ├── components.jsx            # Shared UI components
    ├── document.jsx              # Export view (Markdown/PDF)
    ├── import.jsx                # AI document import modal
    ├── data.js                   # All step + field definitions (~1650 lines)
    ├── styles.css                # All styles
    ├── api/
    │   └── claude.js             # MiniMax AI proxy (Vercel serverless)
    ├── uploads/                  # Uploaded reference documents
    ├── HOW_IT_WORKS.md           # Full user guide
    ├── SUGGESTIONS.md            # Product improvement ideas
    └── _standalone_src.html      # Single-file standalone version
```

---

## Local Development

No build step needed — the app runs directly from `index.html` via CDN React and in-browser Babel.

```bash
# Serve locally (any static server)
cd framework_wizard
npx serve .
# → http://localhost:3000
```

For AI import to work locally, set the env var:
```
MINIMAX_API_KEY=...
```

---

## Deploy

```bash
cd framework_wizard
vercel --prod --yes
```

Project is linked to Vercel via `.vercel/project.json`.

---

## Pending / Next Steps

- **Connect to Supabase** — save wizard progress to DB instead of localStorage so teams can collaborate across devices
- **Close the "Almost there" coaching loop** — route flagged questions to a coach via webhook or email
- **JSON export/import** — let teams share progress via copy-paste code (no backend needed)
- **Timestamped snapshots** — track how pillar scores evolve over time
- **Integrate with M01** — surface a community's wizard progress on their profile in the Community Network module

# Framework Wizard — Product Suggestions

Three high-leverage improvements, in priority order.

---

## 1. Close the "Almost there" support loop

**The problem:** The three-state status buttons (No answer / Almost there / Ready to go) are designed to flag where a community needs help. But right now that signal has no destination — it sits in the user's browser and nobody sees it.

**The fix:** Add a "Send flagged questions to a coach" button. When clicked, it composes an email (or posts to a webhook/Slack) containing:
- The project name
- A list of every question marked "Almost there" with the field label and any text the user wrote
- A link back to the wizard (or the exported Markdown document)

This closes the loop between the community filling in the wizard and the Regen Tribe team knowing exactly where to focus a coaching conversation.

**Effort:** ~2–3 hours. Could be as simple as a `mailto:` link with the flagged questions pre-filled in the body, or a `fetch()` POST to a Zapier/Make webhook that drops a card in Notion or sends a Slack message.

**Why this matters:** The "Almost there" flag is the most valuable data the wizard collects. Without routing it somewhere, the coaching use case doesn't work.

---

## 2. JSON export/import for team sharing

**The problem:** All wizard data lives in one browser's localStorage. Founding teams work across multiple people and devices. Right now, one person fills in the wizard and their co-founders can't see or contribute to it.

**The fix:** Two buttons in the right rail:
- **Export project code** — serializes the entire `values` object to base64 JSON and displays it in a textarea the user can copy
- **Import project code** — accepts a pasted code and loads it into the wizard

This requires zero backend, no accounts, no database. It's a copy-paste handoff.

**Longer term:** A shareable URL with the project data encoded in the hash (`#data=...`) would be even smoother — paste the URL, open it, your team's answers are there.

**Effort:** ~1–2 hours for the copy-paste version. URL-based sharing is another 1–2 hours.

**Why this matters:** Most intentional communities are founded by groups of 3–8 people. A tool only one of them can access is fundamentally limited as a collaborative planning instrument.

---

## 3. Time-stamped snapshots for progress tracking

**The problem:** The wizard is currently a one-time intake form. A community fills it in during early planning, exports a document, and then the tool's job is done. But communities evolve over months and years — and their scores should too.

**The fix:** A "Save snapshot" button that stores a timestamped copy of the current scores (not the full text answers — just the sliders and checklist completion). When a snapshot exists, the radar and pillar bars show two outlines: "now" and "last snapshot" — so the community can see how they've moved.

Over time, this becomes a trajectory view: a series of snapshots showing growth across all five pillars.

**Effort:** ~4–6 hours. Snapshots stored in localStorage alongside current values. The radar component already supports multiple polygon overlays (just add a second data series).

**Why this matters:** This turns the wizard from a one-time onboarding tool into a recurring measurement touchpoint. Regen Tribe can check in with communities every quarter, compare their current snapshot to the previous one, and make coaching conversations much more concrete. It's also the foundation of any future community health reporting or cohort benchmarking.

---

## Other ideas worth noting

- **Completion percentage** — Show "Phase 2: 6 of 11 questions answered" in the sidebar. Simple motivation layer, ~30 min to build.
- **Mobile UX polish** — The three-column desktop layout works well; the mobile tab layout is functional but the radar tab is small. A full-screen radar on mobile with pinch zoom would help.
- **Coach view** — A read-only URL that shows the community's answers and flags without allowing edits. Useful for Regen Tribe staff reviewing before a call.
- **Cohort benchmarking** — Once multiple communities are using the tool, anonymized average scores across the community of communities would be a compelling feature ("your ecology score is 6.2 — the average community at your stage is 4.8").

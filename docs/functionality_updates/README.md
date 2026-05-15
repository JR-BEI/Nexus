# Functionality Updates

This series tracked the work to make Nexus *behave* like a connected product (rather than five visually-aligned silos).

```
functionality_updates/
├── archived/   ← shipped, see commit history for the implementation
└── backlog/    ← planned but not yet started
```

## Archived (shipped)

| # | Doc | Status |
|---|-----|--------|
| 00 | README — overall sequencing | ✓ |
| 01 | Data model + storage adapter + per-entity repos + migration | ✓ |
| 02 | Repository as analysis context (ContextPreview + angle + chips) | ✓ |
| 03 | Outputs → Tracker connection (Track button, SourceModal, bidirectional link) | ✓ |
| 04 | Target Companies → Analysis launchpad (✨ Analyze + prefill banner + count chip) | ✓ |
| 05 | Tracker stale detection (`getStaleness`, `NeedsAttention`, log activity, badges) | ✓ |
| 06 | Tracker improvements (Closed lane, full-text search, contact picker, bidi linking) | ✓ |
| 07 | Analysis versioning + refinement (`/api/refine`, VersionPicker, RefineButton) | ✓ |
| 08 | Repository multi-input (Voice / Paste / Manual + EntryForm + extract endpoint) | ✓ |
| 09 | Interactive Strategy (curated `STRATEGY_ENTRIES` + status pickers + custom adds) | ✓ |
| 10 | Dynamic homepage (Today, Upcoming, drafts autosave, QuickStats) | ✓ |
| 11 | Cmd+K command palette (cross-entity search + actions + recent + hint) | ✓ |

## Backlog

| # | Doc | Notes |
|---|-----|-------|
| 12 | Coach View | Pattern detection across user activity. Needs ~30 days of accumulated data to be useful. |

## Also deferred / out of scope

These were flagged in the docs themselves but not implemented:

- **Browser notifications for stale apps** (doc 05 §6) — kept off by default per the doc's own guidance.
- **Side-by-side version compare** (doc 07 §9) — explicitly out of scope.
- **LinkedIn API import / PDF parsing** (doc 08) — out of scope for local-first.
- **Application detail page** (doc 06 §6) — deferred pending design work.
- **Company detail page** at `/companies/[id]` (doc 04 §8) — deferred until the user has 3+ analyses for the same company.
- **Migration of legacy `Contacts`/`Appointments`/`Notes` tracker tabs** to the new repos — the Applications tab uses `applicationRepo`; the other three still read from the legacy `tracker.*` localStorage keys (which the Phase 0 migration mirrors into the new repos as well).

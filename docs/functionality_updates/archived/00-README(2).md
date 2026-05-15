# Nexus Functionality Upgrades — Implementation Guide for Claude Code

This is the second set of implementation docs, focused on **functionality and connective tissue** rather than visual design. Use this set after (or alongside) the `nexus-design-docs/` series.

## What this set fixes

The visual redesign makes Nexus *look* like a connected product. This set makes it *behave* like one. The biggest issue right now: each feature is a silo. Repository doesn't feed Analyses. Analyses don't create Tracker entries. Target Companies don't launch Analyses. This set fixes that.

## Order of operations

| # | File | Purpose | Effort |
|---|------|---------|--------|
| 01 | `01-data-model.md` | **READ FIRST.** Defines the shared data model and storage layer. All other docs reference these types. | Foundation |
| 02 | `02-repository-as-context.md` | Make Build Repository the source of truth that feeds every Analysis. | Medium |
| 03 | `03-outputs-to-tracker.md` | One-click "Track this application" from the Outputs page. | Small |
| 04 | `04-companies-to-analysis.md` | "Analyze this role" buttons on Target Companies cards. | Small |
| 05 | `05-tracker-stale-detection.md` | Surface stale applications, suggest follow-ups. | Small |
| 06 | `06-tracker-improvements.md` | Collapsed Closed lane, search-across-everything, contact integration. | Medium |
| 07 | `07-analysis-versioning.md` | Version history per analysis, "make this section more conversational" controls. | Medium |
| 08 | `08-repository-multi-input.md` | Paste resume / import LinkedIn / voice — three input modes for Repository. | Medium |
| 09 | `09-strategy-interactive.md` | Make the Strategy doc a working CRM for recruiter relationships. | Medium |
| 10 | `10-homepage-dynamic.md` | "Continue analysis", upcoming events, today's priorities on the homepage. | Small |
| 11 | `11-cmd-k-palette.md` | Global search and command palette. Once you have data everywhere, this is essential. | Medium |
| 12 | `12-coach-view.md` | Pattern recognition across your activity. "You convert 3x better when..." | Large |

## How to use with Claude Code

```
Read docs/nexus-functionality/00-README.md and docs/nexus-functionality/01-data-model.md.
Then implement docs/nexus-functionality/02-repository-as-context.md.
Show me the diff before applying changes.
```

Start with 01 (data model) — it underpins everything. After that, the **connective tissue trio (02, 03, 04)** delivers the biggest UX win for the least effort. Everything else is nice-to-have polish or future-facing features.

## Recommended sequencing

**Week 1 — connective tissue (the big unlock):**
- 01-data-model
- 02-repository-as-context
- 03-outputs-to-tracker
- 04-companies-to-analysis

After this, Nexus stops being five separate apps and becomes one workflow.

**Week 2 — power-user features:**
- 05-tracker-stale-detection
- 10-homepage-dynamic
- 11-cmd-k-palette

These transform daily usage. Stale detection prevents the "graveyard" problem, the homepage becomes actionable, Cmd+K makes the app feel professional.

**Later (nice-to-haves):**
- 06-tracker-improvements
- 07-analysis-versioning
- 08-repository-multi-input
- 09-strategy-interactive
- 12-coach-view (this one needs ~30 days of user data to be useful)

## Principles applied throughout

1. **Local-first stays local.** Every feature here is designed to work entirely in the browser. No backend dependency.
2. **Pre-fill, don't ask.** When Analyses can be auto-launched with context, do it. The user can always edit.
3. **Show your work.** When the app makes inferences ("we think this is your role level"), show the signal so the user can correct it.
4. **One source of truth per concept.** Repository owns work history. Tracker owns applications. Analyses link to both but don't duplicate.

## Relationship to the design docs

This set works **alongside** the design docs. You can implement them in parallel — different docs touch different parts of the codebase. Where they intersect (e.g., adding a "Track this" button on Outputs touches both the design doc 04-outputs and the functionality doc 03-outputs-to-tracker), the functionality doc focuses on behavior and the design doc focuses on styling.

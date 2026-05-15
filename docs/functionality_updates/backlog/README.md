# Backlog

Planned but not yet implemented. Move to `../archived/` when shipped.

## Active items

- **12 — Coach View** — Pattern recognition across job-search activity. The detector framework + UI gating logic ship anytime; the *insights* only become meaningful after ~30 days of accumulated user data, so there's no rush.

## Also explicitly deferred

These came up during the 01–11 work and were intentionally not built. Promote to a numbered doc when the time is right.

- **Browser notifications** for stale applications (doc 05 §6) — opt-in per setting, default off.
- **Side-by-side version compare** for analyses (doc 07 §9).
- **LinkedIn import / PDF upload** for Repository (doc 08).
- **Application detail page or side-panel** showing the full timeline of events + linked contacts + linked appointments + linked analysis (doc 06 §6).
- **Company detail page** at `/companies/[id]` aggregating all analyses + contacts + activity for one company (doc 04 §8).
- **Migrate legacy Tracker tabs** (Contacts, Appointments, Activity Notes) to the new `contactRepo` / `appointmentRepo` / event-stream model. The Applications tab is migrated; the other three still read/write the legacy `tracker.*` localStorage keys.

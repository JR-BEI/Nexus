# Nexus Visual Redesign — Implementation Guide for Claude Code

This is a sequenced set of implementation docs for upgrading Nexus from a flat-dark utilitarian app to a visually polished, cohesive product. Work through them in order. Each doc is self-contained and references the design tokens established in `01-design-system.md`.

## Order of operations

| # | File | Purpose | Est. effort |
|---|------|---------|-------------|
| 01 | `01-design-system.md` | **READ FIRST.** Establishes shared tokens (colors, spacing, typography, components). All other docs reference this. | Foundation |
| 02 | `02-shared-shell.md` | Background, header, page-title pattern, badge component. Reusable across every page. | Small |
| 03 | `03-new-analysis.md` | Step 1 / Input page upgrade. | Small |
| 04 | `04-outputs.md` | Step 3 / Outputs page (Resume, Cover Letter, Strategy Brief tabs). | Medium |
| 05 | `05-build-repository.md` | Voice recording page with animated mic. | Small |
| 06 | `06-tracker.md` | Job Search Tracker kanban. | Medium |
| 07 | `07-target-companies.md` | Companies list with fit scores. | Small |
| 08 | `08-strategy.md` | Long-form strategy doc page with TOC. | Small |
| 09 | `09-homepage-polish.md` | Refinements to the already-redesigned homepage. | Small |

## How to use with Claude Code

Recommended prompt pattern for each file:

```
Read docs/nexus-design/01-design-system.md and docs/nexus-design/02-shared-shell.md.
Then implement docs/nexus-design/03-new-analysis.md.
Show me a diff before applying changes.
```

Start with 01 and 02 together — they're the foundation. After that, each page doc is independent and can be tackled in any order, though the listed order moves from simplest to most complex.

## Principles applied throughout

1. **Restraint over flash.** Premium feel comes from consistent details, not effects piled on top of effects.
2. **One hero element per page.** Each page has exactly one moment of visual emphasis; everything else supports it.
3. **The data is the design.** On dense pages (Target Companies, Tracker, Strategy) styling stays out of the way of the content.
4. **Consistency is the product.** The shared shell is non-negotiable — every page must use it.

## Out of scope

These docs do not cover:
- Backend / API changes
- New features or content
- Mobile-specific layouts (assumes desktop-first, mobile will follow naturally from the responsive tokens)
- Accessibility audit (the tokens are a11y-friendly, but a separate pass is recommended)

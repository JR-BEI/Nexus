# Design Principles — Nexus

## Core Philosophy

Nexus is a tool, not a showpiece. Every design decision should prioritize clarity, speed, and utility over decoration.

---

## 1. Clarity First

**What it means:**
- Information hierarchy is obvious at a glance
- Actions are immediately understandable
- No ambiguity about what something does or where to click

**In practice:**
- Primary actions use high-contrast colors (blue-600)
- Secondary actions use muted colors (neutral-700)
- Destructive actions shift to red on hover
- Text is large enough to read without effort (minimum 14px for body)
- Headings establish clear section boundaries

---

## 2. Speed Over Aesthetics

**What it means:**
- Fast load times, instant feedback
- No unnecessary animations or transitions (150ms max)
- Loading states show progress, not just spinners
- Keyboard shortcuts for power users

**In practice:**
- Components render instantly, fetch data in the background
- Optimistic UI updates where appropriate
- All API calls show immediate loading feedback
- Forms validate on submit, not on every keystroke

---

## 3. Content Is King

**What it means:**
- The generated resume, cover letter, and strategy brief are the product
- UI fades into the background
- White space creates room for content to breathe

**In practice:**
- Dark neutral background (neutral-900) recedes visually
- Content areas are light or clearly delineated
- Generous padding around text blocks
- No competing visual elements when viewing outputs

---

## 4. Progressive Disclosure

**What it means:**
- Show the minimum needed for the current step
- Reveal complexity only when the user needs it
- Don't overwhelm with all options at once

**In practice:**
- Step-by-step workflow (Input → Analysis → Outputs)
- Tabs separate different outputs (Resume | Cover Letter | Strategy)
- Advanced options tucked behind "Show more" or similar patterns
- Past analyses hidden on a separate home screen, not cluttering the workspace

---

## 5. Predictable, Not Clever

**What it means:**
- Use standard patterns users already know
- Buttons look like buttons, links look like links
- No hidden gestures or non-standard interactions

**In practice:**
- Standard form inputs with labels
- Buttons have clear hover states
- Copy-to-clipboard uses the standard clipboard icon
- Navigation is explicit (back buttons, clear links)

---

## 6. Accessible by Default

**What it means:**
- Everyone can use the tool regardless of ability
- Keyboard navigation works everywhere
- Color is not the only indicator of state
- Text meets WCAG contrast standards

**In practice:**
- All interactive elements are keyboard accessible
- Focus states are visible (blue outline)
- Error messages are text, not just red borders
- Font size is at least 14px, line height at least 1.4

---

## 7. Build Trust Through Transparency

**What it means:**
- Show what's happening behind the scenes
- Don't hide errors or failures
- Let the user see and edit what the AI produces

**In practice:**
- Analysis results show what Claude extracted from the JD
- Matched blocks are visible before generating the resume
- All outputs are editable (copy, paste into your own editor)
- Error messages explain what went wrong and suggest next steps

---

## 8. Mobile-Friendly, Desktop-First

**What it means:**
- Designed for desktop/laptop use (where people apply to jobs)
- Responsive down to tablet, but not phone-optimized
- Layout adapts but doesn't compromise functionality

**In practice:**
- Min-width: 768px (tablet)
- Single-column layouts at smaller sizes
- Buttons remain tappable (44px min touch target)
- Text remains readable (no shrinking below 14px)

---

## 9. No Wasted Effort

**What it means:**
- Don't make the user repeat themselves
- Save progress automatically
- Prefill forms where possible

**In practice:**
- Past analyses saved in localStorage
- Job description persists if user navigates away
- "Re-analyze" button reuses the same JD
- Outputs can be regenerated without re-entering data

---

## 10. Respectful of Attention

**What it means:**
- No unnecessary notifications or popups
- No auto-playing anything
- User initiates all actions

**In practice:**
- No toast notifications unless there's an error
- No "Are you sure?" dialogs for reversible actions
- No marketing copy or upsells in the UI
- Success states are subtle (green checkmark, not a modal)

---

## Anti-Patterns to Avoid

- **Skeuomorphism** — No fake textures, shadows that mimic physical objects, or 3D effects
- **Decoration for decoration's sake** — Every element must serve a purpose
- **Tiny click targets** — Minimum 40px for buttons, 32px for small controls
- **Mystery meat navigation** — Icons without labels, unclear CTAs
- **Modal overuse** — Prefer inline editing and contextual actions
- **Excessive animation** — Transitions should be fast (150ms) or nonexistent

---

## When in Doubt

Ask yourself:
1. Does this help the user accomplish their goal faster?
2. Is this the simplest solution that could work?
3. Would I want to use this myself?

If the answer to any of these is "no," reconsider the approach.

# 01 — Nexus Design System

**Read this first.** This file defines the shared visual language. Every other doc references these tokens. If something here conflicts with a page-specific doc, this file wins.

## 1. Color tokens

Add these as CSS variables on `:root` (or your equivalent — Tailwind config, theme provider, etc.).

```css
:root {
  /* Surfaces */
  --bg-base:        #0A0A0F;   /* page background, near-black with cool tint */
  --bg-elevated:    #12121A;   /* cards, panels */
  --bg-elevated-2:  #1A1A24;   /* cards on cards, hover states */
  --bg-input:       #0F0F17;   /* form inputs, slightly darker than cards */

  /* Borders */
  --border-subtle:  rgba(255, 255, 255, 0.06);  /* default card borders */
  --border-default: rgba(255, 255, 255, 0.10);  /* interactive borders */
  --border-strong:  rgba(255, 255, 255, 0.18);  /* focus, active states */

  /* Text */
  --text-primary:   #F5F5F7;   /* headings, primary content */
  --text-secondary: #A1A1AA;   /* body, secondary */
  --text-tertiary:  #6B6B76;   /* hints, metadata */
  --text-disabled:  #3F3F46;

  /* Brand gradient — use SPARINGLY, only for hero moments */
  --gradient-brand: linear-gradient(135deg, #C4B5FD 0%, #F0ABFC 50%, #FBA5C4 100%);
  --gradient-brand-subtle: linear-gradient(135deg, rgba(196,181,253,0.15) 0%, rgba(240,171,252,0.15) 100%);

  /* Accents */
  --accent-blue:    #3B82F6;   /* primary buttons, active states */
  --accent-blue-hover: #2563EB;
  --accent-green:   #10B981;   /* success, completed steps */
  --accent-amber:   #F59E0B;   /* warning, in-progress */
  --accent-red:     #EF4444;   /* destructive, errors */

  /* Glows — use as box-shadow on hover/focus */
  --glow-brand:     0 0 40px rgba(196, 181, 253, 0.15);
  --glow-blue:      0 0 24px rgba(59, 130, 246, 0.25);
  --glow-subtle:    0 0 20px rgba(255, 255, 255, 0.04);
}
```

**Rules for color usage:**
- The brand gradient is a hero element. Use it on **one** thing per page maximum (the page title's primary noun, or a single CTA — never both).
- Accent colors are functional only. Don't decorate with them.
- Borders should default to `--border-subtle`. Use stronger borders only for active/focus states.

## 2. Typography

```css
:root {
  /* Font stacks */
  --font-display: 'Geist', 'Inter', -apple-system, sans-serif;
  --font-body:    'Geist', 'Inter', -apple-system, sans-serif;
  --font-mono:    'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;

  /* Scale (clamp for responsive) */
  --text-xs:   0.75rem;    /* 12px - badges, metadata */
  --text-sm:   0.875rem;   /* 14px - secondary, hints */
  --text-base: 1rem;       /* 16px - body */
  --text-lg:   1.125rem;   /* 18px - emphasized body */
  --text-xl:   1.25rem;    /* 20px - subsection headers */
  --text-2xl:  1.5rem;     /* 24px - card titles */
  --text-3xl:  1.875rem;   /* 30px - page titles (sub-pages) */
  --text-4xl:  clamp(2.5rem, 5vw, 3.75rem);   /* hero page titles */
  --text-5xl:  clamp(3rem, 7vw, 5rem);        /* homepage hero only */

  /* Weights */
  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* Letter spacing */
  --tracking-tight:  -0.02em;   /* page titles, large display text */
  --tracking-normal: 0;
  --tracking-wide:   0.05em;    /* uppercase eyebrows, badges */
}
```

**Rules for typography:**
- Page titles always use `--tracking-tight` and `--weight-semibold` (not bold — bold reads cheap at large sizes).
- The brand gradient applies to the *noun* in a page title only ("Nexus", "Tracker", "Strategy") — not the whole heading.
- Body copy is `--text-secondary`, not white. Pure white body text on dark looks aggressive.
- Use the mono font for any technical values: file sizes, character counts, dates in metadata position.

## 3. Spacing & layout

```css
:root {
  /* Spacing scale (used for padding, gap, margin) */
  --space-1:  0.25rem;  /* 4px */
  --space-2:  0.5rem;   /* 8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */

  /* Radii */
  --radius-sm:  6px;    /* small chips, badges */
  --radius-md:  10px;   /* buttons, inputs */
  --radius-lg:  16px;   /* cards */
  --radius-xl:  24px;   /* large feature cards */
  --radius-full: 9999px;

  /* Container */
  --container-max: 1100px;   /* max content width */
  --container-padding: clamp(1rem, 4vw, 2rem);
}
```

**Layout rules:**
- The app uses a centered single-column layout, max `--container-max` wide. No fixed sidebar nav (the homepage bento grid IS the nav).
- Top padding on every page: `--space-16` minimum. Don't crowd the page title against the viewport top.
- Vertical rhythm between major sections: `--space-12`.

## 4. Background — the ambient grid

This is applied to `<body>` (or your top-level layout wrapper). **Every page gets this.** It's the single biggest unifier in the design.

```css
body {
  background-color: var(--bg-base);
  background-image:
    /* Top-right purple wash */
    radial-gradient(ellipse 80% 50% at 80% 0%, rgba(196, 181, 253, 0.08), transparent 50%),
    /* Bottom-left blue wash */
    radial-gradient(ellipse 60% 50% at 20% 100%, rgba(59, 130, 246, 0.05), transparent 50%),
    /* Grid */
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
  background-attachment: fixed;
  min-height: 100vh;
  color: var(--text-primary);
}
```

The grid is intentionally faint (~2.5% white). It should be felt, not seen. If users notice the grid, it's too strong.

## 5. Core components

### 5.1 Status badge (pill)

The little pill at the top of each page. Used to communicate page-level context.

```html
<div class="status-pill">
  <span class="status-dot"></span>
  AI resume tailoring · powered by Claude
</div>
```

```css
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  letter-spacing: var(--tracking-wide);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}
```

**Usage on each page** (replaces the current header treatment):
- Homepage: `● AI resume tailoring · powered by Claude`
- New Analysis: `● Step 1 of 3 · Input`
- Build Repository: `● Voice capture`
- Tracker: `● Local · Your data stays in your browser`
- Target Companies: `● 119 companies · Insurtech + Disability`
- Strategy: `● Playbook · Executive disability insurance`
- Outputs: `● Tailored for [Role] at [Company]` (dynamic)

### 5.2 Card

```css
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
}

.card:hover {
  border-color: var(--border-default);
  transform: translateY(-1px);
  box-shadow: var(--glow-subtle);
}

/* Interactive variant — for cards that are buttons */
.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  border-color: var(--border-strong);
  background: var(--bg-elevated-2);
}
```

### 5.3 Buttons

```css
/* Primary — solid blue. Use for the main action on a page. ONE per page. */
.btn-primary {
  background: var(--accent-blue);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background 150ms ease, box-shadow 150ms ease;
}

.btn-primary:hover {
  background: var(--accent-blue-hover);
  box-shadow: var(--glow-blue);
}

.btn-primary:disabled {
  background: var(--bg-elevated-2);
  color: var(--text-tertiary);
  cursor: not-allowed;
  box-shadow: none;
}

/* Secondary — outlined, for non-primary actions */
.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-secondary:hover {
  background: var(--bg-elevated-2);
  border-color: var(--border-strong);
}

/* Ghost — for destructive secondary actions (Delete) */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-ghost:hover {
  color: var(--accent-red);
  border-color: var(--accent-red);
}
```

### 5.4 Inputs

```css
.input, .textarea {
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  width: 100%;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input:focus, .textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.input::placeholder, .textarea::placeholder {
  color: var(--text-tertiary);
}
```

### 5.5 Page title pattern

```html
<header class="page-header">
  <a href="/" class="back-link">← Back</a>
  <div class="status-pill">...</div>
  <h1 class="page-title">
    <span class="page-title-emoji">📋</span>
    Job Search <span class="gradient-text">Tracker</span>
  </h1>
  <p class="page-subtitle">Applications, contacts, appointments & activity — all in your browser</p>
</header>
```

```css
.page-header {
  margin-bottom: var(--space-12);
}

.back-link {
  display: inline-block;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-decoration: none;
  margin-bottom: var(--space-6);
  transition: color 150ms ease;
}

.back-link:hover {
  color: var(--text-secondary);
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  margin: var(--space-3) 0 var(--space-2) 0;
  color: var(--text-primary);
}

.page-title-emoji {
  margin-right: var(--space-2);
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  max-width: 60ch;
}
```

**Note:** Only the homepage uses `--text-5xl` for the hero "Nexus" title. Every sub-page uses `--text-3xl` for the title. This visual hierarchy keeps the homepage feeling like the front door.

## 6. Motion & animation

Keep animations short and purposeful.

```css
:root {
  --transition-fast:   100ms;
  --transition-base:   150ms;
  --transition-slow:   250ms;
  --transition-slower: 400ms;

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);   /* default for most things */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* for back-and-forth motion */
}
```

**Rules:**
- Hover state transitions: 150ms ease-out.
- Page load reveals: 400ms ease-out, staggered by 50ms per item, max 6 items.
- No spring animations unless explicitly motivated (e.g., the recording mic).
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 7. What NOT to do

These are tempting and wrong:

- ❌ Gradient borders on every card. (Reserve for the active step indicator only.)
- ❌ Glow effects on hover for everything. (Subtle border color change is usually enough.)
- ❌ Animated gradients in the background. (The static gradient washes are intentional.)
- ❌ Multiple gradient-text headings on one page. (Maximum one per page.)
- ❌ Purple/pink accents on functional UI. (Reserve brand colors for hero moments; use blue/green/amber for function.)
- ❌ Drop shadows. (We use subtle glows instead. Drop shadows read as "skeuomorphic" and don't fit the aesthetic.)
- ❌ Custom font weights from variable fonts mid-page. (Stick to 400/500/600/700.)

## 8. Implementation checklist

When applying tokens to an existing page, confirm:

- [ ] All `background-color` values use a token, not a hex value
- [ ] All `border` values reference `--border-*` tokens
- [ ] All text colors use `--text-*` tokens (no raw `#fff`, no `text-white`)
- [ ] All padding/margin uses the spacing scale (no arbitrary `15px`, `22px`, etc.)
- [ ] All border-radius uses `--radius-*` tokens
- [ ] The page renders the ambient background (inherited from body)
- [ ] The page has a status pill in the header
- [ ] Exactly one gradient-text element exists (in the page title noun)
- [ ] No `<button>` uses inline styles; all use `.btn-primary`, `.btn-secondary`, or `.btn-ghost`

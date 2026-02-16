# Style Guide — Nexus

This document defines the visual language of Nexus: colors, typography, spacing, and component styles.

---

## Color Palette

### Foundation Colors

```css
/* Background */
--background: #171717        /* neutral-900 — main app background */
--surface: #262626           /* neutral-800 — card/panel backgrounds */
--surface-hover: #404040     /* neutral-700 — hover states on surfaces */

/* Text */
--foreground: #ededed        /* neutral-100 — primary text */
--foreground-muted: #a3a3a3  /* neutral-400 — secondary text */
--foreground-subtle: #737373 /* neutral-500 — tertiary text, hints */

/* Borders */
--border: #404040            /* neutral-700 — default borders */
--border-light: rgba(64, 64, 64, 0.5)  /* neutral-700/50 — subtle borders */
```

### Semantic Colors

```css
/* Primary (Actions) */
--primary: #2563eb           /* blue-600 — primary buttons */
--primary-hover: #1d4ed8     /* blue-700 — primary button hover */
--primary-light: #3b82f6     /* blue-500 — links, active states */

/* Success */
--success: #22c55e           /* green-500 — completed steps, checkmarks */
--success-bg: rgba(34, 197, 94, 0.2)  /* green-500/20 — success indicators */

/* Danger */
--danger: #ef4444            /* red-500 — delete actions, errors */
--danger-bg: rgba(239, 68, 68, 0.1)   /* red-500/10 — error backgrounds */

/* Warning */
--warning: #f59e0b           /* amber-500 — warnings */
--warning-bg: rgba(245, 158, 11, 0.1) /* amber-500/10 — warning backgrounds */
```

### Usage Rules

- **Background hierarchy**: neutral-900 (app) → neutral-800 (cards) → neutral-700 (hover)
- **Text hierarchy**: neutral-100 (primary) → neutral-400 (secondary) → neutral-500 (tertiary)
- **Never use pure black (#000) or pure white (#fff)** — always use the neutral scale
- **Primary blue is for actions only** — not for decoration or large areas
- **Red is for destructive actions and errors only** — use sparingly

---

## Typography

### Font Families

```css
--font-sans: var(--font-geist-sans), system-ui, -apple-system, sans-serif
--font-mono: var(--font-geist-mono), 'SF Mono', 'Courier New', monospace
```

- **Geist Sans**: Primary font for all UI and content
- **Geist Mono**: Code blocks, technical details, monospaced data

### Type Scale

```css
/* Headings */
--text-4xl: 2.25rem / 36px   /* Large page titles (h1) */
--text-3xl: 1.875rem / 30px  /* Section headers (h2) */
--text-2xl: 1.5rem / 24px    /* Subsection headers (h3) */
--text-xl: 1.25rem / 20px    /* Card titles */
--text-lg: 1.125rem / 18px   /* Prominent labels */

/* Body */
--text-base: 1rem / 16px     /* Standard body text */
--text-sm: 0.875rem / 14px   /* Secondary text, captions */
--text-xs: 0.75rem / 12px    /* Hints, metadata */
```

### Font Weights

```css
--font-normal: 400           /* Body text */
--font-medium: 500           /* Emphasized text */
--font-semibold: 600         /* Subheadings, labels */
--font-bold: 700             /* Headings, primary CTAs */
```

### Line Height

```css
--leading-tight: 1.25        /* Headings */
--leading-normal: 1.5        /* Body text */
--leading-relaxed: 1.75      /* Long-form content */
```

### Usage Rules

- **Page title (h1)**: text-4xl, font-bold, neutral-100
- **Section header (h2)**: text-3xl, font-bold, neutral-100
- **Subsection (h3)**: text-2xl, font-semibold, neutral-200
- **Body text**: text-base, font-normal, neutral-100
- **Secondary text**: text-sm, font-normal, neutral-400
- **Hints/metadata**: text-xs, font-normal, neutral-500
- **Never go below 14px (text-sm)** for body content
- **Line height**: 1.5 minimum for readability

---

## Spacing Scale

```css
/* Tailwind spacing units (4px base) */
0.5 → 2px    /* Hairline gaps */
1   → 4px    /* Tight spacing */
2   → 8px    /* Small gaps */
3   → 12px   /* Default inline spacing */
4   → 16px   /* Standard spacing */
5   → 20px   /* Comfortable spacing */
6   → 24px   /* Section spacing */
8   → 32px   /* Block spacing */
10  → 40px   /* Large block spacing */
12  → 48px   /* Section dividers */
16  → 64px   /* Major section breaks */
```

### Layout Spacing

- **Component padding**: 16px (p-4) minimum, 24px (p-6) for cards
- **Card spacing**: 12px (gap-3) between cards in a list
- **Section spacing**: 32px (space-y-8) between major sections
- **Page padding**: 32px (p-8) on all sides
- **Max content width**: 1024px (max-w-4xl) for readability

### Component Spacing

- **Button padding**: px-6 py-3 (24px × 12px) for primary, px-4 py-2 (16px × 8px) for secondary
- **Input padding**: px-4 py-3 (16px × 12px)
- **Card padding**: p-6 (24px) for content cards, p-5 (20px) for list items
- **Gap between related elements**: gap-2 (8px) for tight groups, gap-4 (16px) for loose groups

---

## Borders & Shadows

### Borders

```css
/* Border widths */
--border-1: 1px              /* Default borders */
--border-2: 2px              /* Emphasis, focus states */

/* Border radius */
--rounded-lg: 0.5rem / 8px   /* Small components (buttons, inputs) */
--rounded-xl: 0.75rem / 12px /* Cards, panels */
--rounded-full: 9999px       /* Pills, circular elements */
```

### Shadows

```css
/* Elevation */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2)

/* Glows (for hover states) */
--shadow-blue: 0 10px 25px rgba(37, 99, 235, 0.2)   /* Primary button hover */
--shadow-green: 0 4px 12px rgba(34, 197, 94, 0.2)   /* Success indicators */
```

### Usage Rules

- **Default cards**: border-neutral-700/50, no shadow
- **Hover cards**: border-neutral-600, no shadow (just border lightens)
- **Buttons on hover**: shadow-lg + shadow-blue glow
- **Use rounded-xl for all cards** — consistent corner radius
- **Use rounded-lg for buttons and inputs** — slightly tighter radius
- **Never use hard shadows** — always subtle, always rgba with low opacity

---

## Component Styles

### Buttons

#### Primary Button
```tsx
className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/20"
```

#### Secondary Button
```tsx
className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-100
rounded-lg transition-all font-medium"
```

#### Danger Button (Hover State)
```tsx
className="px-4 py-2 bg-neutral-700 hover:bg-red-600 text-neutral-300
hover:text-white rounded-lg transition-all"
```

#### Disabled Button
```tsx
disabled={true}
className="px-6 py-3 bg-neutral-700 text-neutral-500 rounded-lg
cursor-not-allowed"
```

### Cards

#### Default Card
```tsx
className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50
hover:border-neutral-600 hover:bg-neutral-800 transition-all"
```

#### Emphasis Card (Active State)
```tsx
className="p-6 bg-neutral-800 rounded-xl border-2 border-blue-500"
```

### Inputs

#### Text Input
```tsx
className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700
rounded-lg text-neutral-100 placeholder-neutral-500
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
focus:outline-none transition-all"
```

#### Textarea
```tsx
className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700
rounded-lg text-neutral-100 placeholder-neutral-500
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
focus:outline-none transition-all resize-none"
rows={10}
```

### Tabs

```tsx
{/* Tab Container */}
<div className="border-b border-neutral-700/50">
  <div className="flex space-x-1">

    {/* Active Tab */}
    <button className="pb-3 px-4 text-base font-medium border-b-2
    border-blue-500 text-blue-400">
      Tab Name
    </button>

    {/* Inactive Tab */}
    <button className="pb-3 px-4 text-base font-medium border-b-2
    border-transparent text-neutral-400 hover:text-neutral-200
    hover:border-neutral-600">
      Tab Name
    </button>

  </div>
</div>
```

### Loading States

#### Spinner
```tsx
<div className="w-8 h-8 border-4 border-neutral-700 border-t-blue-500
rounded-full animate-spin" />
```

#### Skeleton
```tsx
<div className="h-4 bg-neutral-700 rounded animate-pulse" />
```

#### Loading Dots
```tsx
<div className="flex gap-2">
  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100" />
  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200" />
</div>
```

---

## Transitions

All transitions use the same timing function for consistency:

```css
transition-property: color, background-color, border-color, opacity, transform;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
transition-duration: 150ms;
```

Use Tailwind's `transition-all` utility for most cases. Only specify individual properties if performance is a concern.

---

## Responsive Breakpoints

```css
sm: 640px   /* Small tablets, large phones (not commonly used) */
md: 768px   /* Tablets (minimum supported width) */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops (content max-width) */
```

### Usage

- **Desktop-first design** — optimize for 1024px+ screens
- **Mobile-friendly down to 768px** — layout adapts, functionality intact
- **Do not support phone screens (< 768px)** — this tool requires a full keyboard and large viewport

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```tsx
focus:outline-none focus:ring-2 focus:ring-blue-500/50
```

### Color Contrast

All text must meet WCAG AA contrast standards (4.5:1 for body text):

- **neutral-100 on neutral-900**: ✅ Pass (13.4:1)
- **neutral-400 on neutral-900**: ✅ Pass (5.8:1)
- **neutral-500 on neutral-900**: ⚠️ Borderline (3.9:1) — use for hints only, not body text
- **blue-500 on neutral-900**: ✅ Pass (6.2:1)

### Keyboard Navigation

- All buttons and links are keyboard-focusable
- Tab order follows visual flow
- Enter/Space activates buttons
- Escape closes modals/dropdowns

---

## Design Tokens Reference

For quick copy-paste:

```tsx
// Backgrounds
bg-neutral-900     // App background
bg-neutral-800     // Card background
bg-neutral-700     // Button/hover background

// Text
text-neutral-100   // Primary text
text-neutral-400   // Secondary text
text-neutral-500   // Tertiary text

// Borders
border-neutral-700 // Default border
border-neutral-600 // Hover border
border-blue-500    // Active/focus border

// Primary Action
bg-blue-600 hover:bg-blue-700 text-white

// Secondary Action
bg-neutral-700 hover:bg-neutral-600 text-neutral-100

// Card
bg-neutral-800/50 border border-neutral-700/50 rounded-xl

// Input
bg-neutral-800 border border-neutral-700 rounded-lg
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
```

---

## When in Doubt

1. **Check existing components first** — stay consistent with what's already built
2. **Use the neutral scale** — avoid introducing new grays
3. **Blue for actions, neutral for everything else** — color should have meaning
4. **Generous spacing** — when in doubt, add more padding
5. **Test in dark mode** — this is the default and only theme

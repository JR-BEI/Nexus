# 02 — Shared Shell

The reusable wrapper every page renders inside. This is the single biggest source of cross-page consistency. Implement this once; reuse everywhere.

**Depends on:** `01-design-system.md`

## What this includes

1. The global layout wrapper (background, container, padding)
2. The page header pattern (back link, status pill, title, subtitle)
3. The reusable `<PageShell>` component (if using React) or layout template (if using plain HTML/templating)

## 1. Global layout wrapper

If using a framework with a root layout (`app/layout.tsx`, `_app.tsx`, etc.), apply the body styles from `01-design-system.md` section 4 to the root element.

If using plain HTML, ensure the body styles are loaded site-wide via a base stylesheet.

```css
/* Container — used inside each page */
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-16) var(--container-padding) var(--space-24);
}
```

## 2. PageShell component

Use this on every sub-page (not the homepage — the homepage has its own hero treatment). It enforces consistency without forcing the developer to remember structure.

### React version

```tsx
// components/PageShell.tsx
import { ReactNode } from 'react';

interface PageShellProps {
  /** Emoji prefix for the title, e.g. "📋" */
  emoji?: string;
  /** First part of title, rendered normally */
  titlePrefix: string;
  /** Second part of title, rendered with brand gradient */
  titleAccent: string;
  /** Subtitle text below the title */
  subtitle: string;
  /** Status pill content (the text after the green dot) */
  status: string;
  /** Where the back link should go. Defaults to "/" */
  backHref?: string;
  /** Back link label. Defaults to "Back" */
  backLabel?: string;
  /** Optional element rendered to the right of the title block (e.g., Import/Export buttons) */
  headerAction?: ReactNode;
  /** Page content */
  children: ReactNode;
}

export function PageShell({
  emoji,
  titlePrefix,
  titleAccent,
  subtitle,
  status,
  backHref = '/',
  backLabel = 'Back',
  headerAction,
  children,
}: PageShellProps) {
  return (
    <main className="container">
      <header className="page-header">
        <a href={backHref} className="back-link">← {backLabel}</a>

        <div className="page-header-top">
          <div className="page-header-text">
            <div className="status-pill">
              <span className="status-dot" />
              {status}
            </div>
            <h1 className="page-title">
              {emoji && <span className="page-title-emoji">{emoji}</span>}
              {titlePrefix}{' '}
              <span className="gradient-text">{titleAccent}</span>
            </h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          {headerAction && (
            <div className="page-header-action">{headerAction}</div>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
```

### Plain HTML/template version

```html
<main class="container">
  <header class="page-header">
    <a href="/" class="back-link">← Back</a>
    <div class="page-header-top">
      <div class="page-header-text">
        <div class="status-pill">
          <span class="status-dot"></span>
          {{ status }}
        </div>
        <h1 class="page-title">
          <span class="page-title-emoji">{{ emoji }}</span>
          {{ titlePrefix }} <span class="gradient-text">{{ titleAccent }}</span>
        </h1>
        <p class="page-subtitle">{{ subtitle }}</p>
      </div>
      <div class="page-header-action">{{ headerAction }}</div>
    </div>
  </header>
  {{ content }}
</main>
```

## 3. Required CSS for the shell

Add to your global stylesheet (these are referenced by the component above):

```css
.page-header-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
  margin-top: var(--space-2);
}

.page-header-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.page-header-action {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* The status pill and page title styles come from 01-design-system.md */
/* This file only adds the layout that arranges them. */

/* Reset spacing on title and subtitle inside the flex column */
.page-header-text .page-title {
  margin: 0;
}

.page-header-text .page-subtitle {
  margin: 0;
}
```

## 4. Page entry animation

To make pages feel composed rather than just appearing, add a subtle entry animation. This applies once per page load.

```css
.page-header,
.page-content-section {
  animation: fade-up 400ms var(--ease-out) backwards;
}

.page-header { animation-delay: 0ms; }
.page-content-section { animation-delay: 80ms; }
.page-content-section:nth-of-type(2) { animation-delay: 130ms; }
.page-content-section:nth-of-type(3) { animation-delay: 180ms; }
/* etc. */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Wrap each major section of a page in a `<section class="page-content-section">` so the stagger works automatically.

## 5. Per-page configuration table

When implementing each page, use these exact values for the shell:

| Page | emoji | titlePrefix | titleAccent | status |
|------|-------|-------------|-------------|--------|
| New Analysis | (none) | New | Analysis | `Step 1 of 3 · Input` *(dynamic per step)* |
| Build Repository | 📚 | Build | Repository | `Voice capture` |
| Tracker | 📋 | Job Search | Tracker | `Local · Your data stays in your browser` |
| Target Companies | 🎯 | Target | Companies | `119 companies · Insurtech + Disability` |
| Strategy | 🧭 | Job Search | Strategy | `Playbook · Executive disability insurance` |
| Outputs | (none) | Tailored | Outputs | `For [Role] at [Company]` *(dynamic)* |

The homepage does NOT use the PageShell — it has its own hero treatment (handled in `09-homepage-polish.md`).

## 6. Acceptance criteria

Before marking this done:

- [ ] `PageShell` component (or template) exists and is exported/available
- [ ] All required CSS from sections 1, 3, and 4 is in the global stylesheet
- [ ] At least one sub-page has been refactored to use the shell as a smoke test
- [ ] The shell renders correctly at narrow viewports (header stacks vertically below ~600px)
- [ ] The fade-up animation runs once on page load and does not re-trigger on internal state changes
- [ ] `prefers-reduced-motion` respects the override from `01-design-system.md`

## 7. Responsive behavior

At narrow viewports (`max-width: 640px`), the header should stack:

```css
@media (max-width: 640px) {
  .page-header-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header-action {
    width: 100%;
  }

  .page-title {
    font-size: var(--text-2xl);
  }
}
```

# 08 — Job Search Strategy

The long-form playbook page with a sidebar table of contents and structured reference content. The user comes here to read and reference — not to interact.

**Depends on:** `01-design-system.md`, `02-shared-shell.md`

## Current state

Two-column layout: sticky TOC on the left, content on the right with H1, sections (1. Executive Recruiters, etc.), each section with subsections (Insurance-focused firms, Tech/insurtech executive search) and bulleted lists with bold company names and descriptions.

Issues:

1. No active-section indicator in TOC — user doesn't know where they are in the doc.
2. No reading-progress indicator at viewport top.
3. Content typography is fine but could be tightened.
4. TOC filter input ("Filter sections...") is good but could be more prominent.

## Goals

1. Add a scroll-spy active-section indicator on the TOC.
2. Add a thin reading-progress bar at viewport top.
3. Tighten content typography for a comfortable reading experience.
4. Make the TOC feel like a navigation aid, not just a list.

## Implementation

### 1. Page wrapper

```tsx
<PageShell
  emoji="🧭"
  titlePrefix="Job Search"
  titleAccent="Strategy"
  subtitle="Executive disability insurance / insurtech — playbook & contacts"
  status="Playbook · Executive disability insurance"
  backHref="/"
  backLabel="Back to Home"
>
  <ReadingProgress />
  <div className="strategy-layout">
    <aside className="strategy-toc">
      <StrategyTOC sections={sections} activeId={activeId} />
    </aside>
    <article className="strategy-content">
      {/* sections */}
    </article>
  </div>
</PageShell>
```

### 2. Reading progress bar

A 2px gradient bar fixed to the top of the viewport, filling as the user scrolls.

```tsx
// components/ReadingProgress.tsx
import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calc = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(pct);
    };
    calc();
    window.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc);
      window.removeEventListener('resize', calc);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden>
      <div className="reading-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
```

```css
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  z-index: 50;
  pointer-events: none;
}

.reading-progress-fill {
  height: 100%;
  background: var(--gradient-brand);
  transition: width 50ms linear;
}
```

### 3. Layout

```css
.strategy-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-12);
  align-items: start;
}

.strategy-toc {
  position: sticky;
  top: var(--space-8);
  max-height: calc(100vh - var(--space-16));
  overflow-y: auto;
  padding-right: var(--space-2);
}

@media (max-width: 900px) {
  .strategy-layout {
    grid-template-columns: 1fr;
  }
  .strategy-toc {
    position: static;
    max-height: none;
  }
}
```

### 4. TOC component with scroll-spy

```tsx
// components/StrategyTOC.tsx
import { useEffect, useState } from 'react';

interface TocSection {
  id: string;
  label: string;
  level: 1 | 2;
}

export function StrategyTOC({ sections, activeId }: { sections: TocSection[]; activeId: string }) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? sections.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
    : sections;

  return (
    <nav className="toc">
      <div className="toc-header">
        <span className="toc-label">On this page</span>
        <input
          type="search"
          className="toc-search input"
          placeholder="Filter sections..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="toc-list">
        {filtered.map((s) => (
          <li
            key={s.id}
            className={[
              'toc-item',
              `toc-item-l${s.level}`,
              activeId === s.id ? 'toc-item-active' : '',
            ].join(' ')}
          >
            <a href={`#${s.id}`} className="toc-link">{s.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

```css
.toc-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.toc-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-tertiary);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.toc-search {
  font-size: var(--text-xs);
  padding: var(--space-2) var(--space-3);
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.toc-item {
  position: relative;
}

.toc-item-l1 {
  margin-top: var(--space-3);
}

.toc-item-l2 {
  padding-left: var(--space-3);
}

.toc-link {
  display: block;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color 150ms ease, border-color 150ms ease;
  line-height: 1.4;
}

.toc-item-l1 .toc-link {
  color: var(--text-secondary);
  font-weight: var(--weight-medium);
}

.toc-link:hover {
  color: var(--text-primary);
}

.toc-item-active .toc-link {
  color: var(--text-primary);
  border-left-color: transparent;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--accent-blue) 12%, transparent),
    transparent
  );
}

.toc-item-active.toc-item-l1 .toc-link {
  border-left: 2px solid;
  border-image: var(--gradient-brand) 1;
}

.toc-item-active.toc-item-l2 .toc-link {
  border-left: 2px solid var(--accent-blue);
}
```

### 5. Scroll-spy logic

Add this to the page component. It tracks which section the user is currently reading.

```tsx
import { useEffect, useState } from 'react';

function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeId, setActiveId] = useState(sectionIds[0] || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: `-${offset}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, offset]);

  return activeId;
}
```

Usage:

```tsx
const allIds = sections.map((s) => s.id);
const activeId = useScrollSpy(allIds);
```

### 6. Content typography

The content area follows the document typography from `04-outputs.md` but with slightly different proportions for long-form reading.

```css
.strategy-content {
  max-width: 70ch;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--text-secondary);
}

.strategy-content h1 {
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin: 0 0 var(--space-4);
}

.strategy-content h2 {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: var(--space-12) 0 var(--space-4);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-subtle);
  /* Anchor offset for fixed header */
  scroll-margin-top: var(--space-8);
}

.strategy-content h3 {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: var(--space-6) 0 var(--space-2);
  scroll-margin-top: var(--space-8);
}

.strategy-content p {
  margin: 0 0 var(--space-4);
}

.strategy-content ul {
  padding-left: var(--space-6);
  margin: 0 0 var(--space-4);
}

.strategy-content li {
  margin-bottom: var(--space-2);
}

.strategy-content li::marker {
  color: var(--text-tertiary);
}

.strategy-content strong {
  color: var(--text-primary);
  font-weight: var(--weight-semibold);
}

/* Profile / Core insight callouts (bold label followed by content) */
.strategy-content p strong:first-child {
  display: inline-block;
  margin-right: var(--space-1);
}

/* Highlighted text — "Highest priority contact for disability insurance roles." */
.strategy-content em.highlight,
.strategy-content strong em {
  background: rgba(196, 181, 253, 0.1);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-style: normal;
}
```

### 7. Section structure (in JSX or markdown)

Each section needs an `id` matching the TOC entry:

```tsx
<section id="executive-recruiters">
  <h2>1. Executive Recruiters</h2>
  <p>These firms are paid by the hiring company...</p>
  <h3 id="insurance-focused-firms">Insurance-focused firms</h3>
  <ul>...</ul>
</section>
```

If content is in markdown, ensure your markdown renderer adds `id` attributes to headings (most do via slugify plugins like `rehype-slug`).

## Acceptance criteria

- [ ] Page uses `PageShell` with the playbook status
- [ ] 2px gradient progress bar appears at viewport top and fills as user scrolls
- [ ] TOC sticks to the viewport while scrolling content
- [ ] Active section in TOC is highlighted with a left border accent and subtle background fade
- [ ] H2-level TOC items have gradient borders when active, H3-level have solid blue
- [ ] TOC filter input shrinks the list in real-time as user types
- [ ] Clicking a TOC link smooth-scrolls to the section
- [ ] Content max-width is ~70ch for comfortable reading
- [ ] Layout collapses to single column at <900px width
- [ ] Section headings have `scroll-margin-top` so anchor links don't hide under viewport edge

# 09 — Homepage Polish

The homepage is already in great shape from the earlier redesign. This doc covers small refinements to bring it into perfect alignment with the design system tokens established in `01-design-system.md`.

**Depends on:** `01-design-system.md`, `02-shared-shell.md` (for the status pill component), `06-tracker.md` (for status pill styling on app cards)

## Current state

Strong hero (gradient "Nexus" wordmark, subtitle, status pill), 5-card bento grid (New Analysis hero card + 4 secondary cards), Past Analyses section below. The structure works — this doc tweaks tokens, spacing, and adds a few polish touches.

## Goals

1. Ensure all hardcoded values are replaced with tokens.
2. Add subtle motion on initial page load (staggered fade-up).
3. Polish the Past Analyses cards (status badges, hover state).
4. Add empty state for users with no past analyses.

## Implementation

### 1. Hero section — token alignment

The current hero is correct in structure. Just confirm:

```css
.hero {
  text-align: center;
  padding: var(--space-24) 0 var(--space-16);
}

.hero-title {
  font-size: var(--text-5xl);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  margin: var(--space-4) 0 var(--space-4);
  line-height: 1;
}

.hero-title-gradient {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 36rem;
  margin: 0 auto;
  line-height: 1.5;
}
```

The status pill above the title uses the same `.status-pill` component from the design system.

### 2. Bento grid — confirm structure

```tsx
<section className="bento-grid">
  <a href="/new" className="bento-card bento-card-hero">
    <div className="bento-card-icon">✨</div>
    <h2 className="bento-card-title">New Analysis</h2>
    <p className="bento-card-body">Paste a JD. Get a tailored resume, cover letter, and interview brief.</p>
    <span className="bento-card-cta">Open →</span>
  </a>

  <a href="/tracker" className="bento-card">
    <div className="bento-card-icon">📋</div>
    <h3 className="bento-card-title">Tracker</h3>
    <p className="bento-card-body">Applications, contacts, interviews, notes.</p>
    <span className="bento-card-cta">Open →</span>
  </a>

  <a href="/repository" className="bento-card">
    <div className="bento-card-icon">📚</div>
    <h3 className="bento-card-title">Build Repository</h3>
    <p className="bento-card-body">Capture impact statements by voice or text.</p>
    <span className="bento-card-cta">Open →</span>
  </a>

  <a href="/companies" className="bento-card">
    <div className="bento-card-icon">🎯</div>
    <h3 className="bento-card-title">Target Companies</h3>
    <p className="bento-card-body">119 insurtech & disability-focused employers, ranked.</p>
    <span className="bento-card-cta">Open →</span>
  </a>

  <a href="/strategy" className="bento-card">
    <div className="bento-card-icon">🧭</div>
    <h3 className="bento-card-title">Strategy</h3>
    <p className="bento-card-body">Recruiters, boards, conferences — your playbook.</p>
    <span className="bento-card-cta">Open →</span>
  </a>
</section>
```

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin: var(--space-12) 0;
}

.bento-card {
  /* Hero card spans 2 columns (top-left) */
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 180px;
  position: relative;
  transition: all 200ms var(--ease-out);
  overflow: hidden;
}

.bento-card-hero {
  grid-column: span 2;
}

.bento-card::before {
  /* Subtle gradient glow on hover */
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 100% at 50% 0%,
    rgba(196, 181, 253, 0.06),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}

.bento-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.bento-card:hover::before {
  opacity: 1;
}

.bento-card-icon {
  font-size: var(--text-xl);
  margin-bottom: var(--space-2);
}

.bento-card-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.bento-card-hero .bento-card-title {
  font-size: var(--text-xl);
}

.bento-card-body {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.bento-card-cta {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: auto;
  padding-top: var(--space-4);
  transition: color 150ms ease;
}

.bento-card:hover .bento-card-cta {
  color: var(--accent-blue);
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-card-hero {
    grid-column: span 1;
  }
}
```

### 3. Past Analyses section

Upgrade the existing list to include status badges (Applied / Interviewing / etc.) pulled from the tracker if available.

```tsx
<section className="page-content-section past-analyses">
  <div className="past-analyses-header">
    <h2 className="section-title">Past Analyses</h2>
    <span className="section-meta">{analyses.length} saved · click to reopen</span>
  </div>

  {analyses.length === 0 ? (
    <div className="empty-state">
      <p className="empty-state-title">No analyses yet</p>
      <p className="empty-state-body">Start with a job description to generate your first tailored resume.</p>
      <a href="/new" className="btn-primary">+ New Analysis</a>
    </div>
  ) : (
    <div className="past-analyses-grid">
      {analyses.map((a) => (
        <PastAnalysisCard key={a.id} analysis={a} />
      ))}
    </div>
  )}
</section>
```

```css
.past-analyses-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--tracking-tight);
}

.section-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.past-analyses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}
```

### 4. Past analysis card

```tsx
function PastAnalysisCard({ analysis }: { analysis: Analysis }) {
  return (
    <div className="past-card">
      <div className="past-card-header">
        <h3 className="past-card-role">{analysis.role}</h3>
        {analysis.trackerStatus && (
          <span className={`past-card-status past-card-status-${analysis.trackerStatus}`}>
            {trackerStatusLabel(analysis.trackerStatus)}
          </span>
        )}
      </div>
      <div className="past-card-company">{analysis.company || 'Not specified'}</div>
      <div className="past-card-date">{formatDate(analysis.date)}</div>
      <div className="past-card-actions">
        <a href={`/analysis/${analysis.id}`} className="btn-primary btn-sm">View</a>
        <button className="btn-ghost btn-sm" onClick={() => onDelete(analysis.id)}>Delete</button>
      </div>
    </div>
  );
}
```

```css
.past-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  transition: border-color 150ms ease;
}

.past-card:hover {
  border-color: var(--border-default);
}

.past-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.past-card-role {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.past-card-status {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

/* Status colors mirror the kanban column colors from doc 06 */
.past-card-status-applied {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.past-card-status-interviewing {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.past-card-status-offer {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.past-card-status-rejected {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.past-card-company {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.past-card-date {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  margin-bottom: var(--space-3);
}

.past-card-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
}
```

### 5. Staggered entry animation

Bring the page to life on initial load:

```css
.hero { animation: fade-up 500ms var(--ease-out) backwards; animation-delay: 0ms; }
.bento-grid { animation: fade-up 500ms var(--ease-out) backwards; animation-delay: 100ms; }
.past-analyses { animation: fade-up 500ms var(--ease-out) backwards; animation-delay: 200ms; }

.bento-card {
  animation: fade-up 500ms var(--ease-out) backwards;
}
.bento-card:nth-child(1) { animation-delay: 120ms; }
.bento-card:nth-child(2) { animation-delay: 160ms; }
.bento-card:nth-child(3) { animation-delay: 200ms; }
.bento-card:nth-child(4) { animation-delay: 240ms; }
.bento-card:nth-child(5) { animation-delay: 280ms; }

/* fade-up keyframe already defined in 02-shared-shell.md */
```

## Acceptance criteria

- [ ] All colors, spacing, radii reference tokens from `01-design-system.md` (no hardcoded hex, no arbitrary pixel values)
- [ ] Bento grid renders 3-column at desktop with "New Analysis" spanning 2 columns
- [ ] Each bento card has a hover state: lift, border brightens, subtle gradient glow appears
- [ ] CTA arrow ("Open →") turns blue on card hover
- [ ] Page load animation staggers hero → bento → past analyses
- [ ] Past Analyses section shows empty state with CTA when list is empty
- [ ] Past analysis cards show colored status badge when linked to tracker entry
- [ ] Layout collapses to single column at <768px
- [ ] Status pill at the top is the same component used in all sub-pages

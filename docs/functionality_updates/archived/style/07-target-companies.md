# 07 — Target Companies

The dense, scannable list of target companies with fit scores. The information density here is correct — don't over-style.

**Depends on:** `01-design-system.md`, `02-shared-shell.md`

## Current state

Good IA: filter tabs at top (All / Insurtech / Disability & Absence), search box, ATS filter, sort dropdown, min-fit filter row, then a list of company cards with fit score badge, name, vertical pill, location, stage, why-fit, note, and action buttons (Greenhouse, + Track, Careers).

Issues:

1. Top filter area is three loosely floating elements (tabs, then a row of input + dropdowns, then min-fit chips) — feels uncoordinated.
2. Fit score badge (the green "10") doesn't stand out enough — it should be the hero of each card.
3. Cards are functional but flat. Hover state is missing.
4. Action buttons in top-right of each card look a bit jumbled.

## Goals

1. Unify the filter controls into one cohesive card.
2. Make the fit score badge feel like a *score*, with visual treatment scaling with the value.
3. Add card hover state and a single consistent action area.

## Implementation

### 1. Page wrapper

```tsx
<PageShell
  emoji="🎯"
  titlePrefix="Target"
  titleAccent="Companies"
  subtitle={`${filteredCount} of ${totalCount} companies across insurtech, disability & absence`}
  status={`${totalCount} companies tracked`}
  backHref="/"
  backLabel="Back to Home"
>
  {/* page content */}
</PageShell>
```

### 2. Unified filter card

Combine the vertical filter, search, dropdowns, and min-fit row into one cohesive card.

```tsx
<section className="page-content-section">
  <div className="filter-card">
    {/* Row 1: Vertical filter tabs */}
    <div className="filter-row filter-tabs">
      {verticals.map((v) => (
        <button
          key={v.id}
          className={`filter-tab ${activeVertical === v.id ? 'filter-tab-active' : ''}`}
          onClick={() => setActiveVertical(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>

    {/* Row 2: Search + ATS + Sort */}
    <div className="filter-row filter-controls">
      <input
        type="search"
        className="input filter-search"
        placeholder="Search company, focus, why-fit..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select className="input filter-select" value={ats} onChange={(e) => setAts(e.target.value)}>
        <option value="all">All ATS</option>
        <option value="greenhouse">Greenhouse</option>
        <option value="lever">Lever</option>
        <option value="workday">Workday</option>
        <option value="other">Other</option>
      </select>
      <select className="input filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="fit">Sort: Fit score</option>
        <option value="name">Sort: Name (A–Z)</option>
        <option value="stage">Sort: Stage</option>
      </select>
    </div>

    {/* Row 3: Min fit */}
    <div className="filter-row filter-minfit">
      <span className="filter-label">Min fit:</span>
      {['Any', '≥7', '≥8', '≥9', '≥10'].map((v) => (
        <button
          key={v}
          className={`filter-chip ${minFit === v ? 'filter-chip-active' : ''}`}
          onClick={() => setMinFit(v)}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
</section>
```

```css
.filter-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-tabs {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-1);
}

.filter-tab {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-tab:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}

.filter-tab-active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.filter-controls {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-2);
}

.filter-search {
  min-width: 0;
}

.filter-select {
  width: auto;
  cursor: pointer;
}

.filter-minfit {
  font-size: var(--text-sm);
}

.filter-label {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.filter-chip {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition: all 150ms ease;
}

.filter-chip:hover {
  border-color: var(--border-default);
}

.filter-chip-active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

@media (max-width: 768px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }
}
```

### 3. Company card

```tsx
function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="company-card">
      <div className="company-card-main">
        <div className={`fit-score fit-score-${getFitTier(company.fit)}`}>
          {company.fit}
        </div>

        <div className="company-card-content">
          <div className="company-card-header">
            <h3 className="company-name">{company.name}</h3>
            <span className="company-vertical">{company.vertical}</span>
          </div>

          <div className="company-card-meta">
            <span>📍 {company.location}</span>
            <span>📊 {company.stage}</span>
          </div>

          <p className="company-whyfit">
            <strong>Why fit:</strong> {company.whyFit}
          </p>
          {company.note && (
            <p className="company-note">{company.note}</p>
          )}
        </div>

        <div className="company-actions">
          <span className="company-ats">{company.ats}</span>
          <button className="btn-secondary btn-sm" onClick={() => track(company)}>
            {company.tracked ? '✓ Tracked' : '+ Track'}
          </button>
          <a href={company.careersUrl} target="_blank" rel="noopener" className="btn-primary btn-sm">
            Careers ↗
          </a>
        </div>
      </div>
    </article>
  );
}
```

```css
.company-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.company-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  transition: border-color 150ms ease, background 150ms ease;
}

.company-card:hover {
  border-color: var(--border-default);
  background: var(--bg-elevated-2);
}

.company-card-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-4);
  align-items: start;
}

/* Fit score — the hero element */
.fit-score {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* Tier coloring — high fit scores feel premium */
.fit-score-high {  /* 9-10 */
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15));
  border: 1px solid rgba(16, 185, 129, 0.5);
  color: #34d399;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

.fit-score-good {  /* 7-8 */
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.fit-score-fair {  /* 5-6 */
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.fit-score-low {  /* <5 */
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
}

/* Content column */
.company-card-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.company-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.company-name {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.company-vertical {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  padding: 2px var(--space-2);
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.company-card-meta {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.company-whyfit {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
  line-height: 1.5;
}

.company-whyfit strong {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.company-note {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-style: italic;
  margin: 0;
}

/* Actions column */
.company-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
}

.company-ats {
  font-size: var(--text-xs);
  color: var(--accent-green);
  padding: 2px var(--space-2);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-sm);
  font-weight: var(--weight-medium);
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}
```

### 4. Fit tier helper

```ts
function getFitTier(score: number): 'high' | 'good' | 'fair' | 'low' {
  if (score >= 9) return 'high';
  if (score >= 7) return 'good';
  if (score >= 5) return 'fair';
  return 'low';
}
```

### 5. Empty state

When filters return no results:

```tsx
{filteredCompanies.length === 0 && (
  <div className="empty-state">
    <p className="empty-state-title">No companies match these filters</p>
    <p className="empty-state-body">Try lowering the min fit or clearing search.</p>
    <button className="btn-secondary" onClick={resetFilters}>Clear filters</button>
  </div>
)}
```

```css
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-6);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-lg);
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.empty-state-body {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0 0 var(--space-4);
}
```

## Acceptance criteria

- [ ] Page uses `PageShell` with dynamic company count in subtitle
- [ ] All filter controls live inside one unified `.filter-card`
- [ ] Vertical tabs (All / Insurtech / Disability) use the pill style and are visually separated from the controls row by a divider
- [ ] Min-fit chips work like a button group, with the active value highlighted blue
- [ ] Fit scores 9–10 have a green glow treatment that makes them stand out
- [ ] Fit scores 7–8 are blue, 5–6 amber, <5 muted gray
- [ ] Company cards have hover state (border + background lift)
- [ ] Action area on each card is right-aligned and stacked (ATS pill, Track, Careers)
- [ ] Empty state appears when filters return nothing, with clear-filters CTA

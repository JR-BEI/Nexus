# 06 — Job Search Tracker

The kanban board with tabs for Applications, Contacts, Appointments, Activity.

**Depends on:** `01-design-system.md`, `02-shared-shell.md`, `04-outputs.md` (reuses Tabs component)

## Current state

Solid foundation. Tabs at top, search + new application row, kanban columns with colored status pills, drop zones below each column header. Issues:

1. Tabs underline doesn't slide (already fixed via Tabs component from doc 04).
2. Kanban columns are flat boxes — no visual distinction tied to their pill color.
3. "Drag cards between columns to change status" is permanent hint text that should be dismissible.
4. Import/Export buttons in top-right look detached.
5. Empty state ("drop here") is the same for every column — opportunity to add personality.

## Goals

1. Bring the column color identity through to the column itself (subtle top border).
2. Make empty columns less depressing.
3. Polish the application cards (when they exist) with hover state.
4. Anchor Import/Export to the page header via the `headerAction` slot.

## Implementation

### 1. Page wrapper

```tsx
<PageShell
  emoji="📋"
  titlePrefix="Job Search"
  titleAccent="Tracker"
  subtitle="Applications, contacts, appointments & activity — all in your browser."
  status="Local · Your data stays in your browser"
  backHref="/"
  backLabel="Back to Home"
  headerAction={
    <>
      <button className="btn-secondary" onClick={handleImport}>Import</button>
      <button className="btn-secondary" onClick={handleExport}>Export</button>
    </>
  }
>
  {/* page content */}
</PageShell>
```

### 2. Tabs (reuse from doc 04)

```tsx
<Tabs
  tabs={[
    { id: 'applications', label: '📋 Applications' },
    { id: 'contacts', label: '👥 Contacts' },
    { id: 'appointments', label: '📆 Appointments' },
    { id: 'activity', label: '📝 Activity' },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### 3. Toolbar (search + new)

```tsx
<div className="tracker-toolbar">
  <input
    type="search"
    className="input"
    placeholder="Filter by company, role, source..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
  <button className="btn-primary" onClick={handleNew}>
    + New Application
  </button>
</div>

{showDragHint && (
  <div className="tracker-hint">
    💡 Drag cards between columns to change status
    <button className="tracker-hint-close" onClick={dismissHint} aria-label="Dismiss hint">×</button>
  </div>
)}
```

```css
.tracker-toolbar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.tracker-toolbar .input {
  flex: 1;
}

.tracker-hint {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-6);
}

.tracker-hint-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: var(--text-base);
  line-height: 1;
  padding: 0;
  margin-left: var(--space-1);
}

.tracker-hint-close:hover {
  color: var(--text-primary);
}
```

Dismiss state persists to localStorage so users don't see the hint forever.

### 4. Kanban columns

The column color system. Each column has a hex color used for the pill background and a 1px top accent.

```tsx
const columns = [
  { id: 'interested',  label: 'Interested',   color: '#6366F1' }, // indigo
  { id: 'applied',     label: 'Applied',      color: '#3B82F6' }, // blue
  { id: 'screening',   label: 'Screening',    color: '#14B8A6' }, // teal
  { id: 'interviewing',label: 'Interviewing', color: '#A855F7' }, // purple
  { id: 'offer',       label: 'Offer',        color: '#10B981' }, // green
  { id: 'rejected',    label: 'Rejected',     color: '#EF4444' }, // red
  { id: 'on-hold',     label: 'On hold',      color: '#F59E0B' }, // amber
];
```

```tsx
<div className="kanban">
  {columns.map((col) => {
    const items = groupedApplications[col.id] || [];
    return (
      <div
        key={col.id}
        className="kanban-column"
        style={{ '--col-color': col.color } as React.CSSProperties}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, col.id)}
      >
        <div className="kanban-column-header">
          <span className="kanban-pill">{col.label}</span>
          <span className="kanban-count">{items.length}</span>
        </div>

        <div className="kanban-column-body">
          {items.length === 0 ? (
            <div className="kanban-empty">drop here</div>
          ) : (
            items.map((item) => (
              <ApplicationCard key={item.id} item={item} onDragStart={...} />
            ))
          )}
        </div>
      </div>
    );
  })}
</div>
```

```css
.kanban {
  display: grid;
  grid-template-columns: repeat(7, minmax(180px, 1fr));
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-4);   /* room for scrollbar */
}

.kanban-column {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* The accent line at the top */
.kanban-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--col-color);
  opacity: 0.6;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.kanban-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  background: color-mix(in srgb, var(--col-color) 18%, transparent);
  color: var(--col-color);
  border: 1px solid color-mix(in srgb, var(--col-color) 30%, transparent);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.kanban-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.kanban-column-body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.kanban-empty {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-style: italic;
  text-align: center;
  padding: var(--space-6) 0;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
}

/* Drag-over state */
.kanban-column.drag-over {
  background: var(--bg-elevated-2);
  border-color: var(--col-color);
}
```

### 5. Application card

```tsx
function ApplicationCard({ item, onDragStart }: { item: Application; onDragStart: any }) {
  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
    >
      <div className="kanban-card-company">{item.company}</div>
      <div className="kanban-card-role">{item.role}</div>
      {item.dateApplied && (
        <div className="kanban-card-meta">{formatDate(item.dateApplied)}</div>
      )}
    </div>
  );
}
```

```css
.kanban-card {
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: grab;
  transition: border-color 150ms ease, transform 100ms ease;
}

.kanban-card:hover {
  border-color: var(--border-default);
}

.kanban-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.kanban-card-company {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.kanban-card-role {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.kanban-card-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
```

### 6. Drag-and-drop polish

Add the `.drag-over` class when an item is being dragged over a column:

```tsx
const handleDragEnter = (colId: string) => setDragOverCol(colId);
const handleDragLeave = () => setDragOverCol(null);

<div className={`kanban-column ${dragOverCol === col.id ? 'drag-over' : ''}`}>
```

### 7. Other tabs (Contacts, Appointments, Activity)

These are not kanbans — likely tables or list views. Apply the same styling principles:

- Wrap in a `.card`
- Use the spacing scale
- For tables: subtle row hover (`background: var(--bg-elevated-2)`), `border-bottom: 1px solid var(--border-subtle)` between rows, no vertical borders
- Empty states use the same `.kanban-empty` pattern: dashed border, italic tertiary text

Detailed implementation of these tabs is out of scope for this doc — they're table/list views and don't have the same visual complexity as the kanban.

## Acceptance criteria

- [ ] Page uses `PageShell` with Import/Export in `headerAction`
- [ ] Tabs use the sliding-indicator Tabs component from doc 04
- [ ] Kanban columns have a colored top accent matching their status pill
- [ ] Column count is right-aligned and uses mono numerals
- [ ] Empty columns show a dashed-border "drop here" zone
- [ ] Dragging an item over a column highlights that column's border in its color
- [ ] Application cards have hover state and grab/grabbing cursors
- [ ] Drag hint can be dismissed and stays dismissed (localStorage)
- [ ] Horizontal scroll works correctly when viewport is narrow
- [ ] Each tab transition uses the smooth Tabs animation

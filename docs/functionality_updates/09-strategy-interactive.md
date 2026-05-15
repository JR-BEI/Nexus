# 09 — Interactive Strategy Page

Make the Job Search Strategy doc a working CRM for the recruiter relationship layer. Right now it's a beautifully curated reference doc — readable but inert. Add status tracking, user notes, and custom entries to turn it into a daily-use tool.

**Depends on:** `01-data-model.md`

## The current gap

The Strategy page lists ~30 recruiters, boards, conferences, and associations as bullet points. The user reads it once, mentally bookmarks "I should contact the Jacobson Group," and then... forgets. There's no way to track contact attempts, log responses, or add custom firms not in the curated list.

## Goals

1. Each strategy entry has status: not contacted / reached out / in conversation / passed / no response.
2. User can add notes per entry ("Reached out 11/4, no response").
3. User can add custom entries (firms not in the curated list).
4. Filter the page by status to focus on what's actionable.
5. Curated content remains pristine — user customizations are stored separately.

## Implementation

### 1. Data layering

The curated content (the static list of recruiters) stays in a static data file. User state lives in `strategyRepo` keyed by entry ID.

```ts
// src/data/strategy.ts
export const STRATEGY_ENTRIES: StrategyEntry[] = [
  {
    id: 'rec_jacobson_group',
    name: 'The Jacobson Group',
    category: 'Insurance-focused firms',
    type: 'recruiter',
    description: 'Boutique focused exclusively on insurance executive search for 50+ years. Top name in insurance executive recruiting.',
    priority: 'highest',
  },
  // ...
];
```

User customizations are saved as `StrategyContact` records (from doc 01). Merge at render time:

```ts
// src/lib/strategy.ts
import { STRATEGY_ENTRIES } from '../data/strategy';
import { StrategyContact } from '../types/nexus';
import { strategyRepo } from './repos/strategyRepo';

export interface MergedEntry {
  id: string;
  name: string;
  category: string;
  type: string;
  description?: string;
  priority?: string;

  // User state
  status: StrategyContact['status'];
  userNotes?: string;
  lastContactedAt?: number;
  customAdded: boolean;
}

export async function loadStrategyEntries(): Promise<MergedEntry[]> {
  const userContacts = await strategyRepo.list();
  const userById = new Map(userContacts.map((c) => [c.id, c]));

  // Curated entries merged with user state
  const curated: MergedEntry[] = STRATEGY_ENTRIES.map((e) => {
    const user = userById.get(e.id);
    return {
      ...e,
      status: user?.status || 'not_contacted',
      userNotes: user?.userNotes,
      lastContactedAt: user?.lastContactedAt,
      customAdded: false,
    };
  });

  // Custom entries the user added (not in curated list)
  const customIds = new Set(curated.map((c) => c.id));
  const custom: MergedEntry[] = userContacts
    .filter((c) => !customIds.has(c.id) && c.customAdded)
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      type: c.type,
      description: c.description,
      status: c.status,
      userNotes: c.userNotes,
      lastContactedAt: c.lastContactedAt,
      customAdded: true,
    }));

  return [...curated, ...custom];
}
```

### 2. Entry component with interactive controls

Replace the static bulleted list with this:

```tsx
function StrategyEntry({ entry, onUpdate }: Props) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(entry.userNotes || '');

  return (
    <article className={`strategy-entry strategy-entry-${entry.status}`}>
      <div className="strategy-entry-main">
        <div className="strategy-entry-header">
          <h4 className="strategy-entry-name">
            {entry.name}
            {entry.customAdded && <span className="custom-badge">Custom</span>}
          </h4>
          <StatusPicker
            status={entry.status}
            onChange={(status) => onUpdate({ ...entry, status, lastContactedAt: status !== 'not_contacted' ? Date.now() : entry.lastContactedAt })}
          />
        </div>

        {entry.description && (
          <p className="strategy-entry-description">{entry.description}</p>
        )}

        {entry.priority === 'highest' && (
          <div className="strategy-entry-highlight">
            Highest priority contact for this domain
          </div>
        )}

        {entry.lastContactedAt && (
          <div className="strategy-entry-meta">
            Last touched: {formatRelativeDate(entry.lastContactedAt)}
          </div>
        )}

        {!editingNotes && entry.userNotes && (
          <div className="strategy-entry-notes" onClick={() => setEditingNotes(true)}>
            {entry.userNotes}
            <span className="edit-hint">Click to edit</span>
          </div>
        )}

        {editingNotes && (
          <div className="strategy-entry-notes-edit">
            <textarea
              className="textarea"
              rows={2}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Your notes (e.g. 'Reached out 11/4 to Susan, no response yet')"
            />
            <div className="notes-edit-actions">
              <button className="btn-ghost btn-sm" onClick={() => {
                setNotesDraft(entry.userNotes || '');
                setEditingNotes(false);
              }}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={() => {
                onUpdate({ ...entry, userNotes: notesDraft });
                setEditingNotes(false);
              }}>Save</button>
            </div>
          </div>
        )}

        {!editingNotes && !entry.userNotes && (
          <button className="strategy-add-note" onClick={() => setEditingNotes(true)}>
            + Add note
          </button>
        )}
      </div>
    </article>
  );
}
```

```css
.strategy-entry {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--border-subtle);
  transition: border-color 150ms ease;
}

/* Status accent — color the left border */
.strategy-entry-not_contacted { border-left-color: var(--border-subtle); }
.strategy-entry-reached_out { border-left-color: var(--accent-blue); }
.strategy-entry-in_conversation { border-left-color: var(--accent-amber); }
.strategy-entry-passed { border-left-color: var(--text-tertiary); opacity: 0.5; }
.strategy-entry-no_response { border-left-color: var(--accent-red); }

.strategy-entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.strategy-entry-name {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.custom-badge {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  padding: 1px var(--space-2);
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border-radius: var(--radius-sm);
}

.strategy-entry-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
  line-height: 1.5;
}

.strategy-entry-highlight {
  font-size: var(--text-xs);
  color: var(--accent-amber);
  margin-top: var(--space-2);
  font-weight: var(--weight-medium);
}

.strategy-entry-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-2);
}

.strategy-entry-notes {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated-2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-style: italic;
  position: relative;
  cursor: pointer;
}

.strategy-entry-notes:hover .edit-hint {
  opacity: 1;
}

.edit-hint {
  position: absolute;
  top: var(--space-1);
  right: var(--space-2);
  font-size: 10px;
  color: var(--text-tertiary);
  font-style: normal;
  opacity: 0;
  transition: opacity 150ms ease;
}

.strategy-add-note {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: var(--space-1) 0;
  margin-top: var(--space-2);
}

.strategy-add-note:hover {
  color: var(--accent-blue);
}
```

### 3. Status picker

A small dropdown for changing status:

```tsx
function StatusPicker({ status, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const options: { id: StrategyContact['status']; label: string; color: string }[] = [
    { id: 'not_contacted', label: 'Not contacted', color: 'var(--text-tertiary)' },
    { id: 'reached_out', label: 'Reached out', color: 'var(--accent-blue)' },
    { id: 'in_conversation', label: 'In conversation', color: 'var(--accent-amber)' },
    { id: 'no_response', label: 'No response', color: 'var(--accent-red)' },
    { id: 'passed', label: 'Passed', color: 'var(--text-tertiary)' },
  ];

  const current = options.find((o) => o.id === status)!;

  return (
    <div className="status-picker">
      <button
        className="status-picker-trigger"
        onClick={() => setOpen(!open)}
        style={{ color: current.color, borderColor: current.color }}
      >
        <span className="status-picker-dot" style={{ background: current.color }} />
        {current.label}
        <span className="status-picker-chevron">▾</span>
      </button>

      {open && (
        <div className="status-picker-menu">
          {options.map((o) => (
            <button
              key={o.id}
              className="status-picker-option"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              <span className="status-picker-dot" style={{ background: o.color }} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

```css
.status-picker {
  position: relative;
  flex-shrink: 0;
}

.status-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: transparent;
  border: 1px solid;
  border-radius: var(--radius-full);
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  cursor: pointer;
  font-family: inherit;
}

.status-picker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-picker-chevron {
  font-size: 8px;
  opacity: 0.7;
}

.status-picker-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-1);
  min-width: 180px;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.status-picker-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
}

.status-picker-option:hover {
  background: var(--bg-elevated);
}
```

### 4. Status filter at top

Above the entries, a filter bar to focus on what's actionable:

```tsx
const [filter, setFilter] = useState<'all' | 'actionable' | StrategyContact['status']>('all');

const filtered = useMemo(() => {
  if (filter === 'all') return entries;
  if (filter === 'actionable') {
    return entries.filter((e) => e.status === 'not_contacted' || e.status === 'in_conversation');
  }
  return entries.filter((e) => e.status === filter);
}, [entries, filter]);

<div className="strategy-filters">
  <button className={`filter-chip ${filter === 'all' ? 'filter-chip-active' : ''}`} onClick={() => setFilter('all')}>
    All ({entries.length})
  </button>
  <button className={`filter-chip ${filter === 'actionable' ? 'filter-chip-active' : ''}`} onClick={() => setFilter('actionable')}>
    Actionable ({actionableCount})
  </button>
  <button className={`filter-chip ${filter === 'reached_out' ? 'filter-chip-active' : ''}`} onClick={() => setFilter('reached_out')}>
    Reached out
  </button>
  <button className={`filter-chip ${filter === 'in_conversation' ? 'filter-chip-active' : ''}`} onClick={() => setFilter('in_conversation')}>
    In conversation
  </button>
  <button className={`filter-chip ${filter === 'passed' ? 'filter-chip-active' : ''}`} onClick={() => setFilter('passed')}>
    Passed
  </button>
</div>
```

### 5. Add custom entry

A button at the top of each category section to add a custom entry:

```tsx
<button className="btn-ghost btn-sm" onClick={() => setAddingCustom({ category })}>
  + Add to this category
</button>

{addingCustom && (
  <AddCustomEntryModal
    initialCategory={addingCustom.category}
    onSave={async (entry) => {
      await strategyRepo.save({ ...entry, customAdded: true });
      setAddingCustom(null);
      refresh();
    }}
    onCancel={() => setAddingCustom(null)}
  />
)}
```

The modal is a small form: name (required), category (pre-filled), type, description.

### 6. TOC active counts

Update the TOC to show per-category counts of actionable items:

```tsx
function StrategyTOC({ sections, activeId, entries }: Props) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) {
      if (e.status === 'not_contacted' || e.status === 'in_conversation') {
        c[e.category] = (c[e.category] || 0) + 1;
      }
    }
    return c;
  }, [entries]);

  return (
    <nav className="toc">
      {/* ... existing structure ... */}
      {sections.map((s) => (
        <li key={s.id} className="toc-item">
          <a href={`#${s.id}`} className="toc-link">
            {s.label}
            {counts[s.label] > 0 && (
              <span className="toc-count">{counts[s.label]}</span>
            )}
          </a>
        </li>
      ))}
    </nav>
  );
}
```

```css
.toc-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--space-2);
  min-width: 16px;
  height: 16px;
  padding: 0 var(--space-1);
  background: var(--accent-amber);
  color: #0a0a0f;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums;
}
```

## Acceptance criteria

- [ ] Each strategy entry shows its current status as a pill (not contacted / reached out / in conversation / passed / no response)
- [ ] Clicking the status pill opens a small picker to change it
- [ ] Changing status to anything non-default sets `lastContactedAt` to now
- [ ] Each entry has an "Add note" affordance that expands inline
- [ ] Notes can be edited by clicking on existing note text
- [ ] Custom entries (user-added) show a purple "Custom" badge
- [ ] Filter bar at top: All / Actionable / Reached out / In conversation / Passed
- [ ] TOC shows actionable count per category as an amber badge
- [ ] User can add custom entries to any category
- [ ] User customizations persist via `strategyRepo`
- [ ] Curated data remains untouched (no mutation of `STRATEGY_ENTRIES`)
- [ ] Left-border accent on entries reflects status color

## What this unlocks

The Strategy doc transforms from "read once, forget" to "open Monday morning to see who needs follow-up." It becomes a CRM with the curated playbook baked in.

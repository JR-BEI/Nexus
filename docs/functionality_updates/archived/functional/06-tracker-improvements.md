# 06 — Tracker Improvements

Three improvements to make the Tracker more usable as it grows: collapsed Closed lane, full-text search across all data, and proper contact linkage.

**Depends on:** `01-data-model.md`, `06-tracker.md` (design)

## The current gaps

1. **Seven columns is too many.** Rejected + On Hold dominate visual space once you have any history. Active opportunities (Applied, Screening, Interviewing) should be the focus.
2. **Filter only searches company/role/source.** It doesn't search notes or activity history — which is where the real value lives ("what did I say to the EvolutionIQ recruiter in October?").
3. **Contacts and Appointments are separate tabs with no relationship to applications.** A phone screen *is* an appointment *is* an interaction with a contact about an application. They should be one connected thing.

## Goals

1. Collapse Rejected + On Hold into a single "Closed" lane that expands on click.
2. Search across all fields including notes, events, and content.
3. Link contacts and appointments to applications so the Tracker shows the full picture per role.

## Implementation

### 1. Collapsed Closed lane

The kanban becomes 5 active columns + 1 collapsed "Closed" column.

```tsx
const ACTIVE_COLUMNS = [
  { id: 'interested',   label: 'Interested',   color: '#6366F1' },
  { id: 'applied',      label: 'Applied',      color: '#3B82F6' },
  { id: 'screening',    label: 'Screening',    color: '#14B8A6' },
  { id: 'interviewing', label: 'Interviewing', color: '#A855F7' },
  { id: 'offer',        label: 'Offer',        color: '#10B981' },
];

const CLOSED_STATUSES: ApplicationStatus[] = ['rejected', 'on-hold'];

function Kanban({ applications }: { applications: TrackerApplication[] }) {
  const [closedExpanded, setClosedExpanded] = useState(false);

  const grouped = useMemo(() => groupByStatus(applications), [applications]);
  const closedApps = useMemo(
    () => applications.filter((a) => CLOSED_STATUSES.includes(a.status)),
    [applications]
  );

  return (
    <>
      <div className="kanban">
        {ACTIVE_COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col} items={grouped[col.id] || []} />
        ))}
        <ClosedColumn
          items={closedApps}
          expanded={closedExpanded}
          onToggle={() => setClosedExpanded(!closedExpanded)}
        />
      </div>

      {closedExpanded && (
        <ClosedExpanded items={closedApps} onCollapse={() => setClosedExpanded(false)} />
      )}
    </>
  );
}
```

### 2. Closed column (collapsed)

The closed column shows as a thin column with just a count when collapsed:

```tsx
function ClosedColumn({ items, expanded, onToggle }: Props) {
  const rejected = items.filter((a) => a.status === 'rejected').length;
  const onHold = items.filter((a) => a.status === 'on-hold').length;

  return (
    <button
      className="kanban-column kanban-column-closed"
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <div className="kanban-column-closed-header">
        <span className="kanban-column-closed-icon">📦</span>
        <span className="kanban-column-closed-label">Closed</span>
      </div>
      <div className="kanban-column-closed-counts">
        <div className="closed-count">
          <span className="closed-count-dot closed-count-rejected" />
          <span>{rejected} rejected</span>
        </div>
        <div className="closed-count">
          <span className="closed-count-dot closed-count-on-hold" />
          <span>{onHold} on hold</span>
        </div>
      </div>
      <div className="kanban-column-closed-expand">
        {expanded ? 'Click to collapse' : 'Click to expand'}
      </div>
    </button>
  );
}
```

```css
.kanban-column-closed {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-3);
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;
  min-height: 160px;
  transition: border-color 150ms ease, background 150ms ease;
}

.kanban-column-closed::before {
  /* Override the colored accent line */
  background: var(--border-default);
}

.kanban-column-closed:hover {
  border-color: var(--border-default);
  background: var(--bg-elevated-2);
}

.kanban-column-closed-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-secondary);
}

.kanban-column-closed-counts {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.closed-count {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.closed-count-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.closed-count-rejected { background: var(--accent-red); }
.closed-count-on-hold { background: var(--accent-amber); }

.kanban-column-closed-expand {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  opacity: 0.6;
}
```

### 3. Closed expanded view

When clicked, the Closed lane expands into a horizontal list below the kanban (not as a full column — that's what was wrong in the first place):

```tsx
function ClosedExpanded({ items, onCollapse }: Props) {
  const [filter, setFilter] = useState<'all' | 'rejected' | 'on-hold'>('all');

  const filtered = filter === 'all' ? items : items.filter((a) => a.status === filter);

  return (
    <section className="closed-expanded">
      <div className="closed-expanded-header">
        <h2 className="section-title">Closed</h2>
        <div className="closed-expanded-filters">
          <button
            className={`filter-chip ${filter === 'all' ? 'filter-chip-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({items.length})
          </button>
          <button
            className={`filter-chip ${filter === 'rejected' ? 'filter-chip-active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({items.filter((a) => a.status === 'rejected').length})
          </button>
          <button
            className={`filter-chip ${filter === 'on-hold' ? 'filter-chip-active' : ''}`}
            onClick={() => setFilter('on-hold')}
          >
            On hold ({items.filter((a) => a.status === 'on-hold').length})
          </button>
          <button className="btn-ghost btn-sm" onClick={onCollapse}>Collapse</button>
        </div>
      </div>
      <div className="closed-list">
        {filtered.map((app) => (
          <div key={app.id} className="closed-row">
            <span className={`status-dot-${app.status}`} />
            <strong>{app.company}</strong>
            <span className="closed-role">{app.role}</span>
            <span className="closed-date">{formatRelativeDate(app.updatedAt)}</span>
            <button
              className="btn-ghost btn-sm"
              onClick={() => moveApplication(app.id, 'interested')}
            >
              Reopen
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
```

```css
.closed-expanded {
  margin-top: var(--space-6);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.closed-expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.closed-expanded-filters {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.closed-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.closed-row {
  display: grid;
  grid-template-columns: 8px 1fr 2fr auto auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.closed-row:hover {
  background: var(--bg-elevated-2);
}

.closed-row strong {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.closed-role {
  color: var(--text-secondary);
}

.closed-date {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.status-dot-rejected,
.status-dot-on-hold {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot-rejected { background: var(--accent-red); }
.status-dot-on-hold { background: var(--accent-amber); }
```

### 4. Search across everything

Replace the simple "filter by company, role, source" input with a search that matches across:

- Application: company, role, source, notes
- Application events: content
- Linked contacts: name, role, notes
- Linked analyses: extracted role/company, JD text

```ts
// src/lib/search.ts
export interface SearchableApp {
  app: TrackerApplication;
  matchedFields: string[];
}

export async function searchApplications(
  query: string,
  apps: TrackerApplication[]
): Promise<SearchableApp[]> {
  if (!query.trim()) {
    return apps.map((app) => ({ app, matchedFields: [] }));
  }

  const q = query.toLowerCase();
  const results: SearchableApp[] = [];

  // Pre-load related data once
  const contactsMap = new Map((await contactRepo.list()).map((c) => [c.id, c]));
  const analysesMap = new Map((await analysisRepo.list()).map((a) => [a.id, a]));

  for (const app of apps) {
    const matched: string[] = [];

    if (app.company.toLowerCase().includes(q)) matched.push('company');
    if (app.role.toLowerCase().includes(q)) matched.push('role');
    if (app.source?.toLowerCase().includes(q)) matched.push('source');
    if (app.notes.toLowerCase().includes(q)) matched.push('notes');

    if (app.events.some((e) => e.content?.toLowerCase().includes(q))) {
      matched.push('activity');
    }

    for (const cid of app.linkedContactIds) {
      const c = contactsMap.get(cid);
      if (c && (
        c.name.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      )) {
        matched.push('contact');
        break;
      }
    }

    if (app.linkedAnalysisId) {
      const a = analysesMap.get(app.linkedAnalysisId);
      if (a && a.jdText.toLowerCase().includes(q)) {
        matched.push('JD');
      }
    }

    if (matched.length > 0) {
      results.push({ app, matchedFields: matched });
    }
  }

  return results;
}
```

Show matched fields as small chips next to matching cards:

```tsx
{result.matchedFields.length > 0 && (
  <div className="search-matched-fields">
    {result.matchedFields.map((f) => (
      <span key={f} className="match-chip">{f}</span>
    ))}
  </div>
)}
```

```css
.search-matched-fields {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.match-chip {
  font-size: 10px;
  padding: 1px var(--space-2);
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-radius: var(--radius-sm);
  text-transform: lowercase;
}
```

### 5. Contact linkage

When the user logs an activity that involves a person, let them attach a contact:

```tsx
function LogActivityModal({ app, onConfirm }: Props) {
  // ... type, content state ...
  const [contactId, setContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<TrackerContact[]>([]);

  useEffect(() => {
    contactRepo.list().then(setContacts);
  }, []);

  const isPersonInteraction = type === 'email' || type === 'call' || type === 'interview';

  return (
    <Modal title="Log activity" onClose={onCancel}>
      {/* ... type selector ... */}

      {isPersonInteraction && (
        <ContactPicker
          contacts={contacts}
          value={contactId}
          onChange={setContactId}
          linkedContactIds={app.linkedContactIds}
        />
      )}

      {/* ... content textarea ... */}
    </Modal>
  );
}
```

```tsx
function ContactPicker({ contacts, value, onChange, linkedContactIds }: Props) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  // Show already-linked contacts first, then search results
  const linked = contacts.filter((c) => linkedContactIds.includes(c.id));
  const others = contacts.filter((c) =>
    !linkedContactIds.includes(c.id) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="contact-picker">
      <label className="textarea-label">Who was this with?</label>

      {linked.length > 0 && (
        <div className="contact-picker-section">
          <div className="contact-picker-section-label">Already linked</div>
          <div className="contact-picker-options">
            {linked.map((c) => (
              <ContactOption
                key={c.id}
                contact={c}
                selected={value === c.id}
                onClick={() => onChange(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        className="input"
        placeholder="Search contacts or add new..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {others.slice(0, 5).map((c) => (
        <ContactOption
          key={c.id}
          contact={c}
          selected={value === c.id}
          onClick={() => onChange(c.id)}
        />
      ))}

      {search && !contacts.some((c) => c.name.toLowerCase() === search.toLowerCase()) && (
        <button className="contact-create-btn" onClick={() => setCreating(true)}>
          + Create "{search}"
        </button>
      )}
    </div>
  );
}
```

When activity is logged with a contact:

```ts
async function logActivity(appId: string, data: { type; content; contactId? }) {
  const app = await applicationRepo.get(appId);
  if (!app) return;

  // Add the event
  app.events.push({
    id: newEventId(),
    at: Date.now(),
    type: data.type,
    content: data.content || undefined,
  });

  // Link the contact if provided
  if (data.contactId && !app.linkedContactIds.includes(data.contactId)) {
    app.linkedContactIds.push(data.contactId);
  }

  await applicationRepo.save({ ...app, updatedAt: Date.now() });

  // Update the contact's reverse link
  if (data.contactId) {
    const c = await contactRepo.get(data.contactId);
    if (c && !c.linkedApplicationIds.includes(appId)) {
      await contactRepo.save({
        ...c,
        linkedApplicationIds: [...c.linkedApplicationIds, appId],
      });
    }
  }
}
```

### 6. Application detail view shows full picture

Out of scope for full detail page, but when the user clicks an application card, a side panel or modal could show:

- Linked analysis (with link to view it)
- Linked contacts (with quick-open links)
- Linked appointments (with dates)
- Full event timeline

This is where the connective tissue pays off — one application shows you everything you've done about that opportunity.

## Acceptance criteria

- [ ] Rejected and On Hold collapsed into one Closed column on the kanban
- [ ] Closed column shows count breakdown without taking horizontal space
- [ ] Clicking Closed expands a horizontal list below the kanban
- [ ] Closed expanded view has filter chips (All / Rejected / On Hold)
- [ ] Each closed row has a "Reopen" action that moves it back to Interested
- [ ] Search input matches across company, role, source, notes, event content, contact names, JD text
- [ ] Matching apps show small chips indicating which fields matched
- [ ] Log Activity modal includes a contact picker for email/call/interview types
- [ ] Contact picker shows already-linked contacts first, then search-filtered others
- [ ] User can create a new contact inline from the picker
- [ ] Logging an activity with a contact links them bidirectionally

## Out of scope

- Application detail page/modal (deferred — needs design work)
- Appointment scheduling integration (Google Cal, etc.)
- Bulk operations on closed apps

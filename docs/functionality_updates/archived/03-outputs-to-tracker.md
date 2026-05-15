# 03 — Outputs → Tracker Connection

Add a one-click "Track this application" action on the Outputs page that creates a Tracker entry pre-filled with the analysis context. Eliminates 100% of the duplicate data entry between generating a resume and tracking the application.

**Depends on:** `01-data-model.md`

## The current gap

The user generates a perfect tailored resume → downloads it → submits it to the company → opens the Tracker → manually types in the company, role, date, and pastes a link to... what? The analysis they just left? There's no link.

The result: most users don't bother tracking, or they track inconsistently, and the Tracker becomes incomplete.

## Goals

1. A "Track this application" button on the Outputs page that creates a pre-filled application.
2. If an analysis is already tracked, the button changes to "View in Tracker."
3. Tracker cards link back to their source analysis.
4. Status changes on the Tracker entry add events automatically.

## Implementation

### 1. Track button on Outputs

Add to the footer of the Outputs page (where Re-analyze / Start New Analysis live):

```tsx
{!linkedApplication ? (
  <button className="btn-primary" onClick={handleTrack}>
    📋 Track this application
  </button>
) : (
  <a
    href={`/tracker?app=${linkedApplication.id}`}
    className="btn-secondary tracked-pill"
  >
    ✓ Tracked as {trackerStatusLabel(linkedApplication.status)}
    {' '}<span className="tracked-arrow">→</span>
  </a>
)}
```

```css
.tracked-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--accent-green);
  text-decoration: none;
}

.tracked-pill:hover {
  background: rgba(16, 185, 129, 0.12);
}

.tracked-arrow {
  color: inherit;
  opacity: 0.6;
}
```

### 2. Track handler

```ts
async function handleTrack() {
  // Confirm action first — a small modal asking for the source
  const source = await promptForSource();    // see section 3
  if (source === null) return;               // user cancelled

  const app: TrackerApplication = {
    id: newApplicationId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    company: analysis.extracted.company,
    role: analysis.extracted.role,
    status: 'interested',                    // sensible default
    source: source || undefined,
    linkedAnalysisId: analysis.id,
    linkedCompanyId: analysis.linkedCompanyId,
    linkedContactIds: [],
    events: [
      {
        id: newEventId(),
        at: Date.now(),
        type: 'status_change',
        toStatus: 'interested',
        content: `Created from analysis "${analysis.extracted.role} at ${analysis.extracted.company}"`,
      },
    ],
    notes: '',
  };

  await applicationRepo.save(app);

  // Update the analysis with the link back
  await analysisRepo.save({
    ...analysis,
    linkedTrackerId: app.id,
  });

  // Optional: show a success toast with "Open in Tracker" action
  showToast({
    message: 'Added to Tracker',
    action: { label: 'Open', href: `/tracker?app=${app.id}` },
  });

  // Refresh state
  setLinkedApplication(app);
}
```

### 3. Source prompt (lightweight modal)

When the user clicks Track, ask one quick question: where did this come from? It's useful data for pattern analysis later (doc 12).

```tsx
function SourceModal({ onConfirm, onCancel }: Props) {
  const [source, setSource] = useState('');
  const presets = ['LinkedIn', 'Company website', 'Referral', 'Recruiter outreach', 'Job board', 'Other'];

  return (
    <Modal title="Where did you find this role?" onClose={onCancel}>
      <div className="source-presets">
        {presets.map((p) => (
          <button
            key={p}
            className={`source-preset ${source === p ? 'source-preset-active' : ''}`}
            onClick={() => setSource(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="input"
        placeholder="Optional: add a name (e.g., 'Referral - John Smith')"
        value={source === presets.includes(source) ? '' : source}
        onChange={(e) => setSource(e.target.value)}
      />
      <div className="modal-actions">
        <button className="btn-ghost" onClick={onCancel}>Skip</button>
        <button className="btn-primary" onClick={() => onConfirm(source)}>Track</button>
      </div>
    </Modal>
  );
}
```

```css
.source-presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.source-preset {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease;
}

.source-preset:hover {
  border-color: var(--border-default);
}

.source-preset-active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
```

Allow "Skip" — don't make source a required field. Some users won't remember and we shouldn't gate the action.

### 4. Toast component

A non-blocking success notification. If you don't have one, here's a minimal version:

```tsx
// components/Toast.tsx
import { useEffect, useState } from 'react';

interface ToastData {
  message: string;
  action?: { label: string; href: string };
}

let setToastFn: ((t: ToastData | null) => void) | null = null;

export function showToast(t: ToastData) {
  setToastFn?.(t);
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    setToastFn = setToast;
    return () => { setToastFn = null; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="toast">
      <span>{toast.message}</span>
      {toast.action && (
        <a href={toast.action.href} className="toast-action">{toast.action.label}</a>
      )}
    </div>
  );
}
```

```css
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-primary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  animation: toast-in 250ms var(--ease-out);
}

.toast-action {
  color: var(--accent-blue);
  text-decoration: none;
  font-weight: var(--weight-medium);
}

@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
```

Mount `<ToastContainer />` once at the app root.

### 5. Tracker → Analysis link (reverse direction)

On each Tracker application card, show a link back to the analysis if it exists:

```tsx
{app.linkedAnalysisId && (
  <a
    href={`/analysis/${app.linkedAnalysisId}`}
    className="kanban-card-analysis"
    onClick={(e) => e.stopPropagation()}  // don't trigger card drag
  >
    📄 View tailored resume
  </a>
)}
```

```css
.kanban-card-analysis {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--accent-blue);
  text-decoration: none;
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

.kanban-card-analysis:hover {
  text-decoration: underline;
}
```

### 6. Auto-add events on status changes

Whenever a Tracker application's status changes (via drag-and-drop in the kanban), record an event automatically:

```ts
async function moveApplication(appId: string, toStatus: ApplicationStatus) {
  const app = await applicationRepo.get(appId);
  if (!app || app.status === toStatus) return;

  const event: TrackerEvent = {
    id: newEventId(),
    at: Date.now(),
    type: 'status_change',
    fromStatus: app.status,
    toStatus,
  };

  await applicationRepo.save({
    ...app,
    status: toStatus,
    events: [...app.events, event],
    updatedAt: Date.now(),
  });
}
```

This is the foundation for "stale detection" in doc 05 and "coach view" in doc 12.

### 7. Past Analyses card — show tracked status

On the homepage Past Analyses cards, if the analysis is linked to a Tracker application, show the status badge (you already have this styled from design doc 09):

```tsx
const linkedApp = applicationsMap.get(analysis.linkedTrackerId || '');
// ...
{linkedApp && (
  <span className={`past-card-status past-card-status-${linkedApp.status}`}>
    {trackerStatusLabel(linkedApp.status)}
  </span>
)}
```

The visual treatment is already in `09-homepage-polish.md`. This doc adds the data flow.

## Acceptance criteria

- [ ] "Track this application" button appears on Outputs page when analysis is not yet tracked
- [ ] Clicking it opens a source-selection modal with preset options + free text
- [ ] User can skip the source prompt and still track
- [ ] Tracking creates an application with status "interested" and an initial status_change event
- [ ] Analysis is updated with `linkedTrackerId` so the relationship is bidirectional
- [ ] Button changes to "✓ Tracked as [status]" with link to Tracker when already tracked
- [ ] Tracker cards show "📄 View tailored resume" link when linked to an analysis
- [ ] Status changes on the Tracker automatically append events to the application's history
- [ ] Past Analyses cards on homepage show the tracker status badge when linked
- [ ] Toast notification confirms the action with "Open" action button

## What this unlocks

This single feature is the difference between Nexus being "a tool I use sometimes" and "where my job search lives." Once tracking is one click away, every analysis becomes data. Once every analysis is data, the Tracker becomes useful. Once the Tracker is useful, the coach view (doc 12) becomes possible.

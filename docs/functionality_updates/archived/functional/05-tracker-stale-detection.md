# 05 — Tracker Stale Detection

Surface applications that have gone quiet so the user can follow up. Without this, the Tracker becomes a graveyard — applications sit in "Applied" forever and the user loses track of who needs nudging.

**Depends on:** `01-data-model.md`, `03-outputs-to-tracker.md`

## The current gap

Every application sits in its column with no signal about freshness. An app submitted yesterday looks identical to one submitted three months ago. The user has to manually remember which ones need follow-ups, which is exactly the cognitive load Nexus should be removing.

## Goals

1. Detect stale applications based on status-specific thresholds.
2. Surface staleness visually on each card (subtle, not alarming).
3. Surface stale apps prominently at the top of the Tracker.
4. Suggest the next action ("Consider follow-up", "Check status", "Move to Closed").

## Implementation

### 1. Stale thresholds

Different statuses have different reasonable wait times. Define them centrally:

```ts
// src/lib/staleness.ts
import { ApplicationStatus, TrackerApplication, TrackerEvent } from '../types/nexus';

const DAY_MS = 24 * 60 * 60 * 1000;

interface StalenessConfig {
  warningDays: number;     // show as "getting stale"
  staleDays: number;       // show as "stale"
  suggestedAction: string; // what to do about it
}

const STALENESS_BY_STATUS: Record<ApplicationStatus, StalenessConfig> = {
  interested: {
    warningDays: 7,
    staleDays: 14,
    suggestedAction: 'Apply or pass — it has been sitting in your interest list',
  },
  applied: {
    warningDays: 10,
    staleDays: 21,
    suggestedAction: 'Send a polite follow-up to the recruiter or hiring manager',
  },
  screening: {
    warningDays: 7,
    staleDays: 14,
    suggestedAction: 'Reach out to confirm next steps',
  },
  interviewing: {
    warningDays: 5,
    staleDays: 10,
    suggestedAction: 'Check in on timeline — interview cadence often signals interest level',
  },
  offer: {
    warningDays: 3,
    staleDays: 7,
    suggestedAction: 'Respond to the offer',
  },
  rejected: {
    warningDays: Infinity,
    staleDays: Infinity,
    suggestedAction: '',
  },
  'on-hold': {
    warningDays: 30,
    staleDays: 60,
    suggestedAction: 'Check if the role is still on hold',
  },
};
```

### 2. Compute staleness

```ts
export interface Staleness {
  level: 'fresh' | 'warning' | 'stale';
  daysSinceActivity: number;
  suggestedAction: string;
}

export function getStaleness(app: TrackerApplication): Staleness {
  const config = STALENESS_BY_STATUS[app.status];
  const lastActivity = getLastActivityAt(app);
  const daysSince = Math.floor((Date.now() - lastActivity) / DAY_MS);

  let level: Staleness['level'] = 'fresh';
  if (daysSince >= config.staleDays) level = 'stale';
  else if (daysSince >= config.warningDays) level = 'warning';

  return {
    level,
    daysSinceActivity: daysSince,
    suggestedAction: level === 'fresh' ? '' : config.suggestedAction,
  };
}

function getLastActivityAt(app: TrackerApplication): number {
  // Most recent event timestamp, or createdAt if no events
  if (app.events.length === 0) return app.createdAt;
  return Math.max(...app.events.map((e) => e.at));
}
```

### 3. Staleness badge on cards

Add a small indicator on each kanban card:

```tsx
function ApplicationCard({ item }: { item: TrackerApplication }) {
  const staleness = getStaleness(item);

  return (
    <div className="kanban-card">
      <div className="kanban-card-company">{item.company}</div>
      <div className="kanban-card-role">{item.role}</div>

      <div className="kanban-card-footer">
        <span className="kanban-card-date">
          {formatRelativeDate(getLastActivityAt(item))}
        </span>
        {staleness.level !== 'fresh' && (
          <span className={`stale-badge stale-${staleness.level}`}>
            {staleness.level === 'warning' ? '⚠' : '🔔'}
            {' '}{staleness.daysSinceActivity}d
          </span>
        )}
      </div>
    </div>
  );
}
```

```css
.kanban-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-2);
}

.kanban-card-date {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.stale-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
  font-weight: var(--weight-medium);
}

.stale-warning {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.stale-stale {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

### 4. "Needs attention" callout at top of Tracker

Show stale apps prominently above the kanban:

```tsx
const staleApps = useMemo(
  () => applications
    .map((app) => ({ app, staleness: getStaleness(app) }))
    .filter(({ staleness }) => staleness.level !== 'fresh')
    .sort((a, b) => b.staleness.daysSinceActivity - a.staleness.daysSinceActivity),
  [applications]
);

{staleApps.length > 0 && (
  <section className="needs-attention">
    <div className="needs-attention-header">
      <h2 className="needs-attention-title">
        Needs attention
        <span className="needs-attention-count">{staleApps.length}</span>
      </h2>
      <button className="btn-ghost btn-sm" onClick={() => setDismissedNeedsAttention(true)}>
        Hide
      </button>
    </div>
    <div className="needs-attention-list">
      {staleApps.slice(0, 5).map(({ app, staleness }) => (
        <article key={app.id} className={`attention-row attention-${staleness.level}`}>
          <div className="attention-row-main">
            <div className="attention-row-title">
              <strong>{app.company}</strong> · {app.role}
            </div>
            <div className="attention-row-suggestion">
              {staleness.daysSinceActivity} days in <em>{trackerStatusLabel(app.status)}</em>
              {' '}— {staleness.suggestedAction}
            </div>
          </div>
          <div className="attention-row-actions">
            <button className="btn-secondary btn-sm" onClick={() => addEvent(app.id)}>
              + Log activity
            </button>
            <button className="btn-ghost btn-sm" onClick={() => openApp(app.id)}>
              Open
            </button>
          </div>
        </article>
      ))}
      {staleApps.length > 5 && (
        <button className="show-more" onClick={() => setShowAllStale(true)}>
          Show {staleApps.length - 5} more
        </button>
      )}
    </div>
  </section>
)}
```

```css
.needs-attention {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.needs-attention-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.needs-attention-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.needs-attention-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--space-2);
  background: var(--accent-amber);
  color: #0a0a0f;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums;
}

.needs-attention-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.attention-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3);
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-amber);
}

.attention-stale {
  border-left-color: var(--accent-red);
}

.attention-row-main {
  flex: 1;
  min-width: 0;
}

.attention-row-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.attention-row-suggestion {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.attention-row-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.show-more {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  cursor: pointer;
  text-align: center;
  padding: var(--space-2);
}

.show-more:hover {
  color: var(--text-secondary);
}
```

### 5. Quick "log activity" action

When the user clicks "+ Log activity" on an attention row, open a lightweight modal:

```tsx
function LogActivityModal({ app, onConfirm, onCancel }: Props) {
  const [type, setType] = useState<TrackerEvent['type']>('note');
  const [content, setContent] = useState('');

  const types: { id: TrackerEvent['type']; label: string }[] = [
    { id: 'email', label: '✉ Email' },
    { id: 'call', label: '📞 Call' },
    { id: 'interview', label: '🎤 Interview' },
    { id: 'note', label: '📝 Note' },
  ];

  return (
    <Modal title="Log activity" subtitle={`${app.company} · ${app.role}`} onClose={onCancel}>
      <div className="activity-type-row">
        {types.map((t) => (
          <button
            key={t.id}
            className={`activity-type ${type === t.id ? 'activity-type-active' : ''}`}
            onClick={() => setType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        className="textarea"
        rows={3}
        placeholder="What happened? (optional)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="modal-actions">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => onConfirm({ type, content })}>
          Log
        </button>
      </div>
    </Modal>
  );
}
```

```ts
async function logActivity(appId: string, type: TrackerEvent['type'], content: string) {
  const app = await applicationRepo.get(appId);
  if (!app) return;

  const event: TrackerEvent = {
    id: newEventId(),
    at: Date.now(),
    type,
    content: content || undefined,
  };

  await applicationRepo.save({
    ...app,
    events: [...app.events, event],
    updatedAt: Date.now(),
  });

  // Logging an activity resets the staleness clock automatically.
}
```

### 6. (Optional) Browser notifications

For users who opt in, fire a browser notification once per day for any stale items:

```ts
async function notifyStaleDaily() {
  if (Notification.permission !== 'granted') return;

  const lastCheck = localStorage.getItem('nexus.lastStaleNotification');
  const today = new Date().toDateString();
  if (lastCheck === today) return;

  const apps = await applicationRepo.list();
  const stale = apps.filter((a) => getStaleness(a).level === 'stale');

  if (stale.length > 0) {
    new Notification('Nexus: applications need attention', {
      body: `${stale.length} application${stale.length !== 1 ? 's are' : ' is'} stale. Open Tracker to review.`,
      icon: '/icon-192.png',
    });
  }

  localStorage.setItem('nexus.lastStaleNotification', today);
}
```

Hide behind a setting. Default off — surprise notifications are bad UX.

## Acceptance criteria

- [ ] Each Tracker card shows last-activity date in tertiary color
- [ ] Warning-level stale apps show an amber ⚠ badge with day count
- [ ] Stale apps show a red 🔔 badge with day count
- [ ] "Needs attention" section appears above kanban when stale items exist
- [ ] Section lists up to 5 stale apps with status-specific suggested actions
- [ ] "Show N more" expands the list
- [ ] "+ Log activity" opens a modal to record an event
- [ ] Logging an activity resets the staleness clock (last activity = now)
- [ ] User can hide the "Needs attention" section (preference persists for the day)
- [ ] Rejected apps never appear as stale (Infinity threshold)
- [ ] Optional: browser notification once per day if permission granted

## What this prevents

Without this, the Tracker becomes a write-only graveyard within a few weeks. With it, the Tracker becomes a daily action queue. The difference is between "thing I update sometimes" and "thing that tells me what to do today."

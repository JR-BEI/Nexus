# 10 — Dynamic Homepage

Turn the homepage from a static launcher into a forward-looking dashboard. Show what needs attention today, what's coming up, and where the user left off.

**Depends on:** `01-data-model.md`, `03-outputs-to-tracker.md`, `05-tracker-stale-detection.md`

## The current gap

The current homepage shows:
- Hero
- Bento grid of features
- Past Analyses (backward-looking)

It does NOT show:
- "You have an interview tomorrow with Bestow"
- "5 applications are getting stale"
- "Continue your draft analysis for VP Product at Huge"
- "Sarah from Ladder hasn't replied in 12 days — follow up?"

The homepage should make Monday morning obvious. Right now it doesn't.

## Goals

1. "Today" section at the top with the 1–3 most important actions.
2. "Continue where you left off" for incomplete analyses.
3. Upcoming events (interviews, appointments) in the next 14 days.
4. Quick-stat summary (active applications, stale items, etc.).
5. Past Analyses moves down — it's still there but not the headline.

## Implementation

### 1. Page structure (revised)

```tsx
<main className="container">
  <Hero />

  <TodaySection />

  <BentoGrid />

  <UpcomingSection />

  <PastAnalysesSection />
</main>
```

### 2. Today section

The most important addition. Shows the 1–5 most actionable items.

```tsx
function TodaySection() {
  const [items, setItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildTodayItems().then((items) => {
      setItems(items);
      setLoading(false);
    });
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="page-content-section today-section">
      <div className="today-header">
        <h2 className="today-title">Today</h2>
        <span className="today-date">{formatDate(new Date(), 'long')}</span>
      </div>
      <div className="today-list">
        {items.map((item) => (
          <TodayItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
```

### 3. The today-builder

This is the brain. It pulls from across the app and ranks the most actionable items.

```ts
// src/lib/today.ts
export interface TodayItem {
  id: string;
  priority: number;       // higher = more urgent
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  type: 'event' | 'stale' | 'draft' | 'reminder' | 'streak';
}

export async function buildTodayItems(): Promise<TodayItem[]> {
  const items: TodayItem[] = [];

  // 1. Upcoming events in next 48h
  const appointments = await appointmentRepo.list();
  const soon = appointments.filter((a) => {
    const diff = a.at - Date.now();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  });
  for (const apt of soon) {
    items.push({
      id: `apt-${apt.id}`,
      priority: 100,
      icon: '🎤',
      title: apt.title,
      description: `${formatTime(apt.at)} · ${apt.type.replace('_', ' ')}`,
      actionLabel: 'View',
      actionHref: `/tracker?appointment=${apt.id}`,
      type: 'event',
    });
  }

  // 2. Stale applications needing follow-up
  const apps = await applicationRepo.list();
  const stale = apps
    .map((app) => ({ app, staleness: getStaleness(app) }))
    .filter(({ staleness }) => staleness.level === 'stale')
    .slice(0, 2);
  for (const { app, staleness } of stale) {
    items.push({
      id: `stale-${app.id}`,
      priority: 80,
      icon: '🔔',
      title: `${app.company} — ${app.role}`,
      description: `${staleness.daysSinceActivity} days in ${trackerStatusLabel(app.status)}. ${staleness.suggestedAction}`,
      actionLabel: 'Log activity',
      actionHref: `/tracker?app=${app.id}&action=log`,
      type: 'stale',
    });
  }

  // 3. Draft analyses (started but not completed)
  const drafts = await loadDrafts();    // see section 4
  for (const draft of drafts) {
    items.push({
      id: `draft-${draft.id}`,
      priority: 60,
      icon: '✎',
      title: 'Continue draft analysis',
      description: draft.preview || `Started ${formatRelativeDate(draft.createdAt)}`,
      actionLabel: 'Continue',
      actionHref: `/new?draft=${draft.id}`,
      type: 'draft',
    });
  }

  // 4. Strategy contacts marked "actionable" but untouched for 14+ days
  const strategy = await loadStrategyEntries();
  const strategyTodo = strategy
    .filter((e) => e.status === 'in_conversation' || e.status === 'reached_out')
    .filter((e) => !e.lastContactedAt || Date.now() - e.lastContactedAt > 14 * 24 * 60 * 60 * 1000)
    .slice(0, 1);
  for (const entry of strategyTodo) {
    items.push({
      id: `strategy-${entry.id}`,
      priority: 40,
      icon: '🤝',
      title: `Follow up with ${entry.name}`,
      description: entry.userNotes || `Last touched ${entry.lastContactedAt ? formatRelativeDate(entry.lastContactedAt) : 'never'}`,
      actionLabel: 'Open',
      actionHref: `/strategy#${entry.id}`,
      type: 'reminder',
    });
  }

  // Sort by priority desc, return top 5
  return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
```

### 4. Draft analyses

The New Analysis page already autosaves JD text to localStorage (from design doc 03). Promote that into a proper drafts system:

```ts
// src/lib/drafts.ts
export interface AnalysisDraft {
  id: string;
  jdText: string;
  angle?: string;
  selectedEntryIds: string[];
  prefillCompanyId?: string;
  createdAt: number;
  updatedAt: number;
  preview: string;        // first 80 chars of JD
}

const DRAFTS_KEY = 'nexus.analysisDrafts';

export async function loadDrafts(): Promise<AnalysisDraft[]> {
  const raw = await storage.get<AnalysisDraft[]>(DRAFTS_KEY);
  return raw || [];
}

export async function saveDraft(draft: AnalysisDraft) {
  const drafts = await loadDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) drafts[idx] = draft;
  else drafts.push(draft);
  await storage.set(DRAFTS_KEY, drafts);
}

export async function deleteDraft(id: string) {
  const drafts = await loadDrafts();
  await storage.set(DRAFTS_KEY, drafts.filter((d) => d.id !== id));
}
```

On the New Analysis page, save drafts on every keystroke (debounced) and delete the draft when an analysis is successfully created.

### 5. TodayItem component

```tsx
function TodayItem({ item }: { item: TodayItem }) {
  return (
    <a href={item.actionHref} className={`today-item today-item-${item.type}`}>
      <div className="today-item-icon">{item.icon}</div>
      <div className="today-item-body">
        <div className="today-item-title">{item.title}</div>
        <div className="today-item-description">{item.description}</div>
      </div>
      <div className="today-item-action">{item.actionLabel} →</div>
    </a>
  );
}
```

```css
.today-section {
  margin-top: var(--space-8);
  margin-bottom: var(--space-8);
}

.today-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.today-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--tracking-tight);
}

.today-date {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.today-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.today-item {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: inherit;
  transition: all 150ms ease;
}

.today-item:hover {
  border-color: var(--border-default);
  background: var(--bg-elevated-2);
  transform: translateX(2px);
}

/* Type-specific left accent */
.today-item-event { border-left: 3px solid var(--accent-blue); }
.today-item-stale { border-left: 3px solid var(--accent-red); }
.today-item-draft { border-left: 3px solid var(--accent-amber); }
.today-item-reminder { border-left: 3px solid #c084fc; }

.today-item-icon {
  width: 36px;
  height: 36px;
  background: var(--bg-elevated-2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
}

.today-item-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.today-item-description {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.today-item-action {
  font-size: var(--text-sm);
  color: var(--accent-blue);
  font-weight: var(--weight-medium);
}
```

### 6. Upcoming section

A list of events in the next 14 days (interviews, scheduled follow-ups). Lower priority than Today; lives below the bento grid.

```tsx
function UpcomingSection() {
  const [appointments, setAppointments] = useState<TrackerAppointment[]>([]);

  useEffect(() => {
    appointmentRepo.list().then((all) => {
      const upcoming = all.filter((a) => {
        const diff = a.at - Date.now();
        return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000;
      }).sort((a, b) => a.at - b.at);
      setAppointments(upcoming);
    });
  }, []);

  if (appointments.length === 0) return null;

  return (
    <section className="page-content-section upcoming-section">
      <h2 className="section-title">Upcoming</h2>
      <div className="upcoming-list">
        {appointments.map((apt) => (
          <UpcomingItem key={apt.id} appointment={apt} />
        ))}
      </div>
    </section>
  );
}
```

```tsx
function UpcomingItem({ appointment }: Props) {
  const date = new Date(appointment.at);
  const day = date.toLocaleDateString('en-US', { day: '2-digit' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });

  return (
    <a href={`/tracker?appointment=${appointment.id}`} className="upcoming-item">
      <div className="upcoming-date">
        <div className="upcoming-date-day">{day}</div>
        <div className="upcoming-date-month">{month}</div>
      </div>
      <div className="upcoming-body">
        <div className="upcoming-title">{appointment.title}</div>
        <div className="upcoming-meta">
          {formatTime(appointment.at)}
          {appointment.durationMin && ` · ${appointment.durationMin} min`}
          {appointment.type === 'interview' && ' · 🎤 Interview'}
          {appointment.type === 'phone_screen' && ' · 📞 Phone screen'}
        </div>
      </div>
    </a>
  );
}
```

```css
.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  transition: border-color 150ms ease;
}

.upcoming-item:hover {
  border-color: var(--border-default);
}

.upcoming-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  flex-shrink: 0;
}

.upcoming-date-day {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.upcoming-date-month {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-top: 2px;
}

.upcoming-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.upcoming-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}
```

### 7. Quick stats (optional, subtle)

A single-line stats summary below the hero:

```tsx
<div className="quick-stats">
  <span><strong>{activeApps}</strong> active applications</span>
  <span>·</span>
  <span><strong>{thisWeekApplied}</strong> applied this week</span>
  <span>·</span>
  <span><strong>{upcomingThisWeek}</strong> upcoming this week</span>
</div>
```

```css
.quick-stats {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: var(--space-4);
}

.quick-stats strong {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-weight: var(--weight-semibold);
}
```

### 8. Empty states

If the user has no data yet (new user), suppress Today/Upcoming/Stats and show only the bento + a welcome banner:

```tsx
{isNewUser && (
  <div className="welcome-banner">
    <strong>Welcome to Nexus.</strong> Start by adding your work history to the Repository,
    or jump right in with a new analysis.
  </div>
)}
```

```css
.welcome-banner {
  background: var(--bg-elevated);
  border: 1px solid rgba(196, 181, 253, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: var(--space-6) 0;
}

.welcome-banner strong {
  color: var(--text-primary);
}
```

## Acceptance criteria

- [ ] Today section appears above the bento grid when there are actionable items
- [ ] Today shows up to 5 items sorted by priority (events > stale > drafts > reminders)
- [ ] Today is hidden entirely when no items exist (no empty state)
- [ ] Upcoming section shows appointments in next 14 days with date tiles
- [ ] Draft analyses are saved on every JD-text change (debounced 500ms)
- [ ] Drafts are removed when a successful analysis completes
- [ ] "Continue draft analysis" item appears in Today for any open draft >5 minutes old
- [ ] Type-specific left border on Today items (red=stale, blue=event, amber=draft, purple=reminder)
- [ ] Quick stats line shows below hero when user has any data
- [ ] New-user state shows a welcome banner instead

## What this unlocks

The homepage becomes a daily destination, not just a launchpad. Users open Nexus and immediately see what they need to do — no scrolling, no thinking, no friction. This is what turns Nexus from a tool into a habit.

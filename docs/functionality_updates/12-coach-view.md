# 12 — Coach View

The payoff feature. Once Nexus has 30+ days of user data — analyses, applications, status changes, outcomes — it can do something no other job-search tool can: tell the user which of their behaviors actually work. This is the long-term differentiator.

**Depends on:** All prior docs. Realistically not usable until the user has 20+ applications with status history.

## The premise

Most job-search advice is generic ("tailor your resume," "follow up after a week"). But every job seeker is different. Some convert better at smaller companies. Some get more responses with conversational cover letters. Some have a particular industry where they win.

Nexus uniquely has all the data needed to find these patterns *for this specific user*:
- Every JD they applied to
- Every resume they sent
- Every status outcome
- Every source (referral vs cold)
- Every contact interaction

A "Coach" view reads this longitudinal data and surfaces real, personal patterns.

## Goals

1. A "Coach" page (or homepage section once enabled) showing 2–4 insights.
2. Each insight is a *real pattern* with a sample size, not a vague suggestion.
3. Insights link to the data backing them (clickable transparency).
4. Disabled state when there isn't enough data yet.
5. AI-generated narrative on top of statistical patterns.

## When to surface this

Don't show until the user has at least:
- 10 applications with a final status (offer/rejected)
- OR 30 days of usage with at least 15 applications
- OR explicit opt-in from a settings page

Premature insights ("based on your 2 applications, you should...") are worse than no insights.

## Implementation

### 1. Insight types

```ts
// src/lib/coach/insights.ts

export interface Insight {
  id: string;
  type: 'pattern' | 'recommendation' | 'observation';
  title: string;
  body: string;             // 1-2 sentences, plain language
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;
  evidence: {                // for the "show me" drilldown
    label: string;
    items: { id: string; title: string; href: string }[];
  };
}
```

### 2. Pattern detectors

Each detector is a small function that takes all user data and returns an Insight (or null). Add detectors over time as you learn what's useful.

```ts
// src/lib/coach/detectors.ts

export type Detector = (data: CoachData) => Promise<Insight | null>;

export interface CoachData {
  applications: TrackerApplication[];
  analyses: Analysis[];
  contacts: TrackerContact[];
  companies: TargetCompany[];
}

// ===========================================
// Detector: response rate by application source
// ===========================================
export const sourceConversionDetector: Detector = async (data) => {
  const bySource: Record<string, { total: number; advanced: number }> = {};

  for (const app of data.applications) {
    const source = app.source || 'Unknown';
    bySource[source] = bySource[source] || { total: 0, advanced: 0 };
    bySource[source].total++;

    const advanced = app.status !== 'applied' && app.status !== 'interested';
    if (advanced) bySource[source].advanced++;
  }

  // Find sources with notably different conversion rates
  const rates = Object.entries(bySource)
    .filter(([_, v]) => v.total >= 3)   // minimum sample size
    .map(([source, v]) => ({ source, rate: v.advanced / v.total, total: v.total }));

  if (rates.length < 2) return null;

  rates.sort((a, b) => b.rate - a.rate);
  const best = rates[0];
  const worst = rates[rates.length - 1];

  if (best.rate - worst.rate < 0.25) return null;  // not significant enough

  return {
    id: 'source-conversion',
    type: 'pattern',
    title: `${best.source} converts ${Math.round(best.rate * 100)}% to phone screen or beyond`,
    body: `Across your last ${best.total + worst.total} applications, "${best.source}" leads to advancement at ${Math.round(best.rate * 100)}% vs ${Math.round(worst.rate * 100)}% for "${worst.source}". Worth doubling down on the channel that works.`,
    confidence: best.total >= 8 ? 'high' : 'medium',
    sampleSize: best.total + worst.total,
    evidence: {
      label: `${best.source} applications`,
      items: data.applications
        .filter((a) => a.source === best.source)
        .map((a) => ({
          id: a.id,
          title: `${a.company} — ${a.role}`,
          href: `/tracker?app=${a.id}`,
        })),
    },
  };
};

// ===========================================
// Detector: company size and response rate
// ===========================================
export const companySizeDetector: Detector = async (data) => {
  // Use companyRepo `stage` field as proxy for size
  const byStage: Record<string, { total: number; advanced: number }> = {};

  const companyById = new Map(data.companies.map((c) => [c.id, c]));

  for (const app of data.applications) {
    const company = app.linkedCompanyId ? companyById.get(app.linkedCompanyId) : null;
    const stage = company?.stage || 'Unknown';
    byStage[stage] = byStage[stage] || { total: 0, advanced: 0 };
    byStage[stage].total++;
    if (app.status !== 'applied' && app.status !== 'interested') {
      byStage[stage].advanced++;
    }
  }

  // Similar to source detector — find significant differences
  // (implementation similar to sourceConversionDetector)

  // Return Insight or null
  return null;  // placeholder
};

// ===========================================
// Detector: time-to-status patterns
// ===========================================
export const timingDetector: Detector = async (data) => {
  // Average time from applied → screening
  const transitionTimes: number[] = [];

  for (const app of data.applications) {
    const applied = app.events.find((e) => e.toStatus === 'applied');
    const screening = app.events.find((e) => e.toStatus === 'screening');
    if (applied && screening) {
      transitionTimes.push(screening.at - applied.at);
    }
  }

  if (transitionTimes.length < 5) return null;

  const avgMs = transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
  const avgDays = Math.round(avgMs / (24 * 60 * 60 * 1000));

  // Find applications that have been in 'applied' longer than avg + 50%
  const threshold = avgMs * 1.5;
  const lateApps = data.applications.filter((app) => {
    if (app.status !== 'applied') return false;
    const applied = app.events.find((e) => e.toStatus === 'applied');
    if (!applied) return false;
    return Date.now() - applied.at > threshold;
  });

  if (lateApps.length === 0) return null;

  return {
    id: 'timing-pattern',
    type: 'recommendation',
    title: `Companies that respond usually do so within ${avgDays} days`,
    body: `You have ${lateApps.length} application${lateApps.length !== 1 ? 's' : ''} past that threshold with no movement. Consider following up or marking as on-hold.`,
    confidence: transitionTimes.length >= 10 ? 'high' : 'medium',
    sampleSize: transitionTimes.length,
    evidence: {
      label: 'Applications past typical response window',
      items: lateApps.map((a) => ({
        id: a.id,
        title: `${a.company} — ${a.role}`,
        href: `/tracker?app=${a.id}`,
      })),
    },
  };
};

// ===========================================
// Detector: repository entries leveraged most
// ===========================================
export const repositoryUsageDetector: Detector = async (data) => {
  // Count how often each repository entry is used across analyses
  const usageCount: Record<string, number> = {};

  for (const a of data.analyses) {
    for (const eid of a.linkedRepositoryEntries) {
      usageCount[eid] = (usageCount[eid] || 0) + 1;
    }
  }

  // Compare against application outcomes
  // (advanced logic — left as future work)

  return null;
};
```

### 3. Insight generation pipeline

```ts
// src/lib/coach/generate.ts
const DETECTORS: Detector[] = [
  sourceConversionDetector,
  companySizeDetector,
  timingDetector,
  repositoryUsageDetector,
  // Add more as you discover useful patterns
];

export async function generateInsights(): Promise<Insight[]> {
  const data: CoachData = {
    applications: await applicationRepo.list(),
    analyses: await analysisRepo.list(),
    contacts: await contactRepo.list(),
    companies: await companyRepo.list(),
  };

  if (!hasEnoughData(data)) return [];

  const insights = await Promise.all(DETECTORS.map((d) => d(data)));
  return insights
    .filter((i): i is Insight => i !== null)
    .sort((a, b) => confidenceScore(b) - confidenceScore(a));
}

function hasEnoughData(data: CoachData): boolean {
  const finalStates = data.applications.filter(
    (a) => a.status === 'offer' || a.status === 'rejected'
  );
  if (finalStates.length >= 10) return true;
  if (data.applications.length >= 15) {
    const oldest = Math.min(...data.applications.map((a) => a.createdAt));
    if (Date.now() - oldest > 30 * 24 * 60 * 60 * 1000) return true;
  }
  return false;
}

function confidenceScore(i: Insight): number {
  return { low: 1, medium: 2, high: 3 }[i.confidence];
}
```

### 4. AI narrative layer

Statistical patterns are useful, but a narrative wraps them. Once you have insights, ask the model to synthesize a "this week's read" paragraph:

```ts
export async function generateWeeklyRead(insights: Insight[]): Promise<string> {
  if (insights.length === 0) return '';

  const prompt = `
Given the following job-search patterns from a user's data, write a short 2-3 sentence reflection (no headers, no lists, just prose) that summarizes the most actionable takeaway. Be direct, like a thoughtful coach, not a chirpy assistant.

Patterns:
${insights.map((i, idx) => `${idx + 1}. ${i.title}: ${i.body}`).join('\n')}

Write the reflection now.
`.trim();

  return await callModel(prompt);
}
```

### 5. Coach page

A dedicated route or homepage section:

```tsx
// pages/coach.tsx (or component for homepage)
function CoachView() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const i = await generateInsights();
      setInsights(i);
      if (i.length > 0) {
        const n = await generateWeeklyRead(i);
        setNarrative(n);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (insights.length === 0) return <NotEnoughDataState />;

  return (
    <PageShell
      emoji="📈"
      titlePrefix="Your"
      titleAccent="Patterns"
      subtitle="What your data is telling you."
      backHref="/"
    >
      {narrative && (
        <div className="coach-narrative">
          {narrative}
        </div>
      )}

      <div className="insights-grid">
        {insights.map((i) => (
          <InsightCard key={i.id} insight={i} />
        ))}
      </div>

      <div className="coach-disclaimer">
        Patterns are based on your data only. Small sample sizes mean correlations, not causation.
        Treat these as conversation starters, not commandments.
      </div>
    </PageShell>
  );
}
```

### 6. Insight card

```tsx
function InsightCard({ insight }: { insight: Insight }) {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <article className={`insight-card insight-card-${insight.confidence}`}>
      <div className="insight-header">
        <span className={`insight-confidence insight-confidence-${insight.confidence}`}>
          {insight.confidence} confidence
        </span>
        <span className="insight-sample">n = {insight.sampleSize}</span>
      </div>

      <h3 className="insight-title">{insight.title}</h3>
      <p className="insight-body">{insight.body}</p>

      <button
        className="insight-evidence-toggle"
        onClick={() => setShowEvidence(!showEvidence)}
      >
        {showEvidence ? 'Hide' : 'Show'} evidence ({insight.evidence.items.length})
      </button>

      {showEvidence && (
        <div className="insight-evidence">
          <div className="insight-evidence-label">{insight.evidence.label}</div>
          <ul className="insight-evidence-list">
            {insight.evidence.items.map((e) => (
              <li key={e.id}>
                <a href={e.href}>{e.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
```

```css
.coach-narrative {
  background: var(--bg-elevated);
  border: 1px solid rgba(196, 181, 253, 0.3);
  border-left: 3px solid #c084fc;
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
}

.insight-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.insight-card-high { border-left: 3px solid var(--accent-green); }
.insight-card-medium { border-left: 3px solid var(--accent-blue); }
.insight-card-low { border-left: 3px solid var(--text-tertiary); }

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
}

.insight-confidence {
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-weight: var(--weight-medium);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}

.insight-confidence-high { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
.insight-confidence-medium { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); }
.insight-confidence-low { background: var(--bg-elevated-2); color: var(--text-tertiary); }

.insight-sample {
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.insight-title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.insight-body {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.insight-evidence-toggle {
  background: none;
  border: none;
  color: var(--accent-blue);
  font-size: var(--text-xs);
  cursor: pointer;
  text-align: left;
  padding: 0;
  margin-top: var(--space-2);
}

.insight-evidence-toggle:hover {
  text-decoration: underline;
}

.insight-evidence {
  padding: var(--space-3);
  background: var(--bg-elevated-2);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.insight-evidence-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-2);
}

.insight-evidence-list {
  margin: 0;
  padding-left: var(--space-4);
  font-size: var(--text-sm);
}

.insight-evidence-list li {
  margin-bottom: var(--space-1);
}

.insight-evidence-list a {
  color: var(--text-secondary);
  text-decoration: none;
}

.insight-evidence-list a:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.coach-disclaimer {
  margin-top: var(--space-8);
  padding: var(--space-4);
  background: var(--bg-elevated);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: 1.5;
}
```

### 7. Not-enough-data state

```tsx
function NotEnoughDataState() {
  return (
    <div className="empty-state">
      <h2>Not enough data yet</h2>
      <p>
        Once you have around 15 applications with status history (or about 30 days of usage),
        Nexus can surface patterns in your data.
      </p>
      <p>
        Until then, focus on building your repository, running analyses, and tracking outcomes.
        Patterns emerge from data.
      </p>
      <div className="empty-state-progress">
        <div className="progress-label">
          {appCount} of 15 applications tracked
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, (appCount / 15) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

### 8. Privacy reinforcement

This is a privacy-sensitive feature — patterns from your job-search behavior. Make the local-first story explicit:

```tsx
<div className="coach-privacy-note">
  🔒 All patterns are computed locally in your browser. Nothing is sent to a server, ever.
  This data never leaves your machine.
</div>
```

## Acceptance criteria

- [ ] Coach page exists at `/coach` (or as a homepage section)
- [ ] Page is hidden/disabled when user has fewer than 10 final-status applications and fewer than 30 days of usage
- [ ] Each insight has a title, body, confidence level, sample size
- [ ] Insights have a "Show evidence" toggle that lists backing data with links
- [ ] Disclaimer about correlation vs causation is visible
- [ ] At least 3 detectors implemented: source conversion, timing, company size
- [ ] AI narrative paragraph synthesizes insights when 2+ exist
- [ ] Privacy note about local computation is visible
- [ ] "Not enough data" state shows progress toward unlocking the feature

## Roadmap beyond v1

Once the framework is in place, additional detectors are easy to add:

- Resume length vs response rate
- Cover letter tone (formal/conversational) vs response rate
- Contact attempts in first 7 days vs final outcome
- Day-of-week of application vs response rate
- Specific keywords in JD vs your conversion

Each detector is one file in `src/lib/coach/detectors/`. Iterating on detectors is the long-term product moat — what insights does your specific user base want? Build for them.

## What this unlocks

This is the *eventual* product story for Nexus. The other 11 docs make Nexus a great tool. This one makes it irreplaceable: only Nexus has your full data, so only Nexus can tell you what's working for you. Once a user has this insight running, switching tools means losing months of pattern-finding. That's retention.

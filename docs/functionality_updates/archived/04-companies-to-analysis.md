# 04 — Target Companies → Analysis Launchpad

Transform the Target Companies page from a directory into a launchpad. Today the user sees a 10/10 fit company and the only action is "Careers ↗" which sends them out of the app. Add an "✨ Analyze" button that pre-fills a New Analysis with the company's context.

**Depends on:** `01-data-model.md`, `02-repository-as-context.md`

## The current gap

The Target Companies page contains rich context: company name, vertical, stage, why-fit notes. None of that flows into an analysis. The user has to:

1. Click "Careers ↗" → external site
2. Find a relevant job posting → copy the JD
3. Come back to Nexus → click "+ New Analysis"
4. Paste the JD → manually re-state the company context the app already knew

That's 4 unnecessary steps. The "Analyze" button collapses it to 2.

## Goals

1. "✨ Analyze" button on every Target Company card.
2. Clicking it pre-fills the New Analysis page with that company context.
3. Resulting analysis is linked to the company.
4. The company card shows "📄 1 analysis" when analyses exist.

## Implementation

### 1. Add Analyze button to company cards

In the company card actions area (from design doc 07-target-companies):

```tsx
<div className="company-actions">
  <span className="company-ats">{company.ats}</span>

  <button
    className="btn-secondary btn-sm company-analyze-btn"
    onClick={() => handleAnalyze(company)}
    aria-label={`Analyze ${company.name}`}
  >
    ✨ Analyze
  </button>

  <button className="btn-secondary btn-sm" onClick={() => track(company)}>
    {company.tracked ? '✓ Tracked' : '+ Track'}
  </button>

  <a href={company.careersUrl} target="_blank" rel="noopener" className="btn-primary btn-sm">
    Careers ↗
  </a>
</div>
```

```css
.company-analyze-btn {
  color: var(--accent-blue);
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.08);
}

.company-analyze-btn:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent-blue);
}
```

The blue tint distinguishes it as the *intelligent* action — different from the neutral Track button.

### 2. Handle the analyze action

Two modes depending on whether the user has a JD ready:

```ts
async function handleAnalyze(company: TargetCompany) {
  // Open the New Analysis page with company context pre-filled via query params
  const params = new URLSearchParams({
    company: company.name,
    companyId: company.id,
    vertical: company.vertical,
  });

  if (company.careersUrl) {
    params.set('careersUrl', company.careersUrl);
  }

  router.push(`/new?${params.toString()}`);
}
```

### 3. New Analysis page reads the pre-fill

On the New Analysis page, read query params and use them to provide context to the user:

```tsx
const searchParams = useSearchParams();
const prefillCompanyId = searchParams.get('companyId');
const prefillCompanyName = searchParams.get('company');
const prefillCareersUrl = searchParams.get('careersUrl');

const [prefillCompany, setPrefillCompany] = useState<TargetCompany | null>(null);

useEffect(() => {
  if (prefillCompanyId) {
    companyRepo.get(prefillCompanyId).then(setPrefillCompany);
  }
}, [prefillCompanyId]);
```

### 4. Pre-fill banner on New Analysis

When a company prefill is active, show a banner above the JD textarea:

```tsx
{prefillCompany && (
  <div className="prefill-banner">
    <div className="prefill-banner-icon">🎯</div>
    <div className="prefill-banner-body">
      <div className="prefill-banner-title">
        Analyzing for <strong>{prefillCompany.name}</strong>
      </div>
      <div className="prefill-banner-meta">
        {prefillCompany.vertical} · Fit score {prefillCompany.fit}/10
        {prefillCompany.whyFit && ` · ${prefillCompany.whyFit}`}
      </div>
    </div>
    <div className="prefill-banner-actions">
      {prefillCareersUrl && (
        <a href={prefillCareersUrl} target="_blank" rel="noopener" className="btn-ghost btn-sm">
          View open roles ↗
        </a>
      )}
      <button className="btn-ghost btn-sm" onClick={clearPrefill}>Clear</button>
    </div>
  </div>
)}
```

```css
.prefill-banner {
  background: var(--bg-elevated);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  position: relative;
  overflow: hidden;
}

.prefill-banner::before {
  /* Subtle blue glow on the left */
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent-blue);
  box-shadow: var(--glow-blue);
}

.prefill-banner-icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.prefill-banner-body {
  flex: 1;
  min-width: 0;
}

.prefill-banner-title {
  font-size: var(--text-base);
  color: var(--text-primary);
}

.prefill-banner-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.prefill-banner-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}
```

### 5. Pass company context into the analysis

When the user clicks Analyze with a prefill active, pass the company ID through to the analysis:

```ts
async function handleAnalyzeSubmit() {
  const analysis = await runAnalysis(jdText, {
    angle,
    entryIds: Array.from(selectedRepositoryIds),
    linkedCompanyId: prefillCompanyId || undefined,
  });

  router.push(`/analysis/${analysis.id}`);
}
```

The `runAnalysis` function (from doc 02) already accepts `linkedCompanyId` — make sure it saves to the Analysis record.

### 6. Inject company context into the prompt

Modify `buildRepositoryContext` (or the prompt assembly) to include company context when available:

```ts
async function buildAnalysisPrompt(options: {
  jdText: string;
  repositoryEntries: RepositoryEntry[];
  company?: TargetCompany;
  angle?: string;
}) {
  const repoContext = buildRepositoryContext(options.repositoryEntries);

  const companyContext = options.company ? `
# Target Company Context
- **Name:** ${options.company.name}
- **Vertical:** ${options.company.vertical}
- **Stage:** ${options.company.stage || 'unknown'}
${options.company.whyFit ? `- **Why this is a fit:** ${options.company.whyFit}` : ''}
${options.company.note ? `- **Note:** ${options.company.note}` : ''}
` : '';

  return `
You are tailoring a resume and cover letter for a candidate.

# Candidate's Work History
${repoContext.formatted}

${companyContext}

# Target Job Description
${options.jdText}

${options.angle ? `# Candidate's Note on Angle\n${options.angle}\n` : ''}

# Task
Generate a tailored resume, cover letter, and interview strategy brief.
- Use ONLY information from the work history above. Do not invent experience.
- If company context is provided, reference it appropriately in the cover letter.
- Tailor language to match the company's stage and vertical.
`.trim();
}
```

### 7. Show analysis count on company cards

When a company has been analyzed before, show a small chip on the card:

```tsx
{analysisCount > 0 && (
  <a
    href={`/companies/${company.id}/analyses`}
    className="company-analysis-count"
  >
    📄 {analysisCount} analysis{analysisCount !== 1 ? 'es' : ''}
  </a>
)}
```

Compute the count once at page load:

```ts
const [analysisCountByCompany, setAnalysisCountByCompany] = useState<Record<string, number>>({});

useEffect(() => {
  analysisRepo.list().then((all) => {
    const counts: Record<string, number> = {};
    for (const a of all) {
      if (a.linkedCompanyId) {
        counts[a.linkedCompanyId] = (counts[a.linkedCompanyId] || 0) + 1;
      }
    }
    setAnalysisCountByCompany(counts);
  });
}, []);

// In the render:
const analysisCount = analysisCountByCompany[company.id] || 0;
```

```css
.company-analysis-count {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--accent-blue);
  text-decoration: none;
  margin-top: var(--space-1);
}

.company-analysis-count:hover {
  text-decoration: underline;
}
```

### 8. (Optional) Company detail page

Once a company has multiple analyses, a dedicated detail page makes sense. Out of scope for this doc, but the route `/companies/[id]` could show:

- All analyses for this company (with which role, which date, current tracker status)
- All contacts linked to this company
- A timeline of activity
- Company notes (user-editable)

Defer this until you have at least one user with 3+ analyses for the same company.

## Acceptance criteria

- [ ] "✨ Analyze" button appears on every Target Company card
- [ ] Clicking it navigates to New Analysis with company context in query params
- [ ] New Analysis page shows a blue-accented banner identifying the target company
- [ ] Banner shows company name, vertical, fit score, why-fit note
- [ ] Banner has "View open roles" link (if careersUrl exists) and "Clear" action
- [ ] Submitting analysis with prefill active saves `linkedCompanyId` on the analysis
- [ ] Analysis prompt includes a "Target Company Context" section when company is present
- [ ] Company cards show "📄 N analyses" chip when analyses exist for that company
- [ ] Chip links to a filtered analyses view (placeholder ok; full detail page is future)

## What this unlocks

The Target Companies page becomes the **starting point** of the workflow, not a side directory. User journey collapses to:

1. Open Target Companies → see 10/10 fit at Bestow
2. Click "✨ Analyze" → New Analysis loads with Bestow context
3. Paste JD from Bestow's careers page → click Analyze
4. Tailored resume references Bestow's life-insurance-tech focus → user is impressed
5. Click "Track this" → application logged
6. Open Tracker tomorrow → application visible

Five clicks, end-to-end. Compare to the current state where the user has to manage all that context in their head.

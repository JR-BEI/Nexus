# 02 — Repository as Analysis Context

Make the Build Repository the source of truth that powers every Analysis. Right now, the user pastes a JD and the AI generates a resume — but the AI doesn't have any structured knowledge of who the user actually is. The result: outputs that look generic or hallucinated.

**Depends on:** `01-data-model.md`

## The current gap

Looking at the screenshots, the Outputs page shows a fully-formed resume with bullet points like "Sole owner of a net-new absence management product line." This level of specificity has to be coming from *somewhere*. Either:

1. The user pasted their resume into the JD field (gross UX), or
2. There's a hidden prompt with hardcoded user context (doesn't scale), or
3. The model is hallucinating plausible-sounding content (dangerous)

The fix: when the user clicks "Analyze," the prompt to the model includes the user's structured Repository as context. The model tailors *that* content to the JD — it doesn't invent content from scratch.

## Goals

1. Every Analysis automatically includes Repository entries as context.
2. The user can see and edit what context will be sent.
3. The user can selectively include/exclude entries per-analysis.
4. Analyses persist which Repository entries they used (for reproducibility).

## Implementation

### 1. Repository context builder

Create a function that assembles Repository entries into a model-friendly format.

```ts
// src/lib/context/repositoryContext.ts
import { RepositoryEntry } from '../../types/nexus';

export interface RepositoryContext {
  entries: RepositoryEntry[];
  formatted: string;          // for the model prompt
  tokenEstimate: number;
}

export function buildRepositoryContext(entries: RepositoryEntry[]): RepositoryContext {
  // Sort by date descending (most recent first)
  const sorted = [...entries].sort((a, b) => {
    const aEnd = a.endDate || '9999';
    const bEnd = b.endDate || '9999';
    return bEnd.localeCompare(aEnd);
  });

  const formatted = sorted
    .map((e) => formatEntry(e))
    .join('\n\n---\n\n');

  return {
    entries: sorted,
    formatted,
    tokenEstimate: Math.ceil(formatted.length / 4),  // rough estimate
  };
}

function formatEntry(e: RepositoryEntry): string {
  const dateRange = e.endDate
    ? `${e.startDate} to ${e.endDate}`
    : `${e.startDate} to present`;

  const impacts = e.impactStatements
    .map((i) => `- ${i.text}${i.metric ? ` (${i.metric})` : ''}`)
    .join('\n');

  return [
    `**${e.title}** at **${e.company}** (${dateRange})`,
    e.summary ? `Summary: ${e.summary}` : '',
    impacts ? `Impact:\n${impacts}` : '',
    e.skills.length ? `Skills: ${e.skills.join(', ')}` : '',
    e.domains.length ? `Domains: ${e.domains.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}
```

### 2. Modify the analysis prompt

Wherever you currently call the model for an Analysis, prepend the repository context. Pseudocode:

```ts
async function runAnalysis(jdText: string, options: { angle?: string; entryIds?: string[] }) {
  // Load repository entries
  const allEntries = await repositoryRepo.list();
  const selectedEntries = options.entryIds
    ? allEntries.filter((e) => options.entryIds!.includes(e.id))
    : allEntries;

  const context = buildRepositoryContext(selectedEntries);

  const prompt = `
You are tailoring a resume for the following candidate based on their work history.

# Candidate's Work History
${context.formatted}

# Target Job Description
${jdText}

${options.angle ? `# Candidate's Note on Angle\n${options.angle}\n` : ''}

# Task
Generate a tailored resume that emphasizes the candidate's relevant experience for this role.
- Use ONLY information from the work history above. Do not invent experience.
- Reorder, emphasize, and reword bullet points to match the JD's priorities.
- Output in markdown format.
`.trim();

  // Send to model...
  const result = await callModel(prompt);

  // Save analysis with linked repository entries
  const analysis: Analysis = {
    id: newAnalysisId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    jdText,
    userAngle: options.angle,
    extracted: parseExtracted(result),
    outputs: {
      resume: [{ id: newVersionId(), createdAt: Date.now(), content: result.resume, label: 'Original' }],
      coverLetter: [{ id: newVersionId(), createdAt: Date.now(), content: result.coverLetter, label: 'Original' }],
      strategyBrief: [{ id: newVersionId(), createdAt: Date.now(), content: result.strategyBrief, label: 'Original' }],
    },
    linkedRepositoryEntries: selectedEntries.map((e) => e.id),
    linkedCompanyId: options.linkedCompanyId,
    linkedTrackerId: undefined,
  };

  await analysisRepo.save(analysis);
  return analysis;
}
```

### 3. Pre-analysis context preview

Before the user clicks "Analyze Job Description," show them what context will be sent. This adds transparency and lets them refine.

Add a collapsible section on the New Analysis page below the JD textarea:

```tsx
<section className="page-content-section">
  <ContextPreview
    entries={repositoryEntries}
    selectedIds={selectedIds}
    onChange={setSelectedIds}
  />
</section>
```

```tsx
// components/ContextPreview.tsx
import { useState } from 'react';

interface Props {
  entries: RepositoryEntry[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}

export function ContextPreview({ entries, selectedIds, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const selectedCount = selectedIds.size;

  const toggleEntry = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  if (entries.length === 0) {
    return (
      <div className="context-empty">
        <p>You haven't added any work history yet.</p>
        <a href="/repository" className="btn-secondary">+ Add to Repository</a>
      </div>
    );
  }

  return (
    <div className="context-preview">
      <button
        className="context-preview-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span>
          <strong>{selectedCount} of {entries.length}</strong> Repository entries will be used as context
        </span>
        <span className="context-preview-chevron">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="context-preview-body">
          <p className="context-preview-hint">
            Uncheck entries you don't want emphasized for this role.
          </p>
          {entries.map((e) => (
            <label key={e.id} className="context-entry">
              <input
                type="checkbox"
                checked={selectedIds.has(e.id)}
                onChange={() => toggleEntry(e.id)}
              />
              <div className="context-entry-text">
                <div className="context-entry-title">
                  {e.title} · {e.company}
                </div>
                <div className="context-entry-meta">
                  {e.startDate} – {e.endDate || 'present'} ·
                  {' '}{e.impactStatements.length} impact statement{e.impactStatements.length !== 1 ? 's' : ''}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

Styling — minimal, fits the existing system:

```css
.context-preview {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.context-preview-header {
  width: 100%;
  background: none;
  border: none;
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.context-preview-header:hover {
  background: var(--bg-elevated-2);
}

.context-preview-chevron {
  color: var(--text-tertiary);
}

.context-preview-body {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.context-preview-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0 0 var(--space-2);
}

.context-entry {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.context-entry:hover {
  background: var(--bg-elevated-2);
}

.context-entry-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.context-entry-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.context-empty {
  background: var(--bg-elevated);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}
```

### 4. Optional "user angle" field

Below the context preview, add an optional input for the user to nudge the analysis:

```tsx
<div className="angle-input-wrap">
  <label htmlFor="angle" className="textarea-label">
    Emphasize a particular angle? <span className="text-tertiary">(optional)</span>
  </label>
  <input
    id="angle"
    type="text"
    className="input"
    placeholder="e.g. Lean into AI/ML work over insurance domain"
    value={angle}
    onChange={(e) => setAngle(e.target.value)}
  />
</div>
```

This goes into the prompt as `userAngle` (from the data model). The model uses it to bias emphasis.

### 5. Disclosure on the Outputs page

After analysis runs, the Outputs page should show which entries were used. Add a small chip row below the step indicator:

```tsx
<div className="outputs-context-chip">
  <span className="outputs-context-label">Tailored from:</span>
  {analysis.linkedRepositoryEntries.map((entryId) => {
    const entry = repositoryMap.get(entryId);
    if (!entry) return null;
    return (
      <span key={entryId} className="context-chip">
        {entry.company}
      </span>
    );
  })}
</div>
```

```css
.outputs-context-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: var(--space-3) 0;
  flex-wrap: wrap;
}

.outputs-context-label {
  font-weight: var(--weight-medium);
  margin-right: var(--space-1);
}

.context-chip {
  padding: 2px var(--space-2);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}
```

### 6. Handling the empty case

If the user has nothing in their Repository, the New Analysis page should *encourage* (not block) building it first:

```tsx
{repositoryEntries.length === 0 && (
  <div className="empty-context-banner">
    <strong>Heads up:</strong> You haven't added any work history to your Repository yet.
    Without it, results will be generic.{' '}
    <a href="/repository">Add work history →</a>
  </div>
)}
```

But still let them proceed — they may want to test the JD parsing alone.

## Acceptance criteria

- [ ] `buildRepositoryContext` function builds a structured prompt context from entries
- [ ] Analysis prompt includes repository context as a labeled section
- [ ] Saved Analyses persist `linkedRepositoryEntries` so we can show what was used
- [ ] New Analysis page shows a collapsible context preview with selectable entries
- [ ] All entries are selected by default; user can uncheck individuals
- [ ] Optional "angle" input below context preview
- [ ] Empty-repository state nudges (but doesn't block) the user
- [ ] Outputs page shows "Tailored from: [Company] [Company]" chips
- [ ] Token estimate is shown if context exceeds a threshold (e.g., 8000 tokens warn)

## What this unlocks

This is the single most impactful functionality change. Once Repository is real context:
- Output quality jumps dramatically (specific, not generic)
- Hallucination drops to near-zero (model only reorders, doesn't invent)
- The user feels the app *knows them*
- Repository becomes worth investing time in (currently it has no payoff)

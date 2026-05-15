# 08 — Repository Multi-Input

Voice recording is great but it's not the only way to populate the Repository. Some users will want to paste an existing resume; others will want to import from LinkedIn. Make voice one of three input methods.

**Depends on:** `01-data-model.md`

## The current gap

Build Repository only accepts voice recordings. This excludes:

- Users who already have a polished resume — making them re-record it is friction
- Users in environments where they can't talk (open offices, coffee shops)
- Users who are LinkedIn-native and already have their history there
- Users editing existing entries (no clear flow)

## Goals

1. Three input modes: Voice, Paste, Manual.
2. (Optional) LinkedIn import as fourth mode via PDF.
3. Clear flow for editing existing entries.
4. Repository page shows what's been captured at a glance.

## Implementation

### 1. Repository page redesign

The Repository page becomes two zones: existing entries (top) and add-new (bottom).

```tsx
<PageShell
  emoji="📚"
  titlePrefix="Build"
  titleAccent="Repository"
  subtitle="Your work history, structured for tailoring."
  status={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
  backHref="/"
>
  <RepositoryList entries={entries} onEdit={setEditingEntry} onDelete={handleDelete} />
  <AddEntry onComplete={handleNewEntry} />
</PageShell>
```

### 2. Repository list

```tsx
function RepositoryList({ entries, onEdit, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">No work history yet</p>
        <p className="empty-state-body">
          Add at least one role below. Analyses use this as context.
        </p>
      </div>
    );
  }

  return (
    <section className="page-content-section">
      <h2 className="section-title">Your work history</h2>
      <div className="repo-entry-list">
        {entries.map((e) => (
          <RepoEntryCard
            key={e.id}
            entry={e}
            onEdit={() => onEdit(e)}
            onDelete={() => onDelete(e.id)}
          />
        ))}
      </div>
    </section>
  );
}
```

```tsx
function RepoEntryCard({ entry, onEdit, onDelete }: Props) {
  return (
    <article className={`repo-card ${entry.needsReview ? 'repo-card-review' : ''}`}>
      <div className="repo-card-header">
        <div>
          <h3 className="repo-card-title">{entry.title}</h3>
          <div className="repo-card-company">
            {entry.company} · {entry.startDate} – {entry.endDate || 'present'}
          </div>
        </div>
        <div className="repo-card-actions">
          <button className="btn-ghost btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn-ghost btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {entry.needsReview && (
        <div className="repo-card-review-banner">
          ⚠ AI extraction may need review
        </div>
      )}

      <div className="repo-card-stats">
        <span>{entry.impactStatements.length} impact statement{entry.impactStatements.length !== 1 ? 's' : ''}</span>
        {entry.skills.length > 0 && <span>·</span>}
        {entry.skills.length > 0 && <span>{entry.skills.length} skills</span>}
        {entry.domains.length > 0 && <span>·</span>}
        {entry.domains.length > 0 && <span>{entry.domains.length} domains</span>}
      </div>

      {entry.impactStatements.length > 0 && (
        <ul className="repo-card-impacts">
          {entry.impactStatements.slice(0, 3).map((i) => (
            <li key={i.id}>{i.text}</li>
          ))}
          {entry.impactStatements.length > 3 && (
            <li className="repo-card-impacts-more">
              + {entry.impactStatements.length - 3} more
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
```

```css
.repo-entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.repo-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  transition: border-color 150ms ease;
}

.repo-card:hover {
  border-color: var(--border-default);
}

.repo-card-review {
  border-color: rgba(245, 158, 11, 0.4);
}

.repo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.repo-card-title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0 0 2px;
}

.repo-card-company {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.repo-card-review-banner {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--accent-amber);
}

.repo-card-stats {
  display: flex;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-3);
}

.repo-card-impacts {
  margin: var(--space-3) 0 0;
  padding-left: var(--space-6);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.repo-card-impacts li {
  margin-bottom: var(--space-1);
  line-height: 1.5;
}

.repo-card-impacts-more {
  color: var(--text-tertiary);
  font-style: italic;
  list-style: none;
  margin-left: calc(-1 * var(--space-6));
  padding-left: 0;
}
```

### 3. Add entry — mode selector

Tabs for the three input modes:

```tsx
function AddEntry({ onComplete }: Props) {
  const [mode, setMode] = useState<'voice' | 'paste' | 'manual'>('voice');

  return (
    <section className="page-content-section">
      <h2 className="section-title">Add a role</h2>

      <div className="input-mode-tabs">
        <button
          className={`mode-tab ${mode === 'voice' ? 'mode-tab-active' : ''}`}
          onClick={() => setMode('voice')}
        >
          🎙 Voice
        </button>
        <button
          className={`mode-tab ${mode === 'paste' ? 'mode-tab-active' : ''}`}
          onClick={() => setMode('paste')}
        >
          📋 Paste
        </button>
        <button
          className={`mode-tab ${mode === 'manual' ? 'mode-tab-active' : ''}`}
          onClick={() => setMode('manual')}
        >
          ✎ Manual
        </button>
      </div>

      <div className="input-mode-body">
        {mode === 'voice' && <VoiceMode onComplete={onComplete} />}
        {mode === 'paste' && <PasteMode onComplete={onComplete} />}
        {mode === 'manual' && <ManualMode onComplete={onComplete} />}
      </div>
    </section>
  );
}
```

```css
.input-mode-tabs {
  display: flex;
  gap: var(--space-2);
  margin: var(--space-4) 0 var(--space-3);
  padding: var(--space-1);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  width: fit-content;
  border: 1px solid var(--border-subtle);
}

.mode-tab {
  background: none;
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease;
}

.mode-tab:hover {
  color: var(--text-secondary);
}

.mode-tab-active {
  background: var(--bg-elevated-2);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.input-mode-body {
  margin-top: var(--space-4);
}
```

### 4. Voice mode

This is the existing flow (from design doc 05). Wrap the existing component and wire its completion to the `onComplete` callback. No changes needed here beyond fitting into the new container.

### 5. Paste mode

```tsx
function PasteMode({ onComplete }: Props) {
  const [text, setText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<RepositoryEntry | null>(null);

  async function handleExtract() {
    setExtracting(true);
    try {
      const entry = await extractFromText(text);
      setExtracted(entry);
    } finally {
      setExtracting(false);
    }
  }

  if (extracted) {
    return (
      <ExtractedPreview
        entry={extracted}
        onSave={async () => {
          await repositoryRepo.save(extracted);
          onComplete(extracted);
        }}
        onEdit={(updated) => setExtracted(updated)}
        onCancel={() => setExtracted(null)}
      />
    );
  }

  return (
    <div className="paste-mode">
      <p className="mode-hint">
        Paste a resume, LinkedIn export, or any block of text describing a role.
        AI will extract company, title, dates, and impact statements.
      </p>
      <textarea
        className="textarea"
        rows={10}
        placeholder="Paste resume text or role description here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="paste-mode-actions">
        <span className="paste-mode-meta">{text.length} characters</span>
        <button
          className="btn-primary"
          disabled={text.length < 100 || extracting}
          onClick={handleExtract}
        >
          {extracting ? 'Extracting...' : 'Extract structure'}
        </button>
      </div>
    </div>
  );
}
```

The extraction prompt:

```ts
async function extractFromText(text: string): Promise<RepositoryEntry> {
  const prompt = `
Extract structured information about a single role from the following text. If the text contains multiple roles, focus on the most prominent or first one.

Return JSON in this exact shape:
{
  "company": "string",
  "title": "string",
  "startDate": "YYYY-MM",
  "endDate": "YYYY-MM" or null,
  "summary": "1-2 sentence summary",
  "impactStatements": [
    { "text": "Achievement description", "metric": "Optional metric like '$20M saved'" }
  ],
  "skills": ["skill1", "skill2"],
  "domains": ["domain1", "domain2"]
}

If anything is unclear, leave the field as null or empty array — do not guess.

Text:
"""
${text}
"""
`.trim();

  const json = await callModelForJson(prompt);

  return {
    id: newRepositoryId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'paste',
    company: json.company,
    title: json.title,
    startDate: json.startDate,
    endDate: json.endDate,
    summary: json.summary,
    impactStatements: (json.impactStatements || []).map((i: any) => ({
      id: newImpactId(),
      text: i.text,
      metric: i.metric,
      tags: [],
    })),
    skills: json.skills || [],
    domains: json.domains || [],
    rawText: text,
    needsReview: !json.company || !json.title || !json.startDate,
  };
}
```

### 6. Manual mode

A structured form for users who want full control:

```tsx
function ManualMode({ onComplete }: Props) {
  const [draft, setDraft] = useState<Partial<RepositoryEntry>>({
    company: '',
    title: '',
    startDate: '',
    endDate: null,
    summary: '',
    impactStatements: [],
    skills: [],
    domains: [],
  });

  async function handleSave() {
    const entry: RepositoryEntry = {
      id: newRepositoryId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'manual',
      needsReview: false,
      ...draft,
    } as RepositoryEntry;

    await repositoryRepo.save(entry);
    onComplete(entry);
  }

  return (
    <div className="manual-mode">
      <div className="form-grid">
        <FormField label="Company" required>
          <input
            className="input"
            value={draft.company}
            onChange={(e) => setDraft({ ...draft, company: e.target.value })}
          />
        </FormField>
        <FormField label="Title" required>
          <input
            className="input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </FormField>
        <FormField label="Start (YYYY-MM)" required>
          <input
            className="input"
            placeholder="2022-01"
            value={draft.startDate}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
          />
        </FormField>
        <FormField label="End (YYYY-MM, or blank for current)">
          <input
            className="input"
            placeholder="2024-12"
            value={draft.endDate || ''}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value || null })}
          />
        </FormField>
      </div>

      <FormField label="Summary">
        <textarea
          className="textarea"
          rows={2}
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        />
      </FormField>

      <ImpactStatementsEditor
        statements={draft.impactStatements}
        onChange={(s) => setDraft({ ...draft, impactStatements: s })}
      />

      <TagsEditor
        label="Skills"
        tags={draft.skills}
        onChange={(skills) => setDraft({ ...draft, skills })}
      />
      <TagsEditor
        label="Domains"
        tags={draft.domains}
        onChange={(domains) => setDraft({ ...draft, domains })}
      />

      <div className="manual-mode-actions">
        <button
          className="btn-primary"
          disabled={!draft.company || !draft.title || !draft.startDate}
          onClick={handleSave}
        >
          Save entry
        </button>
      </div>
    </div>
  );
}
```

(The `ImpactStatementsEditor` and `TagsEditor` are standard list-of-items editors with add/remove. Implementation details omitted but follow the same input/button patterns.)

### 7. Edit existing entry

When the user clicks Edit on an existing entry, open the Manual mode pre-filled with the entry's current data:

```tsx
const [editingEntry, setEditingEntry] = useState<RepositoryEntry | null>(null);

{editingEntry && (
  <EditEntryModal
    entry={editingEntry}
    onSave={async (updated) => {
      await repositoryRepo.save(updated);
      setEditingEntry(null);
    }}
    onCancel={() => setEditingEntry(null)}
  />
)}
```

### 8. Extracted preview / review step

After paste or voice extraction, show the structured result for review before saving. User can edit any field, accept, or cancel.

```tsx
function ExtractedPreview({ entry, onSave, onEdit, onCancel }: Props) {
  return (
    <div className="extracted-preview">
      <div className="extracted-preview-header">
        <h3>Review extracted entry</h3>
        <p>Check the structure looks right before saving.</p>
      </div>

      <ManualMode
        initialEntry={entry}
        submitLabel="Save to Repository"
        onSubmit={onSave}
      />

      <button className="btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  );
}
```

The trick: Manual mode and the review step share the same form component. The only difference is initial state.

## Acceptance criteria

- [ ] Repository page shows existing entries in a list with edit/delete actions
- [ ] Each entry card shows title, company, dates, impact statement count, top 3 impacts
- [ ] Entries with extraction issues show an amber review banner
- [ ] Add Entry section has three mode tabs: Voice, Paste, Manual
- [ ] Voice mode is the existing flow, unchanged in behavior
- [ ] Paste mode accepts text, sends to AI for extraction, shows review step
- [ ] Manual mode shows a structured form with all fields
- [ ] Review step is shared between paste and voice (same component, different entry sources)
- [ ] Editing an existing entry uses the same form, pre-filled
- [ ] Empty repository state nudges the user to add their first entry
- [ ] Save updates the repository and refreshes the list

## Out of scope

- LinkedIn API integration (out of scope for local-first)
- PDF upload + parsing (defer until users ask)
- Bulk import (defer)

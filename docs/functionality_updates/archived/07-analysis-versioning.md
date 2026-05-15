# 07 — Analysis Versioning & Refinement

Add version history and section-level refinement controls to the Outputs page. Right now every analysis is a one-shot — if the cover letter is too formal, the only option is "Re-analyze," which redoes everything and loses the previous version.

**Depends on:** `01-data-model.md`, `02-repository-as-context.md`

## The current gap

The Outputs page treats the model's first response as final. In reality:

- Users often want the cover letter shorter/more conversational
- Users want the resume to emphasize one experience more
- Users want to A/B test "more formal" vs "more casual" before sending

Currently they have to redo the whole analysis, lose the prior version, and hope the new one is better. Versioning fixes this.

## Goals

1. Each output (resume, cover letter, strategy brief) has version history.
2. User can switch between versions with a dropdown.
3. Refinement actions: "More conversational", "Shorter", "Emphasize [X] more" — produce new versions, don't overwrite.
4. User can label versions ("v2 - shorter", "for warm intro").

## Implementation

### 1. Data model is already ready

From `01-data-model.md`, `AnalysisVersion` is already defined. Each output is an array of versions. The "current" version is just the last one in the array by default, but the user can switch.

### 2. Track the active version per output

```tsx
const [activeVersionIds, setActiveVersionIds] = useState<Record<string, string>>({
  resume: analysis.outputs.resume.at(-1)?.id || '',
  coverLetter: analysis.outputs.coverLetter.at(-1)?.id || '',
  strategyBrief: analysis.outputs.strategyBrief.at(-1)?.id || '',
});

const activeContent = (tab: string) => {
  const versions = analysis.outputs[tab as keyof typeof analysis.outputs];
  return versions.find((v) => v.id === activeVersionIds[tab])?.content || '';
};
```

### 3. Version dropdown in the document toolbar

Add a dropdown next to Copy/Download in the document actions row:

```tsx
<div className="document-actions">
  <VersionPicker
    versions={analysis.outputs[activeTab]}
    activeId={activeVersionIds[activeTab]}
    onSelect={(id) => setActiveVersionIds({ ...activeVersionIds, [activeTab]: id })}
    onLabel={(id, label) => handleLabel(activeTab, id, label)}
  />

  <RefineButton onRefine={handleRefine} />

  <button className="btn-secondary" onClick={handleCopy}>Copy</button>
  {activeTab !== 'strategyBrief' && (
    <button className="btn-primary" onClick={handleDownload}>↓ Download as PDF</button>
  )}
</div>
```

### 4. Version picker component

```tsx
function VersionPicker({ versions, activeId, onSelect, onLabel }: Props) {
  const [open, setOpen] = useState(false);
  const active = versions.find((v) => v.id === activeId);
  const versionNum = versions.findIndex((v) => v.id === activeId) + 1;

  if (versions.length <= 1) return null;  // hide if only one version

  return (
    <div className="version-picker">
      <button
        className="btn-secondary btn-sm version-picker-trigger"
        onClick={() => setOpen(!open)}
      >
        v{versionNum}
        {active?.label && <span className="version-label-inline"> — {active.label}</span>}
        <span className="version-chevron">▾</span>
      </button>

      {open && (
        <div className="version-picker-menu">
          {versions.map((v, idx) => (
            <button
              key={v.id}
              className={`version-option ${v.id === activeId ? 'version-option-active' : ''}`}
              onClick={() => {
                onSelect(v.id);
                setOpen(false);
              }}
            >
              <div className="version-option-main">
                <span className="version-option-num">v{idx + 1}</span>
                {v.label && <span className="version-option-label">{v.label}</span>}
              </div>
              <div className="version-option-meta">
                {formatRelativeDate(v.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

```css
.version-picker {
  position: relative;
}

.version-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.version-label-inline {
  color: var(--text-tertiary);
}

.version-chevron {
  font-size: 10px;
  color: var(--text-tertiary);
}

.version-picker-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-1);
  min-width: 240px;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.version-option {
  width: 100%;
  background: none;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.version-option:hover {
  background: var(--bg-elevated);
}

.version-option-active {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.version-option-num {
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  margin-right: var(--space-2);
}

.version-option-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
```

### 5. Refine button with preset actions

A small dropdown next to the version picker with quick refinements:

```tsx
function RefineButton({ onRefine }: Props) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const presets: { id: string; label: string; instruction: string }[] = [
    { id: 'shorter', label: 'Shorter', instruction: 'Make this significantly shorter while preserving the key points.' },
    { id: 'longer', label: 'More detail', instruction: 'Expand this with more specifics and examples from the candidate\'s history.' },
    { id: 'conversational', label: 'More conversational', instruction: 'Rewrite in a more conversational, less formal tone.' },
    { id: 'formal', label: 'More formal', instruction: 'Rewrite in a more formal, executive-appropriate tone.' },
    { id: 'punchier', label: 'Punchier opening', instruction: 'Rewrite the opening to be punchier and more attention-grabbing.' },
  ];

  return (
    <div className="refine-picker">
      <button className="btn-secondary btn-sm" onClick={() => setOpen(!open)}>
        ✨ Refine
      </button>

      {open && (
        <div className="refine-menu">
          <div className="refine-menu-label">Quick refinements</div>
          {presets.map((p) => (
            <button
              key={p.id}
              className="refine-option"
              onClick={() => {
                onRefine(p.label, p.instruction);
                setOpen(false);
              }}
            >
              {p.label}
            </button>
          ))}
          <div className="refine-menu-divider" />
          <button
            className="refine-option refine-option-custom"
            onClick={() => {
              setCustomOpen(true);
              setOpen(false);
            }}
          >
            ✎ Custom instruction...
          </button>
        </div>
      )}

      {customOpen && (
        <CustomRefineModal
          onConfirm={(label, instruction) => {
            onRefine(label, instruction);
            setCustomOpen(false);
          }}
          onCancel={() => setCustomOpen(false)}
        />
      )}
    </div>
  );
}
```

```css
.refine-picker { position: relative; }

.refine-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  min-width: 220px;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.refine-menu-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: var(--space-2) var(--space-3) var(--space-1);
}

.refine-option {
  width: 100%;
  background: none;
  border: none;
  padding: var(--space-2) var(--space-3);
  text-align: left;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  border-radius: var(--radius-sm);
  transition: background 100ms ease;
}

.refine-option:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.refine-option-custom {
  color: var(--accent-blue);
}

.refine-menu-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--space-1) 0;
}
```

### 6. Refine handler

```ts
async function handleRefine(label: string, instruction: string) {
  const currentContent = activeContent(activeTab);
  const currentVersion = analysis.outputs[activeTab].find((v) => v.id === activeVersionIds[activeTab]);

  setIsRefining(true);

  const prompt = `
You previously generated this ${tabLabel(activeTab)} for a job application:

---
${currentContent}
---

The user has asked for a refinement: "${instruction}"

Apply the refinement and return the full revised ${tabLabel(activeTab)}.
Preserve all factual claims and key accomplishments — only adjust style, length, or emphasis as requested.
Output in markdown format.
`.trim();

  try {
    const newContent = await callModel(prompt);

    const newVersion: AnalysisVersion = {
      id: newVersionId(),
      createdAt: Date.now(),
      content: newContent,
      label,
      parentVersionId: currentVersion?.id,
    };

    const updated: Analysis = {
      ...analysis,
      outputs: {
        ...analysis.outputs,
        [activeTab]: [...analysis.outputs[activeTab], newVersion],
      },
    };

    await analysisRepo.save(updated);
    setAnalysis(updated);
    setActiveVersionIds({ ...activeVersionIds, [activeTab]: newVersion.id });

    showToast({ message: `Created v${updated.outputs[activeTab].length} — ${label}` });
  } catch (err) {
    showToast({ message: 'Refinement failed. Try again.' });
  } finally {
    setIsRefining(false);
  }
}
```

### 7. Custom instruction modal

```tsx
function CustomRefineModal({ onConfirm, onCancel }: Props) {
  const [label, setLabel] = useState('');
  const [instruction, setInstruction] = useState('');

  return (
    <Modal title="Custom refinement" onClose={onCancel}>
      <div className="form-row">
        <label className="textarea-label">Version label (short)</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. 'for warm intro'"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={40}
        />
      </div>

      <div className="form-row">
        <label className="textarea-label">Instruction to the AI</label>
        <textarea
          className="textarea"
          rows={3}
          placeholder="e.g. 'Mention that I was referred by Sarah Chen at Bestow'"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button
          className="btn-primary"
          disabled={!label.trim() || !instruction.trim()}
          onClick={() => onConfirm(label.trim(), instruction.trim())}
        >
          Generate
        </button>
      </div>
    </Modal>
  );
}
```

### 8. Loading state during refinement

While the model is generating, show a subtle banner over the content:

```tsx
{isRefining && (
  <div className="refining-overlay">
    <div className="refining-spinner" />
    <span>Refining {tabLabel(activeTab)}...</span>
  </div>
)}
```

```css
.refining-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 15, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  z-index: 5;
  backdrop-filter: blur(2px);
}

.refining-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-default);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}
```

(Make `.document-card` have `position: relative` so the overlay stays inside.)

### 9. Version comparison (optional, advanced)

A "Compare" mode that shows side-by-side diff between two versions:

```tsx
const [compareMode, setCompareMode] = useState(false);
const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

{compareMode && (
  <div className="compare-view">
    <div className="compare-column">
      <h3>v{n1} — {label1}</h3>
      <ReactMarkdown>{content1}</ReactMarkdown>
    </div>
    <div className="compare-column">
      <h3>v{n2} — {label2}</h3>
      <ReactMarkdown>{content2}</ReactMarkdown>
    </div>
  </div>
)}
```

Defer this until users actually have multiple versions and request the feature.

## Acceptance criteria

- [ ] Version picker dropdown appears in the document toolbar when 2+ versions exist
- [ ] Picker shows version number, label, and creation date
- [ ] Selecting a version updates the displayed content immediately
- [ ] Refine button shows 5 preset refinements + Custom option
- [ ] Custom modal allows user to provide both a label and a free-text instruction
- [ ] Refinement creates a new version, doesn't overwrite the current one
- [ ] New version is set as active after creation
- [ ] Loading overlay shows during refinement
- [ ] Failed refinements show a toast and revert to the previous version
- [ ] Versions persist in the Analysis record (saved via analysisRepo)

## Out of scope

- Side-by-side version comparison view
- Section-level refinement (only entire-document refinement here)
- Deletion of versions (everything is preserved)

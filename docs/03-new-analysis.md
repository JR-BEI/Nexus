# 03 — New Analysis Page

The Step 1 / Input page. User pastes a job description and clicks analyze.

**Depends on:** `01-design-system.md`, `02-shared-shell.md`

## Current state

Plain dark page, flat step indicator (1 → 2 → 3), large textarea, disabled gray "Analyze Job Description" button. Functional but visually inert.

## Goals

1. Make the step indicator feel alive — active step glows, completed steps get green checks.
2. Make the textarea feel like the focus of the page (it is).
3. Make the CTA button transition from "dormant" to "ready" when content is present.

## Implementation

### 1. Wrap with PageShell

```tsx
<PageShell
  titlePrefix="New"
  titleAccent="Analysis"
  subtitle="Paste a job description. Get a tailored resume, cover letter, and interview brief."
  status={`Step ${currentStep} of 3 · ${stepLabels[currentStep - 1]}`}
  backHref="/"
  backLabel="Back to Home"
>
  {/* page content */}
</PageShell>
```

Where `stepLabels = ['Input', 'Analysis', 'Outputs']`.

### 2. Step indicator component

Replace the existing step indicator with this. Create `components/StepIndicator.tsx`:

```tsx
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  labels?: [string, string, string];
}

export function StepIndicator({
  currentStep,
  labels = ['Input', 'Analysis', 'Outputs'],
}: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {labels.map((label, idx) => {
        const stepNum = idx + 1;
        const state =
          stepNum < currentStep ? 'complete' :
          stepNum === currentStep ? 'active' : 'pending';
        return (
          <div key={label} className="step-indicator-item">
            <div className={`step-circle step-${state}`}>
              {state === 'complete' ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span className="step-label">{label}</span>
            {stepNum < 3 && <div className={`step-connector step-connector-${state}`} />}
          </div>
        );
      })}
    </div>
  );
}
```

### 3. Step indicator CSS

```css
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin: var(--space-12) auto var(--space-12);
  max-width: 500px;
}

.step-indicator-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
  transition: all 250ms var(--ease-out);
  flex-shrink: 0;
}

.step-pending {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
}

.step-active {
  background: var(--bg-elevated);
  border: 1px solid var(--accent-blue);
  color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), var(--glow-blue);
  animation: pulse-blue 2.5s ease-in-out infinite;
}

.step-complete {
  background: var(--accent-green);
  border: 1px solid var(--accent-green);
  color: #052e16;
}

.step-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: var(--weight-medium);
}

.step-indicator-item:has(.step-active) .step-label {
  color: var(--text-primary);
}

.step-indicator-item:has(.step-complete) .step-label {
  color: var(--text-secondary);
}

.step-connector {
  width: 48px;
  height: 1px;
  background: var(--border-subtle);
  margin: 0 var(--space-2);
  transition: background 400ms ease;
}

.step-connector-complete {
  background: var(--accent-green);
}

@keyframes pulse-blue {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 0 24px rgba(59, 130, 246, 0.25);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25), 0 0 36px rgba(59, 130, 246, 0.4);
  }
}
```

### 4. Textarea section

Replace the existing textarea structure. The label moves above, the meta (character count) moves below right-aligned:

```tsx
<section className="page-content-section">
  <div className="textarea-group">
    <label htmlFor="jd-input" className="textarea-label">
      Paste Job Description
    </label>
    <textarea
      id="jd-input"
      className="textarea textarea-jd"
      placeholder="Paste the full job description here..."
      value={jdText}
      onChange={(e) => setJdText(e.target.value)}
    />
    <div className="textarea-meta">
      <span>{jdText.length} characters · {wordCount(jdText)} words</span>
      {jdText.length > 0 && jdText.length < 200 && (
        <span className="textarea-hint">Tip: paste the full JD for better results</span>
      )}
    </div>
  </div>

  <button
    className="btn-primary btn-analyze"
    disabled={jdText.length < 50}
    onClick={handleAnalyze}
  >
    Analyze Job Description
  </button>
</section>
```

```css
.textarea-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.textarea-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.textarea-jd {
  min-height: 320px;
  resize: vertical;
  line-height: 1.6;
  font-size: var(--text-base);
}

.textarea-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.textarea-hint {
  color: var(--accent-amber);
}

.btn-analyze {
  width: 100%;
  padding: var(--space-4);
  font-size: var(--text-base);
  margin-top: var(--space-4);
  font-weight: var(--weight-medium);
}
```

### 5. Behavior notes

- The "Analyze" button is disabled when `jdText.length < 50`. The disabled state should be visually unmistakable (no glow, gray text). When enabled, it gets the blue glow on hover from `01-design-system.md`.
- The textarea autosaves to localStorage on every change so a refresh doesn't lose work. Key: `nexus.draft.jd`.
- On submit, transition the step indicator to step 2 with a 250ms animation before navigating/loading.

## Acceptance criteria

- [ ] Page uses `PageShell` with correct title, subtitle, and dynamic status
- [ ] Step indicator pulses on the active step
- [ ] Step indicator shows green check + filled connector for completed steps
- [ ] Textarea has focused state with blue ring (from design system input styles)
- [ ] Analyze button is dim/disabled below 50 chars, becomes active with hover glow above
- [ ] Character and word count are right-aligned below the textarea
- [ ] Hint appears in amber when 1–199 characters entered
- [ ] Draft persists across reloads

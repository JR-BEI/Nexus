# 05 — Build Repository

The voice-recording page where users describe their work experience and the AI extracts structured data. The mic button is the hero of this page.

**Depends on:** `01-design-system.md`, `02-shared-shell.md`

## Current state

A "How it works" card with 5 numbered steps stacked vertically, followed by a large card with a single blue mic button and "Click the microphone to start recording" text.

## Goals

1. Make the mic button feel like a living, breathing element (it's THE action on this page).
2. Compress the "How it works" content so the mic gets visual priority.
3. Add states for: idle, listening, processing, complete.

## Implementation

### 1. Page wrapper

```tsx
<PageShell
  emoji="📚"
  titlePrefix="Build"
  titleAccent="Repository"
  subtitle="Voice-record your work experience. AI structures it for you."
  status="Voice capture"
  backHref="/"
  backLabel="Back to Home"
>
  {/* page content */}
</PageShell>
```

### 2. How it works — horizontal compact version

Replace the vertical numbered list with a horizontal step row that takes less visual space.

```tsx
<section className="page-content-section">
  <div className="how-it-works">
    <span className="how-it-works-label">How it works</span>
    <div className="how-it-works-steps">
      <div className="hiw-step">
        <span className="hiw-num">1</span>
        <span>Click mic, describe a role</span>
      </div>
      <div className="hiw-step">
        <span className="hiw-num">2</span>
        <span>Include company, title, dates, accomplishments</span>
      </div>
      <div className="hiw-step">
        <span className="hiw-num">3</span>
        <span>Review the transcript</span>
      </div>
      <div className="hiw-step">
        <span className="hiw-num">4</span>
        <span>AI extracts structured data</span>
      </div>
      <div className="hiw-step">
        <span className="hiw-num">5</span>
        <span>Confirm and save</span>
      </div>
    </div>
  </div>
</section>
```

```css
.how-it-works {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.how-it-works-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-tertiary);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  flex-shrink: 0;
}

.how-it-works-steps {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.hiw-step {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.hiw-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .how-it-works {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}
```

### 3. The mic — hero of the page

The mic gets a generous card with ample breathing room. The button itself has three visual states.

```tsx
type RecordingState = 'idle' | 'listening' | 'processing' | 'complete';

<section className="page-content-section">
  <div className="mic-stage">
    <div className={`mic-rings mic-rings-${state}`}>
      <div className="mic-ring mic-ring-1" />
      <div className="mic-ring mic-ring-2" />
      <div className="mic-ring mic-ring-3" />
    </div>
    <button
      className={`mic-button mic-button-${state}`}
      onClick={handleToggle}
      aria-label={state === 'listening' ? 'Stop recording' : 'Start recording'}
    >
      {state === 'processing' ? (
        <svg className="mic-spinner" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 60" strokeLinecap="round" />
        </svg>
      ) : (
        <MicIcon />
      )}
    </button>
    <p className="mic-caption">
      {state === 'idle' && 'Click the microphone to start recording'}
      {state === 'listening' && (
        <>Listening… <span className="mic-timer">{formatTime(elapsed)}</span></>
      )}
      {state === 'processing' && 'Processing your recording…'}
      {state === 'complete' && 'Recording captured. Review below.'}
    </p>
  </div>
</section>
```

```css
.mic-stage {
  position: relative;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-16) var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  min-height: 320px;
  overflow: hidden;
}

/* Concentric rings, hidden by default */
.mic-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 24px));  /* centered on the button */
  width: 80px;
  height: 80px;
  pointer-events: none;
}

.mic-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid var(--accent-blue);
  opacity: 0;
}

.mic-rings-listening .mic-ring {
  animation: mic-ring-pulse 2s ease-out infinite;
}

.mic-rings-listening .mic-ring-2 { animation-delay: 0.66s; }
.mic-rings-listening .mic-ring-3 { animation-delay: 1.32s; }

@keyframes mic-ring-pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(3);
  }
}

/* The button itself */
.mic-button {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: var(--accent-blue);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms var(--ease-out);
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  z-index: 1;
}

.mic-button-idle {
  animation: mic-breathe 3s ease-in-out infinite;
}

.mic-button-idle:hover {
  transform: scale(1.05);
  box-shadow: 0 0 32px rgba(59, 130, 246, 0.4);
  animation: none;
}

.mic-button-listening {
  background: var(--accent-red);
  box-shadow: 0 0 32px rgba(239, 68, 68, 0.4);
}

.mic-button-processing {
  background: var(--bg-elevated-2);
  color: var(--text-primary);
  cursor: not-allowed;
}

.mic-button-complete {
  background: var(--accent-green);
}

@keyframes mic-breathe {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
  }
}

.mic-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mic-caption {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0;
}

.mic-timer {
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin-left: var(--space-2);
  font-variant-numeric: tabular-nums;
}
```

### 4. Mic icon SVG

```tsx
function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
```

### 5. Post-recording flow (after `complete` state)

When recording finishes and is processed, a transcript card appears below the mic with editable text and a save button. This is mostly existing logic — just ensure the new card uses `.card` and the buttons use `.btn-primary` / `.btn-secondary`.

```tsx
{state === 'complete' && (
  <section className="page-content-section">
    <div className="card">
      <h2 className="transcript-title">Transcript</h2>
      <textarea className="textarea" value={transcript} onChange={...} />
      <div className="transcript-actions">
        <button className="btn-secondary" onClick={handleRedo}>Record Again</button>
        <button className="btn-primary" onClick={handleSave}>Save to Repository</button>
      </div>
    </div>
  </section>
)}
```

## Acceptance criteria

- [ ] Page uses `PageShell` with "Voice capture" status
- [ ] "How it works" is a single horizontal compact card, not a tall vertical list
- [ ] Mic button has a subtle breathing animation in idle state
- [ ] Mic button shows expanding concentric rings while listening
- [ ] Mic button turns red while recording
- [ ] Spinner appears in mic button during processing
- [ ] Caption text updates contextually (idle / listening / processing / complete)
- [ ] Elapsed time displays in mono font while recording
- [ ] Transcript review section appears below after recording completes
- [ ] Mic respects `prefers-reduced-motion` (no breathing animation if reduced)

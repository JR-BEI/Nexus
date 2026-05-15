# 04 — Outputs Page

The Step 3 page with three tabs: **Resume**, **Cover Letter**, **Strategy Brief**. This is the deliverable page — what the user came here for. Treat the content as a finished document, not raw model output.

**Depends on:** `01-design-system.md`, `02-shared-shell.md`, `03-new-analysis.md` (reuses StepIndicator)

## Current state issues

Looking at the screenshots:

1. The resume markdown is rendered as **raw markdown** (you can see the `#`, `**`, `-` characters). Should be rendered as formatted HTML.
2. The tab switcher is flat — no active-tab indicator beyond a thin underline that doesn't slide.
3. The output container looks like a code block. Should look like a document.
4. Copy/Download buttons are floating awkwardly above the content. Should be anchored to the content card.
5. No indication of what role/company the output was tailored for.

## Goals

1. Render markdown properly — make it look like a polished document.
2. Smooth tab transition with sliding indicator.
3. Document-like content card with proper typography hierarchy.
4. Actions (Copy, Download) anchored to the card, not floating.
5. Context line showing "Tailored for [Role] at [Company]".

## Implementation

### 1. Page wrapper

```tsx
<PageShell
  titlePrefix="Tailored"
  titleAccent="Outputs"
  subtitle={`Resume, cover letter, and interview brief — ready to use.`}
  status={`For ${role} at ${company}`}
  backHref="/"
  backLabel="Back to Home"
>
  <StepIndicator currentStep={3} />
  {/* Tabs + content below */}
</PageShell>
```

### 2. Tab component with sliding indicator

Create `components/Tabs.tsx`:

```tsx
import { useRef, useEffect, useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeTab}"]`
    );
    if (!activeBtn) return;
    setIndicatorStyle({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
    });
  }, [activeTab, tabs]);

  return (
    <div className="tabs" ref={containerRef}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab-id={tab.id}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      <div
        className="tab-indicator"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
    </div>
  );
}
```

```css
.tabs {
  position: relative;
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-8);
}

.tab {
  background: none;
  border: none;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-tertiary);
  cursor: pointer;
  position: relative;
  transition: color 150ms ease;
}

.tab:hover {
  color: var(--text-secondary);
}

.tab-active {
  color: var(--text-primary);
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  height: 2px;
  background: var(--accent-blue);
  border-radius: 2px;
  transition: left 250ms var(--ease-out), width 250ms var(--ease-out);
  box-shadow: var(--glow-blue);
}
```

### 3. Document card

The container for the rendered content. Should feel like a sheet of paper, not a terminal.

```tsx
<section className="page-content-section">
  <Tabs
    tabs={[
      { id: 'resume', label: 'Resume' },
      { id: 'cover-letter', label: 'Cover Letter' },
      { id: 'strategy-brief', label: 'Strategy Brief' },
    ]}
    activeTab={activeTab}
    onChange={setActiveTab}
  />

  <article className="document-card">
    <div className="document-actions">
      <button className="btn-secondary" onClick={handleCopy}>
        {copied ? '✓ Copied' : 'Copy to Clipboard'}
      </button>
      {activeTab !== 'strategy-brief' && (
        <button className="btn-primary" onClick={handleDownload}>
          ↓ Download as PDF
        </button>
      )}
    </div>

    <div className="document-content">
      {/* Rendered markdown goes here — see section 4 */}
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  </article>

  <div className="outputs-footer">
    <button className="btn-primary" onClick={handleReanalyze}>Re-analyze</button>
    <button className="btn-secondary" onClick={handleNew}>Start New Analysis</button>
  </div>
</section>
```

```css
.document-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.document-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-elevated-2);
}

.document-content {
  padding: var(--space-12) clamp(var(--space-6), 5vw, var(--space-16));
  max-width: 80ch;
  margin: 0 auto;
}

.outputs-footer {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
}
```

### 4. Markdown rendering — the typography styles

This is where the magic happens. Style the rendered markdown to look like a polished document. Use a scoped class so it doesn't bleed into other content.

```css
.document-content {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--text-secondary);
}

/* Headings */
.document-content h1 {
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.document-content h2 {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: var(--space-8) 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.document-content h3 {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: var(--space-6) 0 var(--space-1);
}

/* The line right after an h3 — typically company/dates — gets metadata styling */
.document-content h3 + p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: 0;
  margin-bottom: var(--space-3);
}

/* Paragraphs and lists */
.document-content p {
  margin: 0 0 var(--space-4);
}

.document-content ul {
  margin: 0 0 var(--space-4);
  padding-left: var(--space-6);
}

.document-content li {
  margin-bottom: var(--space-2);
}

.document-content li::marker {
  color: var(--text-tertiary);
}

/* Strong / em */
.document-content strong {
  color: var(--text-primary);
  font-weight: var(--weight-semibold);
}

/* Contact line (first paragraph after h1) */
.document-content h1 + p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-bottom: var(--space-8);
}
```

### 5. Strategy Brief — special treatment

The Strategy Brief tab has a different content shape (interview prep with example STAR responses). It benefits from:

- Question blocks visually separated as cards
- STAR breakdown labeled clearly

This can be handled by rendering markdown normally with the typography above. The structure (`### 1. "Question..."` followed by `**Recommended Approach:**` and `**Example STAR Response:**`) naturally renders as h3 + bold paragraphs and will look clean.

If you want to go further (optional, can defer): post-process the markdown to wrap each numbered question in a `.brief-question-card` div. Skip this in the first pass.

### 6. Copy feedback

The Copy button should provide micro-feedback:

```tsx
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  await navigator.clipboard.writeText(content);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

The button text swaps from "Copy to Clipboard" → "✓ Copied" for 2 seconds.

### 7. Required dependencies

```bash
npm install react-markdown
# Optional, for GitHub-flavored markdown (tables, strikethrough)
npm install remark-gfm
```

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
```

## Acceptance criteria

- [ ] Page uses `PageShell` with dynamic "For [Role] at [Company]" status
- [ ] Step indicator shows step 3 active, steps 1 and 2 with green checks
- [ ] Tabs switch with a sliding blue indicator (not an instant snap)
- [ ] Resume markdown is rendered as formatted HTML, not raw markdown
- [ ] Cover Letter renders with proper paragraph spacing
- [ ] Strategy Brief renders with clear visual hierarchy (h2 borders, h3 spacing)
- [ ] Copy button shows "✓ Copied" feedback for 2 seconds
- [ ] Download button only appears for Resume and Cover Letter (not Strategy Brief)
- [ ] Re-analyze and Start New Analysis buttons appear below the document card
- [ ] Content max-width is ~80ch — long lines don't sprawl across full container

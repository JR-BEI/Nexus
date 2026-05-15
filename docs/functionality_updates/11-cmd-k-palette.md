# 11 — Cmd+K Command Palette

A global search and command palette. Once Nexus has data across five surfaces, the difference between "tool I open sometimes" and "tool I live in" is whether the user can navigate it without their hands leaving the keyboard.

**Depends on:** `01-data-model.md`, all entity repos populated

## The current gap

To find an old analysis, the user has to: go home → scroll Past Analyses → squint at titles → click. To open a tracker entry for a specific company: navigate to Tracker → scroll the kanban → find the card. To create a new analysis: go home → click bento card → click button. None of this is hard, but it's all *navigational thinking* that interrupts flow.

A Cmd+K palette is two keystrokes to anything.

## Goals

1. Global keyboard shortcut (`Cmd+K` / `Ctrl+K`) opens a palette from any page.
2. Search across all entities: analyses, applications, contacts, companies, strategy entries, repository entries.
3. Action commands: "New analysis", "Add to repository", "Track new application".
4. Results are grouped, ranked, keyboard-navigable.
5. Recent items appear when palette opens empty.

## Implementation

### 1. Palette component shell

```tsx
// components/CommandPalette.tsx
import { useEffect, useRef, useState } from 'react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [results, setResults] = useState<PaletteResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key === 'k';
      if (isCmdK) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (open && e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search as user types (or show recent items when empty)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = query.trim()
        ? await searchAcrossEverything(query)
        : await getRecentAndActions();
      if (!cancelled) {
        setResults(r);
        setSelectedIdx(0);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[selectedIdx];
      if (r) executeResult(r);
    }
  }

  function executeResult(r: PaletteResult) {
    setOpen(false);
    if (r.type === 'action') {
      r.execute();
    } else {
      router.push(r.href);
    }
  }

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={() => setOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-wrap">
          <span className="palette-input-icon">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Search analyses, applications, companies, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="palette-input-kbd">ESC</kbd>
        </div>

        <div className="palette-results">
          {results.length === 0 && (
            <div className="palette-empty">No matches. Try a different search.</div>
          )}
          {groupResults(results).map((group) => (
            <div key={group.label} className="palette-group">
              <div className="palette-group-label">{group.label}</div>
              {group.items.map((r) => {
                const globalIdx = results.indexOf(r);
                return (
                  <button
                    key={r.id}
                    className={`palette-row ${globalIdx === selectedIdx ? 'palette-row-active' : ''}`}
                    onMouseEnter={() => setSelectedIdx(globalIdx)}
                    onClick={() => executeResult(r)}
                  >
                    <span className="palette-row-icon">{r.icon}</span>
                    <div className="palette-row-body">
                      <div className="palette-row-title">{r.title}</div>
                      {r.subtitle && <div className="palette-row-subtitle">{r.subtitle}</div>}
                    </div>
                    {r.shortcut && <kbd className="palette-row-kbd">{r.shortcut}</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
```

### 2. Result type

```ts
export interface PaletteResult {
  id: string;
  type: 'analysis' | 'application' | 'contact' | 'company' | 'strategy' | 'repository' | 'action' | 'recent';
  group: string;          // for grouping in UI
  icon: string;
  title: string;
  subtitle?: string;
  href?: string;
  shortcut?: string;
  execute?: () => void;   // for actions
  score?: number;         // for ranking
}
```

### 3. Search across everything

```ts
// src/lib/palette-search.ts
export async function searchAcrossEverything(query: string): Promise<PaletteResult[]> {
  const q = query.toLowerCase();
  const results: PaletteResult[] = [];

  // Actions match the query directly (highest priority)
  const actions = getActions();
  for (const a of actions) {
    if (a.title.toLowerCase().includes(q) || a.keywords?.some((k) => k.includes(q))) {
      results.push({ ...a, score: 100 });
    }
  }

  // Analyses
  const analyses = await analysisRepo.list();
  for (const a of analyses) {
    const text = `${a.extracted.role} ${a.extracted.company}`.toLowerCase();
    if (text.includes(q)) {
      results.push({
        id: `analysis-${a.id}`,
        type: 'analysis',
        group: 'Analyses',
        icon: '📄',
        title: `${a.extracted.role}`,
        subtitle: `${a.extracted.company} · ${formatRelativeDate(a.createdAt)}`,
        href: `/analysis/${a.id}`,
        score: 50 + matchScore(text, q),
      });
    }
  }

  // Applications
  const apps = await applicationRepo.list();
  for (const app of apps) {
    const text = `${app.company} ${app.role} ${app.notes}`.toLowerCase();
    if (text.includes(q)) {
      results.push({
        id: `app-${app.id}`,
        type: 'application',
        group: 'Tracker',
        icon: getStatusIcon(app.status),
        title: `${app.company} — ${app.role}`,
        subtitle: trackerStatusLabel(app.status),
        href: `/tracker?app=${app.id}`,
        score: 45 + matchScore(text, q),
      });
    }
  }

  // Companies
  const companies = await companyRepo.list();
  for (const c of companies) {
    if (c.name.toLowerCase().includes(q)) {
      results.push({
        id: `company-${c.id}`,
        type: 'company',
        group: 'Target Companies',
        icon: '🏢',
        title: c.name,
        subtitle: `${c.vertical} · ${c.fit}/10 fit`,
        href: `/companies#${c.id}`,
        score: 40 + matchScore(c.name.toLowerCase(), q),
      });
    }
  }

  // Contacts
  const contacts = await contactRepo.list();
  for (const c of contacts) {
    const text = `${c.name} ${c.company || ''} ${c.role || ''}`.toLowerCase();
    if (text.includes(q)) {
      results.push({
        id: `contact-${c.id}`,
        type: 'contact',
        group: 'Contacts',
        icon: '👤',
        title: c.name,
        subtitle: c.role && c.company ? `${c.role} at ${c.company}` : c.company || c.role || '',
        href: `/tracker?tab=contacts&contact=${c.id}`,
        score: 35 + matchScore(text, q),
      });
    }
  }

  // Strategy entries
  const strategy = await loadStrategyEntries();
  for (const s of strategy) {
    if (s.name.toLowerCase().includes(q)) {
      results.push({
        id: `strategy-${s.id}`,
        type: 'strategy',
        group: 'Strategy',
        icon: '🤝',
        title: s.name,
        subtitle: s.category,
        href: `/strategy#${s.id}`,
        score: 30 + matchScore(s.name.toLowerCase(), q),
      });
    }
  }

  // Repository entries
  const repo = await repositoryRepo.list();
  for (const e of repo) {
    const text = `${e.title} ${e.company}`.toLowerCase();
    if (text.includes(q)) {
      results.push({
        id: `repo-${e.id}`,
        type: 'repository',
        group: 'Repository',
        icon: '📚',
        title: `${e.title} at ${e.company}`,
        subtitle: `${e.startDate} – ${e.endDate || 'present'}`,
        href: `/repository#${e.id}`,
        score: 25 + matchScore(text, q),
      });
    }
  }

  return results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 30);
}

function matchScore(text: string, query: string): number {
  // Prefix match scores higher than mid-string match
  if (text.startsWith(query)) return 10;
  if (text.includes(` ${query}`)) return 5;
  return 0;
}
```

### 4. Action commands

These run instead of navigating:

```ts
// src/lib/palette-actions.ts
export function getActions(): PaletteResult[] {
  return [
    {
      id: 'action-new-analysis',
      type: 'action',
      group: 'Actions',
      icon: '✨',
      title: 'New analysis',
      subtitle: 'Paste a JD to tailor a resume',
      shortcut: '⌘N',
      execute: () => router.push('/new'),
    } as any,
    {
      id: 'action-new-application',
      type: 'action',
      group: 'Actions',
      icon: '📋',
      title: 'Track new application',
      execute: () => router.push('/tracker?action=new'),
    } as any,
    {
      id: 'action-repository',
      type: 'action',
      group: 'Actions',
      icon: '📚',
      title: 'Add to repository',
      execute: () => router.push('/repository?action=add'),
    } as any,
    {
      id: 'action-companies',
      type: 'action',
      group: 'Actions',
      icon: '🎯',
      title: 'Browse target companies',
      execute: () => router.push('/companies'),
    } as any,
    {
      id: 'action-strategy',
      type: 'action',
      group: 'Actions',
      icon: '📖',
      title: 'Open strategy playbook',
      execute: () => router.push('/strategy'),
    } as any,
  ];
}
```

### 5. Empty state — recent + suggestions

When the palette opens with no query, show recent items and suggested actions:

```ts
export async function getRecentAndActions(): Promise<PaletteResult[]> {
  const items: PaletteResult[] = [];

  // Always show the top actions
  items.push(...getActions().slice(0, 4));

  // Recent analyses (last 5)
  const analyses = await analysisRepo.list();
  for (const a of analyses.slice(0, 3)) {
    items.push({
      id: `recent-analysis-${a.id}`,
      type: 'analysis',
      group: 'Recent analyses',
      icon: '📄',
      title: a.extracted.role,
      subtitle: `${a.extracted.company} · ${formatRelativeDate(a.createdAt)}`,
      href: `/analysis/${a.id}`,
    });
  }

  // Recent applications by activity (top 3 by updatedAt)
  const apps = await applicationRepo.list();
  for (const app of apps.slice(0, 3)) {
    items.push({
      id: `recent-app-${app.id}`,
      type: 'application',
      group: 'Recent applications',
      icon: getStatusIcon(app.status),
      title: `${app.company} — ${app.role}`,
      subtitle: `Updated ${formatRelativeDate(app.updatedAt)}`,
      href: `/tracker?app=${app.id}`,
    });
  }

  return items;
}
```

### 6. Styling

```css
.palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  animation: palette-overlay-in 150ms var(--ease-out);
}

@keyframes palette-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.palette {
  width: 640px;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: palette-in 200ms var(--ease-out);
}

@keyframes palette-in {
  from { opacity: 0; transform: scale(0.98) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.palette-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.palette-input-icon {
  font-size: var(--text-lg);
  color: var(--text-tertiary);
}

.palette-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: inherit;
}

.palette-input::placeholder {
  color: var(--text-tertiary);
}

.palette-input-kbd {
  font-size: 10px;
  padding: 2px var(--space-2);
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.palette-results {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.palette-empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.palette-group {
  margin-bottom: var(--space-3);
}

.palette-group-label {
  padding: var(--space-2) var(--space-3);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-tertiary);
  font-weight: var(--weight-medium);
}

.palette-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: none;
  background: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 80ms ease;
}

.palette-row-active {
  background: var(--bg-elevated-2);
}

.palette-row-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
  flex-shrink: 0;
}

.palette-row-body {
  flex: 1;
  min-width: 0;
}

.palette-row-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.palette-row-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.palette-row-kbd {
  font-size: 10px;
  padding: 2px var(--space-2);
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.palette-footer {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-5);
  border-top: 1px solid var(--border-subtle);
  font-size: 10px;
  color: var(--text-tertiary);
}

.palette-footer kbd {
  display: inline-block;
  margin-right: 4px;
  padding: 1px var(--space-1);
  background: var(--bg-elevated-2);
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}
```

### 7. Mount at app root

The palette lives at the top of the component tree so its hotkey works everywhere:

```tsx
function App() {
  return (
    <>
      <CommandPalette />
      <ToastContainer />
      <RouterOutlet />
    </>
  );
}
```

### 8. Discoverability hint

The first time a user lands on the homepage, show a small hint that fades after a few seconds (or after they use it once):

```tsx
{showHotkeyHint && (
  <div className="hotkey-hint">
    Tip: press <kbd>⌘K</kbd> to search and navigate anywhere
  </div>
)}
```

Persist dismissal in localStorage:

```ts
const KEY = 'nexus.hotkeyHintDismissed';
const [showHotkeyHint, setShowHotkeyHint] = useState(false);

useEffect(() => {
  if (!localStorage.getItem(KEY)) {
    setTimeout(() => setShowHotkeyHint(true), 2000);
  }
}, []);

// Dismiss on first palette open or after 8s
useEffect(() => {
  if (showHotkeyHint) {
    const t = setTimeout(() => {
      setShowHotkeyHint(false);
      localStorage.setItem(KEY, 'true');
    }, 8000);
    return () => clearTimeout(t);
  }
}, [showHotkeyHint]);
```

## Acceptance criteria

- [ ] `Cmd+K` / `Ctrl+K` opens the palette from any page
- [ ] `Esc` or clicking outside closes the palette
- [ ] Input is auto-focused on open
- [ ] Empty palette shows top 4 actions + recent analyses + recent applications
- [ ] Typing in the input searches across analyses, applications, contacts, companies, strategy, repository
- [ ] Results are grouped by entity type with subtle labels
- [ ] Arrow keys navigate, Enter selects, mouse hover updates selection
- [ ] Actions (e.g. "New analysis") execute their function on Enter
- [ ] Navigation results navigate via the router
- [ ] Status icons indicate application kanban column
- [ ] Hotkey hint appears once on first homepage visit; auto-dismisses

## What this unlocks

Cmd+K is the difference between Nexus feeling like a website and feeling like a tool. It's the affordance that says "this is professional software for power users." Once it exists, the navigation patterns of every other page can simplify — you don't need bento grids or breadcrumbs as much when search is one keystroke away.

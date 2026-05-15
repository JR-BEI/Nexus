'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { searchAcrossEverything } from '@/lib/palette/search'
import { getRecentAndActions } from '@/lib/palette/recent'
import type { PaletteResult } from '@/lib/palette/types'

const DEBOUNCE_MS = 120

/**
 * Global Cmd+K palette. Mounted at the app root so the hotkey works from any
 * page. Renders nothing while closed — the overlay only enters the DOM when
 * the user opens it.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PaletteResult[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Closing always clears query+selection in one render — avoids needing a
  // reset-on-open effect that would trip the no-set-state-in-effect rule.
  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSelectedIdx(0)
  }, [])

  // Global hotkey toggle.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        closePalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closePalette])

  // Focus input on open.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  // Fetch results (debounced for typing; immediate on open).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const trimmed = query.trim()
    const fetcher = trimmed
      ? () => searchAcrossEverything(trimmed)
      : () => getRecentAndActions()
    const handle = setTimeout(() => {
      fetcher().then((r) => {
        if (!cancelled) {
          setResults(r)
          setSelectedIdx(0)
        }
      })
    }, trimmed ? DEBOUNCE_MS : 0)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [open, query])

  const execute = useCallback(
    (r: PaletteResult) => {
      closePalette()
      if (r.execute) {
        r.execute()
      } else if (r.href) {
        router.push(r.href)
      }
    },
    [router, closePalette]
  )

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[selectedIdx]
      if (r) execute(r)
    }
  }

  // Group preserving result order.
  const grouped = useMemo(() => {
    const groups: { label: string; items: PaletteResult[] }[] = []
    const indexByLabel = new Map<string, number>()
    for (const r of results) {
      const idx = indexByLabel.get(r.group)
      if (idx === undefined) {
        indexByLabel.set(r.group, groups.length)
        groups.push({ label: r.group, items: [r] })
      } else {
        groups[idx].items.push(r)
      }
    }
    return groups
  }, [results])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-[4px] flex justify-center pt-[12vh] animate-in fade-in duration-150"
      onClick={closePalette}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-[640px] max-w-[calc(100vw-32px)] max-h-[70vh] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[0_24px_64px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <Search className="size-4 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search analyses, applications, companies, or type a command..."
            className="flex-1 bg-transparent outline-none text-[var(--text-primary)] text-base placeholder:text-[var(--text-tertiary)]"
          />
          <kbd className="text-[10px] px-2 py-0.5 bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-tertiary)] font-mono">
            ESC
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-8 py-10 text-center text-sm text-[var(--text-tertiary)]">
              {query.trim() ? 'No matches. Try a different search.' : 'Loading…'}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="mb-3 last:mb-0">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">
                  {group.label}
                </div>
                {group.items.map((r) => {
                  const globalIdx = results.indexOf(r)
                  const active = globalIdx === selectedIdx
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onMouseEnter={() => setSelectedIdx(globalIdx)}
                      onClick={() => execute(r)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-colors ${
                        active ? 'bg-[var(--bg-elevated-2)]' : 'hover:bg-[var(--bg-elevated-2)]/60'
                      }`}
                    >
                      <span className="w-6 h-6 flex items-center justify-center text-base shrink-0">
                        {r.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-[var(--text-primary)] truncate">
                          {r.title}
                        </span>
                        {r.subtitle && (
                          <span className="block text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                            {r.subtitle}
                          </span>
                        )}
                      </span>
                      {r.shortcut && (
                        <kbd className="text-[10px] px-2 py-0.5 bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-mono shrink-0">
                          {r.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 px-5 py-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)]">
          <PaletteHint k="↑↓" label="navigate" />
          <PaletteHint k="↵" label="select" />
          <PaletteHint k="esc" label="close" />
        </div>
      </div>
    </div>
  )
}

function PaletteHint({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="px-1 py-px bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] rounded-[2px] text-[var(--text-secondary)] font-mono">
        {k}
      </kbd>
      <span>{label}</span>
    </span>
  )
}

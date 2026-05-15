'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { RepositoryEntry } from '@/types/nexus'

interface Props {
  entries: RepositoryEntry[]
  selectedIds: Set<string>
  onChange: (ids: Set<string>) => void
  tokenEstimate?: number
}

const TOKEN_WARN_THRESHOLD = 8000

export function ContextPreview({ entries, selectedIds, onChange, tokenEstimate }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 text-center flex flex-col items-center gap-3">
        <BookOpen className="size-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
        <p className="text-sm text-[var(--text-secondary)]">
          You haven&apos;t added any work history yet.
        </p>
        <Link
          href="/build"
          className="text-sm text-[var(--accent-blue)] hover:underline"
        >
          + Add to Repository
        </Link>
      </div>
    )
  }

  const toggleEntry = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  const selectAll = () => onChange(new Set(entries.map((e) => e.id)))
  const clearAll = () => onChange(new Set())

  const overBudget = (tokenEstimate ?? 0) > TOKEN_WARN_THRESHOLD

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span>
          <strong className="text-[var(--text-primary)]">{selectedIds.size}</strong>{' '}
          of <strong className="text-[var(--text-primary)]">{entries.length}</strong>{' '}
          repository entries will be sent as context
        </span>
        {expanded ? (
          <ChevronDown className="size-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronRight className="size-4 text-[var(--text-tertiary)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Uncheck entries you don&apos;t want emphasized for this role.</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={selectAll}
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {overBudget && (
            <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <span>
                Context is large (~{tokenEstimate?.toLocaleString()} tokens). Consider
                trimming entries that aren&apos;t relevant to focus the model.
              </span>
            </div>
          )}

          <ul className="space-y-1">
            {entries.map((e) => (
              <li key={e.id}>
                <label className="flex items-start gap-3 px-2 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated-2)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(e.id)}
                    onChange={() => toggleEntry(e.id)}
                    className="mt-1 accent-[var(--accent-blue)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text-primary)] font-medium truncate">
                      {e.title} · {e.company}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {e.startDate} – {e.endDate || 'present'} ·{' '}
                      {e.impactStatements.length} impact statement
                      {e.impactStatements.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

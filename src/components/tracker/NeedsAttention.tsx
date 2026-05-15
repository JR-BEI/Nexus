'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStaleness, trackerStatusLabel } from '@/lib/staleness'
import type { TrackerApplication } from '@/types/nexus'

interface Props {
  applications: TrackerApplication[]
  onLog: (app: TrackerApplication) => void
  onOpen: (app: TrackerApplication) => void
}

const SHOW_INITIAL = 5

export function NeedsAttention({ applications, onLog, onOpen }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const stale = useMemo(() => {
    return applications
      .map((app) => ({ app, staleness: getStaleness(app) }))
      .filter(({ staleness }) => staleness.level !== 'fresh')
      .sort((a, b) => b.staleness.daysSinceActivity - a.staleness.daysSinceActivity)
  }, [applications])

  if (dismissed || stale.length === 0) return null

  const visible = showAll ? stale : stale.slice(0, SHOW_INITIAL)

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
          Needs attention
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 bg-amber-500 text-black rounded-full text-xs font-bold tabular-nums">
            {stale.length}
          </span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          aria-label="Hide needs-attention"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map(({ app, staleness }) => (
          <div
            key={app.id}
            className={`flex items-center justify-between gap-4 px-3 py-2.5 rounded-[var(--radius-md)] border bg-[var(--bg-elevated-2)] ${
              staleness.level === 'stale'
                ? 'border-l-[3px] border-l-red-500 border-[var(--border-subtle)]'
                : 'border-l-[3px] border-l-amber-500 border-[var(--border-subtle)]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[var(--text-primary)]">
                <strong>{app.company}</strong> · {app.role}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                <AlertTriangle className="inline size-3 -mt-0.5 mr-1" />
                {staleness.daysSinceActivity} days in{' '}
                <em>{trackerStatusLabel(app.status)}</em>
                {staleness.suggestedAction ? ` — ${staleness.suggestedAction}` : ''}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => onLog(app)}>
                + Log activity
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpen(app)}>
                Open
              </Button>
            </div>
          </div>
        ))}

        {!showAll && stale.length > SHOW_INITIAL && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] py-2"
          >
            Show {stale.length - SHOW_INITIAL} more
          </button>
        )}
      </div>
    </section>
  )
}

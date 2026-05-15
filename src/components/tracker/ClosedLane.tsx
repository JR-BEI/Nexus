'use client'

import { useState } from 'react'
import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/format'
import type { TrackerApplication } from '@/types/nexus'

type ClosedFilter = 'all' | 'rejected' | 'on-hold'

interface Props {
  items: TrackerApplication[]
  expanded: boolean
  onToggle: () => void
  onReopen: (app: TrackerApplication) => void
  onOpen: (app: TrackerApplication) => void
}

/**
 * The slim "Closed" tile that takes the place of the Rejected + On-hold
 * columns. Click to expand into a horizontal list rendered separately.
 */
export function ClosedColumn({ items, expanded, onToggle }: Pick<Props, 'items' | 'expanded' | 'onToggle'>) {
  const rejected = items.filter((a) => a.status === 'rejected').length
  const onHold = items.filter((a) => a.status === 'on-hold').length

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="kanban-column flex flex-col justify-between gap-3 min-h-[160px] text-left bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated-2)] transition-colors p-4 rounded-[var(--radius-lg)]"
      style={{ '--col-color': 'var(--border-default)' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
        <Archive className="size-4" strokeWidth={1.5} />
        Closed
      </div>
      <div className="flex flex-col gap-1 text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-red-500" />
          <span>{rejected} rejected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>{onHold} on hold</span>
        </div>
      </div>
      <div className="text-xs text-[var(--text-tertiary)] opacity-60">
        {expanded ? 'Click to collapse' : 'Click to expand'}
      </div>
    </button>
  )
}

/**
 * The expanded horizontal list of closed apps, rendered below the kanban.
 */
export function ClosedExpanded({ items, onReopen, onOpen, onToggle }: Omit<Props, 'expanded'>) {
  const [filter, setFilter] = useState<ClosedFilter>('all')
  const filtered = filter === 'all' ? items : items.filter((a) => a.status === filter)
  const rejectedCount = items.filter((a) => a.status === 'rejected').length
  const onHoldCount = items.filter((a) => a.status === 'on-hold').length

  return (
    <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Closed</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All ({items.length})
          </FilterChip>
          <FilterChip active={filter === 'rejected'} onClick={() => setFilter('rejected')}>
            Rejected ({rejectedCount})
          </FilterChip>
          <FilterChip active={filter === 'on-hold'} onClick={() => setFilter('on-hold')}>
            On hold ({onHoldCount})
          </FilterChip>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            Collapse
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No closed items in this view.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="grid grid-cols-[8px_1fr_2fr_auto_auto] gap-3 items-center px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated-2)] text-sm"
            >
              <span
                className={`size-2 rounded-full ${app.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}
              />
              <strong
                className="text-[var(--text-primary)] font-medium truncate cursor-pointer"
                onClick={() => onOpen(app)}
              >
                {app.company}
              </strong>
              <span className="text-[var(--text-secondary)] truncate">{app.role}</span>
              <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
                {formatRelativeDate(app.updatedAt)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => onReopen(app)}>
                Reopen
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
        active
          ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
          : 'bg-[var(--bg-elevated-2)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
      }`}
    >
      {children}
    </button>
  )
}

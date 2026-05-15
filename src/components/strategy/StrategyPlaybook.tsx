'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  groupByCategory,
  loadMergedStrategyEntries,
  upsertStrategyState,
  type MergedStrategyEntry,
} from '@/lib/strategy'
import { newStrategyId } from '@/lib/id'
import { formatRelativeDate } from '@/lib/format'
import type { StrategyContact, StrategyStatus } from '@/types/nexus'

type FilterKey = 'all' | 'actionable' | StrategyStatus

const STATUS_OPTIONS: { id: StrategyStatus; label: string; color: string }[] = [
  { id: 'not_contacted', label: 'Not contacted', color: 'var(--text-tertiary)' },
  { id: 'reached_out', label: 'Reached out', color: 'var(--accent-blue)' },
  { id: 'in_conversation', label: 'In conversation', color: 'var(--accent-amber)' },
  { id: 'no_response', label: 'No response', color: 'var(--accent-red)' },
  { id: 'passed', label: 'Passed', color: 'var(--text-tertiary)' },
]

const STATUS_BORDER: Record<StrategyStatus, string> = {
  not_contacted: 'border-l-[var(--border-subtle)]',
  reached_out: 'border-l-[var(--accent-blue)]',
  in_conversation: 'border-l-amber-500',
  no_response: 'border-l-red-500',
  passed: 'border-l-[var(--text-tertiary)]',
}

export function StrategyPlaybook() {
  const [entries, setEntries] = useState<MergedStrategyEntry[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [adding, setAdding] = useState<{ category: string } | null>(null)

  const refresh = async () => {
    const all = await loadMergedStrategyEntries()
    setEntries(all)
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return entries
    if (filter === 'actionable') {
      return entries.filter(
        (e) => e.status === 'not_contacted' || e.status === 'in_conversation'
      )
    }
    return entries.filter((e) => e.status === filter)
  }, [entries, filter])

  const actionableCount = useMemo(
    () =>
      entries.filter(
        (e) => e.status === 'not_contacted' || e.status === 'in_conversation'
      ).length,
    [entries]
  )

  const groups = useMemo(() => groupByCategory(filtered), [filtered])

  const handleUpdate = async (next: MergedStrategyEntry) => {
    await upsertStrategyState(next)
    await refresh()
  }

  const handleAddCustom = async (data: {
    name: string
    category: string
    type: StrategyContact['type']
    description?: string
  }) => {
    const next: MergedStrategyEntry = {
      id: newStrategyId(),
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description,
      status: 'not_contacted',
      customAdded: true,
    }
    await upsertStrategyState(next)
    setAdding(null)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({entries.length})
        </FilterChip>
        <FilterChip
          active={filter === 'actionable'}
          onClick={() => setFilter('actionable')}
        >
          Actionable ({actionableCount})
        </FilterChip>
        <FilterChip
          active={filter === 'reached_out'}
          onClick={() => setFilter('reached_out')}
        >
          Reached out
        </FilterChip>
        <FilterChip
          active={filter === 'in_conversation'}
          onClick={() => setFilter('in_conversation')}
        >
          In conversation
        </FilterChip>
        <FilterChip active={filter === 'passed'} onClick={() => setFilter('passed')}>
          Passed
        </FilterChip>
      </div>

      {groups.map((g) => (
        <section key={g.label} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3
              id={slugifyCategory(g.label)}
              className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
            >
              {g.label}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setAdding({ category: g.label })}>
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {g.items.map((e) => (
              <EntryRow key={e.id} entry={e} onUpdate={handleUpdate} />
            ))}
          </div>
        </section>
      ))}

      <AddCustomEntryModal
        open={adding !== null}
        category={adding?.category ?? ''}
        onCancel={() => setAdding(null)}
        onConfirm={handleAddCustom}
      />
    </div>
  )
}

// =========================
// Row component
// =========================
function EntryRow({
  entry,
  onUpdate,
}: {
  entry: MergedStrategyEntry
  onUpdate: (next: MergedStrategyEntry) => void
}) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(entry.userNotes ?? '')

  return (
    <article
      className={`rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 border-l-[3px] ${STATUS_BORDER[entry.status]} ${entry.status === 'passed' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            {entry.name}
            {entry.customAdded && (
              <span className="px-1.5 py-px rounded-[var(--radius-sm)] text-[10px] font-medium bg-purple-500/15 text-purple-300">
                Custom
              </span>
            )}
          </h4>
          {entry.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              {entry.description}
            </p>
          )}
          {entry.priority === 'highest' && (
            <p className="text-[11px] text-amber-400 font-medium mt-1.5">
              ★ Highest priority for this domain
            </p>
          )}
          {entry.lastContactedAt && (
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
              Last touched {formatRelativeDate(entry.lastContactedAt)}
            </p>
          )}
        </div>
        <StatusPicker
          status={entry.status}
          onChange={(status) =>
            onUpdate({
              ...entry,
              status,
              lastContactedAt:
                status !== 'not_contacted' ? Date.now() : entry.lastContactedAt,
            })
          }
        />
      </div>

      {!editingNotes && entry.userNotes && (
        <button
          type="button"
          onClick={() => {
            setNotesDraft(entry.userNotes ?? '')
            setEditingNotes(true)
          }}
          className="mt-2 w-full text-left text-xs text-[var(--text-secondary)] italic px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          {entry.userNotes}
        </button>
      )}

      {editingNotes && (
        <div className="mt-2 space-y-2">
          <Textarea
            rows={2}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Your notes (e.g. 'Reached out 11/4 to Susan, no response yet')"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNotesDraft(entry.userNotes ?? '')
                setEditingNotes(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onUpdate({ ...entry, userNotes: notesDraft.trim() || undefined })
                setEditingNotes(false)
              }}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {!editingNotes && !entry.userNotes && (
        <button
          type="button"
          onClick={() => setEditingNotes(true)}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] mt-2"
        >
          + Add note
        </button>
      )}
    </article>
  )
}

function StatusPicker({
  status,
  onChange,
}: {
  status: StrategyStatus
  onChange: (s: StrategyStatus) => void
}) {
  const current = STATUS_OPTIONS.find((o) => o.id === status)!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-transparent shrink-0"
          style={{ color: current.color, borderColor: current.color }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: current.color }}
          />
          {current.label}
          <ChevronDown className="size-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {STATUS_OPTIONS.map((o) => (
          <DropdownMenuItem key={o.id} onSelect={() => onChange(o.id)}>
            <span
              className="size-1.5 rounded-full mr-2 inline-block"
              style={{ background: o.color }}
            />
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
      }`}
    >
      {children}
    </button>
  )
}

function AddCustomEntryModal({
  open,
  category,
  onCancel,
  onConfirm,
}: {
  open: boolean
  category: string
  onCancel: () => void
  onConfirm: (data: {
    name: string
    category: string
    type: StrategyContact['type']
    description?: string
  }) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<StrategyContact['type']>('recruiter')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setType('recruiter')
      setDescription('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Category
            </label>
            <Input value={category} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Type
            </label>
            <Select value={type} onValueChange={(v) => setType(v as StrategyContact['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="board">Job board</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="association">Association</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Description (optional)
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                name: name.trim(),
                category,
                type,
                description: description.trim() || undefined,
              })
            }
            disabled={!name.trim()}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function slugifyCategory(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

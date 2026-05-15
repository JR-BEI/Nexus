'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Calendar, FileText, Lightbulb, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applicationRepo } from '@/lib/repos/applicationRepo'
import { contactRepo } from '@/lib/repos/contactRepo'
import { analysisRepo } from '@/lib/repos/analysisRepo'
import { newApplicationId, newEventId } from '@/lib/id'
import { searchApplications, type SearchableApp } from '@/lib/search'
import { getLastActivityAt, getStaleness, trackerStatusLabel } from '@/lib/staleness'
import { formatRelativeDate } from '@/lib/format'
import type {
  Analysis,
  ApplicationStatus,
  TrackerApplication,
  TrackerContact,
} from '@/types/nexus'
import { NeedsAttention } from './NeedsAttention'
import { LogActivityModal } from './LogActivityModal'
import { ClosedColumn, ClosedExpanded } from './ClosedLane'

const DRAG_HINT_KEY = 'nexus.tracker.dragHintDismissed'

const ACTIVE_COLUMNS: { id: ApplicationStatus; label: string; hex: string }[] = [
  { id: 'interested', label: 'Interested', hex: '#6366F1' },
  { id: 'applied', label: 'Applied', hex: '#3B82F6' },
  { id: 'screening', label: 'Screening', hex: '#14B8A6' },
  { id: 'interviewing', label: 'Interviewing', hex: '#A855F7' },
  { id: 'offer', label: 'Offer', hex: '#10B981' },
]

const CLOSED_STATUSES: ApplicationStatus[] = ['rejected', 'on-hold']

interface SeedApp {
  company?: string
  role?: string
  source?: string
}

interface Props {
  seedNew?: SeedApp | null
  onSeedConsumed?: () => void
  /** Application id to auto-open from a query param. */
  openAppId?: string | null
  onOpenConsumed?: () => void
}

export default function ApplicationsBoard({
  seedNew,
  onSeedConsumed,
  openAppId,
  onOpenConsumed,
}: Props) {
  const [apps, setApps] = useState<TrackerApplication[]>([])
  const [contacts, setContacts] = useState<TrackerContact[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('')
  const [searchResults, setSearchResults] = useState<SearchableApp[] | null>(null)
  const [editing, setEditing] = useState<TrackerApplication | null>(null)
  const [creating, setCreating] = useState<SeedApp | null>(null)
  const [logTarget, setLogTarget] = useState<TrackerApplication | null>(null)
  const [closedExpanded, setClosedExpanded] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hintDismissed, setHintDismissed] = useState(true)

  // Initial load.
  useEffect(() => {
    Promise.all([applicationRepo.list(), contactRepo.list(), analysisRepo.list()]).then(
      ([a, c, an]) => {
        setApps(a)
        setContacts(c)
        setAnalyses(an)
        setLoaded(true)
      }
    )
    try {
      setHintDismissed(window.localStorage.getItem(DRAG_HINT_KEY) === '1')
    } catch {
      // ignore
    }
  }, [])

  // Honor ?new_app=1&company=...&source=... from the Companies page.
  useEffect(() => {
    if (seedNew && loaded) {
      setCreating(seedNew)
      onSeedConsumed?.()
    }
  }, [seedNew, loaded, onSeedConsumed])

  // Honor ?app=<id> from anywhere.
  useEffect(() => {
    if (!openAppId || !loaded) return
    const found = apps.find((a) => a.id === openAppId)
    if (found) {
      setEditing(found)
      onOpenConsumed?.()
    }
  }, [openAppId, loaded, apps, onOpenConsumed])

  // Re-run search whenever filter or apps change.
  useEffect(() => {
    if (!filter.trim()) {
      setSearchResults(null)
      return
    }
    let cancelled = false
    searchApplications(filter, apps).then((results) => {
      if (!cancelled) setSearchResults(results)
    })
    return () => {
      cancelled = true
    }
  }, [filter, apps])

  const dismissHint = () => {
    setHintDismissed(true)
    try {
      window.localStorage.setItem(DRAG_HINT_KEY, '1')
    } catch {
      // ignore
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // Match info for badge rendering. Empty when no search.
  const matchInfo = useMemo(() => {
    const map = new Map<string, string[]>()
    if (searchResults) {
      for (const r of searchResults) map.set(r.app.id, r.matchedFields)
    }
    return map
  }, [searchResults])

  // Visible apps: filtered (only matching) when searching, else all.
  const visibleApps = useMemo(() => {
    if (!searchResults) return apps
    const ids = new Set(searchResults.map((r) => r.app.id))
    return apps.filter((a) => ids.has(a.id))
  }, [apps, searchResults])

  const grouped = useMemo(() => {
    const map: Record<ApplicationStatus, TrackerApplication[]> = {
      interested: [],
      applied: [],
      screening: [],
      interviewing: [],
      offer: [],
      rejected: [],
      'on-hold': [],
    }
    for (const a of visibleApps) map[a.status]?.push(a)
    return map
  }, [visibleApps])

  const closedApps = useMemo(
    () => visibleApps.filter((a) => CLOSED_STATUSES.includes(a.status)),
    [visibleApps]
  )

  const upsertLocal = useCallback((next: TrackerApplication) => {
    setApps((prev) => {
      const idx = prev.findIndex((a) => a.id === next.id)
      const out = idx >= 0 ? [...prev.slice(0, idx), next, ...prev.slice(idx + 1)] : [next, ...prev]
      return out.sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }, [])

  const removeLocal = useCallback((id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const moveStatus = useCallback(
    async (id: string, toStatus: ApplicationStatus) => {
      const app = apps.find((a) => a.id === id)
      if (!app || app.status === toStatus) return
      const next: TrackerApplication = {
        ...app,
        status: toStatus,
        events: [
          ...app.events,
          {
            id: newEventId(),
            at: Date.now(),
            type: 'status_change',
            fromStatus: app.status,
            toStatus,
          },
        ],
      }
      await applicationRepo.save(next)
      upsertLocal(next)
    },
    [apps, upsertLocal]
  )

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const id = String(e.active.id)
    const target = e.over?.id ? String(e.over.id) : null
    if (!target) return
    const allStatuses: ApplicationStatus[] = [
      ...ACTIVE_COLUMNS.map((c) => c.id),
      ...CLOSED_STATUSES,
    ]
    if (!allStatuses.includes(target as ApplicationStatus)) return
    moveStatus(id, target as ApplicationStatus)
  }

  const refreshAfterModal = (saved: TrackerApplication | null) => {
    if (saved) upsertLocal(saved)
    setEditing(null)
    setCreating(null)
  }

  const activeApp = activeId ? apps.find((a) => a.id === activeId) ?? null : null

  if (!loaded) return <div className="text-neutral-500 text-sm">Loading…</div>

  return (
    <div>
      <NeedsAttention
        applications={apps}
        onLog={setLogTarget}
        onOpen={setEditing}
      />

      <div className="tracker-toolbar">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search company, role, notes, contacts, JD…"
          className="flex-1 min-w-[200px]"
        />
        <Button onClick={() => setCreating({})}>
          <Plus className="size-4 mr-1" />
          New Application
        </Button>
      </div>

      {!hintDismissed && (
        <div className="tracker-hint">
          <Lightbulb className="size-3.5" />
          Drag cards between columns to change status
          <button
            className="tracker-hint-close"
            onClick={dismissHint}
            aria-label="Dismiss hint"
          >
            ×
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="kanban">
          {ACTIVE_COLUMNS.map((col) => (
            <Column
              key={col.id}
              status={col.id}
              label={col.label}
              hex={col.hex}
              apps={grouped[col.id]}
              matchInfo={matchInfo}
              onCardClick={setEditing}
            />
          ))}
          <ClosedColumn
            items={closedApps}
            expanded={closedExpanded}
            onToggle={() => setClosedExpanded((v) => !v)}
          />
        </div>
        <DragOverlay>
          {activeApp ? (
            <Card app={activeApp} matched={matchInfo.get(activeApp.id) ?? []} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {closedExpanded && (
        <ClosedExpanded
          items={closedApps}
          onToggle={() => setClosedExpanded(false)}
          onReopen={(app) => moveStatus(app.id, 'interested')}
          onOpen={setEditing}
        />
      )}

      {(creating !== null || editing !== null) && (
        <ApplicationModal
          initial={editing ?? buildBlank(creating ?? undefined)}
          isEdit={editing !== null}
          contacts={contacts}
          analyses={analyses}
          onClose={() => {
            setEditing(null)
            setCreating(null)
          }}
          onSaved={refreshAfterModal}
          onDelete={
            editing
              ? async () => {
                  await applicationRepo.delete(editing.id)
                  removeLocal(editing.id)
                  setEditing(null)
                }
              : undefined
          }
        />
      )}

      <LogActivityModal
        open={logTarget !== null}
        app={logTarget}
        onClose={() => setLogTarget(null)}
        onLogged={(updated) => {
          upsertLocal(updated)
          setLogTarget(null)
        }}
      />
    </div>
  )
}

function buildBlank(seed?: SeedApp): TrackerApplication {
  const now = Date.now()
  return {
    id: newApplicationId(),
    createdAt: now,
    updatedAt: now,
    company: seed?.company ?? '',
    role: seed?.role ?? '',
    status: 'interested',
    source: seed?.source || undefined,
    linkedContactIds: [],
    events: [],
    notes: '',
  }
}

function Column({
  status,
  label,
  hex,
  apps,
  matchInfo,
  onCardClick,
}: {
  status: ApplicationStatus
  label: string
  hex: string
  apps: TrackerApplication[]
  matchInfo: Map<string, string[]>
  onCardClick: (a: TrackerApplication) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      style={{ '--col-color': hex } as React.CSSProperties}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
    >
      <div className="kanban-column-header">
        <span className="kanban-pill">{label}</span>
        <span className="kanban-count">{apps.length}</span>
      </div>
      <div className="kanban-column-body">
        {apps.map((a) => (
          <DraggableCard
            key={a.id}
            app={a}
            matched={matchInfo.get(a.id) ?? []}
            onClick={() => onCardClick(a)}
          />
        ))}
        {apps.length === 0 && <div className="kanban-empty">drop here</div>}
      </div>
    </div>
  )
}

function DraggableCard({
  app,
  matched,
  onClick,
}: {
  app: TrackerApplication
  matched: string[]
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? 'opacity-30' : ''}>
      <Card app={app} matched={matched} onClick={onClick} />
    </div>
  )
}

function Card({
  app,
  matched,
  onClick,
  dragging,
}: {
  app: TrackerApplication
  matched: string[]
  onClick?: () => void
  dragging?: boolean
}) {
  const linkedContactCount = app.linkedContactIds.length
  const lastAt = getLastActivityAt(app)
  const stale = getStaleness(app)
  return (
    <div
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`kanban-card ${dragging ? 'rotate-2 shadow-xl' : ''}`}
      role="button"
    >
      <div className="kanban-card-company truncate">{app.company || '—'}</div>
      <div className="kanban-card-role truncate">{app.role || '—'}</div>
      {app.source && <div className="kanban-card-meta truncate">via {app.source}</div>}

      {(linkedContactCount > 0 || app.linkedAnalysisId) && (
        <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-[var(--text-tertiary)]">
          {linkedContactCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" /> {linkedContactCount}
            </span>
          )}
          {app.linkedAnalysisId && (
            <a
              href={`/analyze?id=${app.linkedAnalysisId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[var(--accent-blue)] hover:underline"
            >
              <FileText className="size-3" />
              Resume
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums inline-flex items-center gap-1">
          <Calendar className="size-3" />
          {formatRelativeDate(lastAt)}
        </span>
        {stale.level !== 'fresh' && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-px rounded-[var(--radius-sm)] tabular-nums border ${
              stale.level === 'warning'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-red-500/10 text-red-300 border-red-500/30'
            }`}
          >
            {stale.level === 'warning' ? '⚠' : '🔔'} {stale.daysSinceActivity}d
          </span>
        )}
      </div>

      {matched.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {matched.map((f) => (
            <span
              key={f}
              className="text-[10px] px-1.5 py-px rounded-[var(--radius-sm)] bg-amber-500/15 text-amber-300"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// =========================
// Application Create/Edit Modal
// =========================
function ApplicationModal({
  initial,
  isEdit,
  contacts,
  analyses,
  onClose,
  onSaved,
  onDelete,
}: {
  initial: TrackerApplication
  isEdit: boolean
  contacts: TrackerContact[]
  analyses: Analysis[]
  onClose: () => void
  onSaved: (saved: TrackerApplication) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    company: initial.company,
    role: initial.role,
    status: initial.status,
    source: initial.source ?? '',
    linkedAnalysisId: initial.linkedAnalysisId ?? '',
    linkedContactIds: initial.linkedContactIds,
    notes: initial.notes,
  })

  const toggleContact = (id: string) => {
    setForm((f) => ({
      ...f,
      linkedContactIds: f.linkedContactIds.includes(id)
        ? f.linkedContactIds.filter((c) => c !== id)
        : [...f.linkedContactIds, id],
    }))
  }

  const handleSave = async () => {
    if (!form.company.trim() || !form.role.trim()) return
    const events = [...initial.events]
    if (form.status !== initial.status) {
      events.push({
        id: newEventId(),
        at: Date.now(),
        type: 'status_change',
        fromStatus: initial.status,
        toStatus: form.status,
      })
    }
    const next: TrackerApplication = {
      ...initial,
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      source: form.source.trim() || undefined,
      linkedAnalysisId: form.linkedAnalysisId || undefined,
      linkedContactIds: form.linkedContactIds,
      notes: form.notes,
      events,
    }
    await applicationRepo.save(next)
    onSaved(next)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit application' : 'New application'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company *">
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </Field>
          <Field label="Role *">
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as ApplicationStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...ACTIVE_COLUMNS, ...CLOSED_STATUSES.map((id) => ({ id, label: trackerStatusLabel(id), hex: '' }))].map(
                  (opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Source">
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="LinkedIn, Referral, Recruiter…"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Linked analysis">
              <Select
                value={form.linkedAnalysisId || 'none'}
                onValueChange={(v) => setForm({ ...form, linkedAnalysisId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {analyses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.extracted.role || '(untitled)'} · {a.extracted.company || 'unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Linked contacts ({form.linkedContactIds.length})
            </label>
            {contacts.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] italic">
                Add contacts in the Contacts tab to link them here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                {contacts.map((c) => {
                  const on = form.linkedContactIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleContact(c.id)}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        on
                          ? 'bg-blue-600 text-white'
                          : 'bg-[var(--bg-elevated-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {c.name}
                      {c.company ? ` · ${c.company}` : ''}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          {onDelete && (
            <Button
              variant="ghost"
              className="mr-auto text-red-400 hover:text-red-300"
              onClick={() => {
                if (confirm('Delete this application?')) onDelete()
              }}
            >
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">{label}</label>
      {children}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
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
import {
  APPLICATION_STATUSES,
  useApplications,
  useAppointments,
  useContacts,
  useAnalyses,
} from '@/lib/tracker'
import { Calendar, FileText, Lightbulb, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Application, ApplicationStatus, Appointment, Contact, Analysis } from '@/types'

const DRAG_HINT_KEY = 'nexus.tracker.dragHintDismissed'

const blankApp = (): Omit<Application, 'id' | 'created_at' | 'updated_at'> => ({
  company: '',
  role: '',
  status: 'interested',
  applied_date: null,
  jd_url: '',
  source: '',
  salary_target: '',
  contact_ids: [],
  notes: '',
})

interface Props {
  seedNew?: Partial<Application> | null
  onSeedConsumed?: () => void
}

export default function ApplicationsBoard({ seedNew, onSeedConsumed }: Props) {
  const apps = useApplications()
  const { items: contacts } = useContacts()
  const { items: appointments } = useAppointments()
  const analyses = useAnalyses()

  const [editing, setEditing] = useState<Application | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [seedData, setSeedData] = useState<Partial<Application> | null>(null)
  const [filter, setFilter] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hintDismissed, setHintDismissed] = useState(true)

  useEffect(() => {
    try {
      setHintDismissed(localStorage.getItem(DRAG_HINT_KEY) === '1')
    } catch {
      // ignore
    }
  }, [])

  const dismissHint = () => {
    setHintDismissed(true)
    try {
      localStorage.setItem(DRAG_HINT_KEY, '1')
    } catch {
      // ignore
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    if (seedNew && apps.loaded) {
      setSeedData(seedNew)
      setShowNew(true)
      onSeedConsumed?.()
    }
  }, [seedNew, apps.loaded, onSeedConsumed])

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const map: Record<ApplicationStatus, Application[]> = {
      interested: [], applied: [], screening: [], interviewing: [], offer: [], rejected: [], on_hold: [],
    }
    for (const a of apps.items) {
      if (q) {
        const hay = `${a.company} ${a.role} ${a.source} ${a.notes}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      map[a.status]?.push(a)
    }
    return map
  }, [apps.items, filter])

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const id = String(e.active.id)
    const target = e.over?.id ? String(e.over.id) : null
    if (!target) return
    const validStatuses = APPLICATION_STATUSES.map((s) => s.value)
    if (!validStatuses.includes(target as ApplicationStatus)) return
    const app = apps.items.find((a) => a.id === id)
    if (!app || app.status === target) return
    apps.update(id, { status: target as ApplicationStatus })
  }

  const activeApp = activeId ? apps.items.find((a) => a.id === activeId) ?? null : null

  if (!apps.loaded) return <div className="text-neutral-500 text-sm">Loading…</div>

  return (
    <div>
      <div className="tracker-toolbar">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by company, role, source…"
          className="flex-1 min-w-[200px]"
        />
        <Button onClick={() => { setSeedData(null); setShowNew(true) }}>
          + New Application
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="kanban">
          {APPLICATION_STATUSES.map((s) => (
            <Column
              key={s.value}
              status={s.value}
              label={s.label}
              hex={s.hex}
              apps={grouped[s.value]}
              appointments={appointments}
              contacts={contacts}
              onCardClick={setEditing}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApp ? (
            <Card app={activeApp} appointments={appointments} contacts={contacts} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {(showNew || editing) && (
        <ApplicationModal
          initial={editing ?? { ...blankApp(), ...(seedData ?? {}) }}
          contacts={contacts}
          analyses={analyses}
          linkedAppointments={editing ? appointments.filter((ap) => ap.application_id === editing.id) : []}
          onClose={() => { setShowNew(false); setEditing(null); setSeedData(null) }}
          onSave={(data) => {
            if (editing) apps.update(editing.id, data)
            else apps.create(data)
            setShowNew(false); setEditing(null); setSeedData(null)
          }}
          onDelete={editing ? () => { apps.remove(editing.id); setEditing(null) } : undefined}
        />
      )}
    </div>
  )
}

function Column({
  status, label, hex, apps, appointments, contacts, onCardClick,
}: {
  status: ApplicationStatus
  label: string
  hex: string
  apps: Application[]
  appointments: Appointment[]
  contacts: Contact[]
  onCardClick: (a: Application) => void
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
          <DraggableCard key={a.id} app={a} appointments={appointments} contacts={contacts} onClick={() => onCardClick(a)} />
        ))}
        {apps.length === 0 && <div className="kanban-empty">drop here</div>}
      </div>
    </div>
  )
}

function DraggableCard({
  app, appointments, contacts, onClick,
}: { app: Application; appointments: Appointment[]; contacts: Contact[]; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? 'opacity-30' : ''}>
      <Card app={app} appointments={appointments} contacts={contacts} onClick={onClick} />
    </div>
  )
}

function Card({
  app, appointments, contacts, onClick, dragging,
}: { app: Application; appointments: Appointment[]; contacts: Contact[]; onClick?: () => void; dragging?: boolean }) {
  const linkedAppt = appointments.filter((ap) => ap.application_id === app.id).length
  const linkedContacts = app.contact_ids.length
  return (
    <div
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`kanban-card ${dragging ? 'rotate-2 shadow-xl' : ''}`}
      role="button"
    >
      <div className="kanban-card-company truncate">{app.company || '—'}</div>
      <div className="kanban-card-role truncate">{app.role || '—'}</div>
      {app.applied_date && (
        <div className="kanban-card-meta inline-flex items-center gap-1">
          <Calendar className="size-3" /> {app.applied_date}
        </div>
      )}
      {app.source && <div className="kanban-card-meta truncate">via {app.source}</div>}
      {(linkedContacts > 0 || linkedAppt > 0 || app.analysis_id) && (
        <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-[var(--text-tertiary)]">
          {linkedContacts > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" /> {linkedContacts}
            </span>
          )}
          {linkedAppt > 0 && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" /> {linkedAppt}
            </span>
          )}
          {app.analysis_id && (
            <span title="Linked analysis" className="inline-flex">
              <FileText className="size-3" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicationModal({
  initial, contacts, analyses, linkedAppointments, onClose, onSave, onDelete,
}: {
  initial: Partial<Application>
  contacts: Contact[]
  analyses: Analysis[]
  linkedAppointments: Appointment[]
  onClose: () => void
  onSave: (data: Omit<Application, 'id' | 'created_at' | 'updated_at'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    company: initial.company ?? '',
    role: initial.role ?? '',
    status: (initial.status ?? 'interested') as ApplicationStatus,
    applied_date: initial.applied_date ?? '',
    jd_url: initial.jd_url ?? '',
    source: initial.source ?? '',
    salary_target: initial.salary_target ?? '',
    analysis_id: initial.analysis_id ?? '',
    contact_ids: initial.contact_ids ?? [],
    notes: initial.notes ?? '',
  })

  const toggleContact = (id: string) => {
    setForm((f) => ({
      ...f,
      contact_ids: f.contact_ids.includes(id) ? f.contact_ids.filter((c) => c !== id) : [...f.contact_ids, id],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{onDelete ? 'Edit Application' : 'New Application'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company *" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Role *" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          <L label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })} className={inputCls}>
              {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </L>
          <Field label="Applied date" type="date" value={form.applied_date ?? ''} onChange={(v) => setForm({ ...form, applied_date: v || null })} />
          <Field label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="Jacobson, LinkedIn, Direct…" />
          <Field label="Salary target" value={form.salary_target} onChange={(v) => setForm({ ...form, salary_target: v })} placeholder="$260K base" />
          <div className="md:col-span-2">
            <Field label="JD URL" value={form.jd_url} onChange={(v) => setForm({ ...form, jd_url: v })} placeholder="https://…" />
          </div>

          {/* Analysis link */}
          <div className="md:col-span-2">
            <L label="Linked Analysis">
              <select
                value={form.analysis_id}
                onChange={(e) => setForm({ ...form, analysis_id: e.target.value })}
                className={inputCls}
              >
                <option value="">— None —</option>
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.job_title} @ {a.company} ({a.date?.slice(0, 10)})
                  </option>
                ))}
              </select>
            </L>
          </div>

          {/* Contacts */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Linked Contacts ({form.contact_ids.length})
            </label>
            {contacts.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">Add contacts in the Contacts tab to link them here.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-neutral-950 border border-neutral-700 rounded-lg">
                {contacts.map((c) => {
                  const on = form.contact_ids.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleContact(c.id)}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        on
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {c.name}{c.company ? ` · ${c.company}` : ''}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              className={inputCls}
            />
          </div>

          {linkedAppointments.length > 0 && (
            <div className="md:col-span-2 mt-2">
              <label className="block text-xs font-medium text-neutral-400 mb-2">Linked Appointments</label>
              <div className="space-y-1">
                {linkedAppointments.map((ap) => (
                  <div key={ap.id} className="text-xs bg-neutral-800/60 border border-neutral-700/50 rounded-md px-3 py-1.5">
                    <span className="text-neutral-200">{ap.title}</span>
                    <span className="text-neutral-500"> · {new Date(ap.starts_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-5">
          <div>
            {onDelete && (
              <button onClick={() => { if (confirm('Delete this application?')) onDelete() }} className="px-3 py-2 text-red-400 hover:text-red-300 text-sm">
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!form.company.trim() || !form.role.trim()) return
                onSave({
                  company: form.company,
                  role: form.role,
                  status: form.status,
                  applied_date: form.applied_date || null,
                  jd_url: form.jd_url,
                  source: form.source,
                  salary_target: form.salary_target,
                  analysis_id: form.analysis_id || undefined,
                  contact_ids: form.contact_ids,
                  notes: form.notes,
                })
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50'

function Field({
  label, value, onChange, type = 'text', placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <L label={label}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </L>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

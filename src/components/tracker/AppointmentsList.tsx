'use client'

import { useMemo, useState } from 'react'
import { MapPin, ClipboardList, User } from 'lucide-react'
import { APPOINTMENT_TYPES, useAppointments, useApplications, useContacts } from '@/lib/tracker'
import type { Appointment, AppointmentType, Application, Contact } from '@/types'

const blank = (): Omit<Appointment, 'id' | 'created_at' | 'updated_at'> => ({
  title: '', type: 'recruiter_call', starts_at: '', duration_min: 30,
  company: '', contact_ids: [], location: '', prep_notes: '', outcome: '',
})

function isoToLocalInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatWhen(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function AppointmentsList() {
  const { items, loaded, create, update, remove } = useAppointments()
  const { items: applications } = useApplications()
  const { items: contacts } = useContacts()
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [showNew, setShowNew] = useState(false)

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const up: Appointment[] = []
    const pa: Appointment[] = []
    for (const a of items) {
      const t = new Date(a.starts_at).getTime()
      if (isNaN(t) || t >= now) up.push(a)
      else pa.push(a)
    }
    up.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    pa.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    return { upcoming: up, past: pa }
  }, [items])

  if (!loaded) return <div className="text-neutral-500 text-sm">Loading…</div>

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Appointment
        </button>
      </div>

      <Section title="Upcoming" items={upcoming} onClick={setEditing} empty="Nothing scheduled." applications={applications} contacts={contacts} />
      <Section title="Past" items={past} onClick={setEditing} empty="No past appointments." muted applications={applications} contacts={contacts} />

      {(showNew || editing) && (
        <AppointmentModal
          initial={editing ?? blank()}
          applications={applications}
          contacts={contacts}
          onClose={() => { setShowNew(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) update(editing.id, data)
            else create(data)
            setShowNew(false); setEditing(null)
          }}
          onDelete={editing ? () => { remove(editing.id); setEditing(null) } : undefined}
        />
      )}
    </div>
  )
}

function Section({
  title, items, onClick, empty, muted, applications, contacts,
}: {
  title: string
  items: Appointment[]
  onClick: (a: Appointment) => void
  empty: string
  muted?: boolean
  applications: Application[]
  contacts: Contact[]
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-neutral-300 mb-2">{title}</h3>
      {items.length === 0 ? (
        <div className="text-sm text-neutral-500 italic py-2">{empty}</div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const app = a.application_id ? applications.find((x) => x.id === a.application_id) : null
            const linkedContacts = contacts.filter((c) => a.contact_ids.includes(c.id))
            return (
              <button
                key={a.id}
                onClick={() => onClick(a)}
                className={`w-full text-left bg-neutral-800/40 hover:bg-neutral-800/70 border border-neutral-700/50 hover:border-neutral-600 rounded-xl p-4 transition-all ${
                  muted ? 'opacity-70' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-neutral-100">{a.title || '—'}</div>
                    <div className="text-sm text-neutral-400">
                      {a.company && <span>{a.company} · </span>}
                      {APPOINTMENT_TYPES.find((t) => t.value === a.type)?.label}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-300">
                    {formatWhen(a.starts_at)} {a.duration_min ? `(${a.duration_min}m)` : ''}
                  </div>
                </div>
                {a.location && (
                  <div className="text-xs text-neutral-500 mt-1 inline-flex items-center gap-1">
                    <MapPin className="size-3" /> {a.location}
                  </div>
                )}
                {(app || linkedContacts.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                    {app && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300">
                        <ClipboardList className="size-3" /> {app.company} — {app.role}
                      </span>
                    )}
                    {linkedContacts.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-700/60 text-neutral-300">
                        <User className="size-3" /> {c.name}
                      </span>
                    ))}
                  </div>
                )}
                {a.outcome && (
                  <div className="text-xs text-neutral-400 mt-1">
                    <span className="text-neutral-500">Outcome:</span> {a.outcome}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AppointmentModal({
  initial, applications, contacts, onClose, onSave, onDelete,
}: {
  initial: Partial<Appointment>
  applications: Application[]
  contacts: Contact[]
  onClose: () => void
  onSave: (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    type: (initial.type ?? 'recruiter_call') as AppointmentType,
    starts_at: isoToLocalInput(initial.starts_at ?? ''),
    duration_min: initial.duration_min ?? 30,
    company: initial.company ?? '',
    application_id: initial.application_id ?? '',
    contact_ids: initial.contact_ids ?? [],
    location: initial.location ?? '',
    prep_notes: initial.prep_notes ?? '',
    outcome: initial.outcome ?? '',
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
        <h3 className="text-xl font-bold mb-4">{onDelete ? 'Edit Appointment' : 'New Appointment'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <L label="Title *">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </L>
          </div>
          <L label="Type">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppointmentType })} className={inputCls}>
              {APPOINTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </L>
          <L label="Company">
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
          </L>
          <L label="Starts at">
            <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={inputCls} />
          </L>
          <L label="Duration (min)">
            <input type="number" min={0} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) || 0 })} className={inputCls} />
          </L>
          <div className="md:col-span-2">
            <L label="Location / link">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Zoom URL, office, phone…" className={inputCls} />
            </L>
          </div>

          <div className="md:col-span-2">
            <L label="Linked Application">
              <select
                value={form.application_id}
                onChange={(e) => {
                  const id = e.target.value
                  const app = applications.find((a) => a.id === id)
                  setForm({
                    ...form,
                    application_id: id,
                    // auto-fill company from the application if empty
                    company: form.company || app?.company || '',
                  })
                }}
                className={inputCls}
              >
                <option value="">— None —</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.company} — {a.role}
                  </option>
                ))}
              </select>
            </L>
          </div>

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
            <L label="Prep notes">
              <textarea value={form.prep_notes} onChange={(e) => setForm({ ...form, prep_notes: e.target.value })} rows={3} className={inputCls} />
            </L>
          </div>
          <div className="md:col-span-2">
            <L label="Outcome">
              <textarea value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} rows={2} className={inputCls} />
            </L>
          </div>
        </div>
        <div className="flex justify-between items-center mt-5">
          <div>
            {onDelete && (
              <button onClick={() => { if (confirm('Delete this appointment?')) onDelete() }} className="px-3 py-2 text-red-400 hover:text-red-300 text-sm">
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
                if (!form.title.trim()) return
                onSave({
                  title: form.title,
                  type: form.type,
                  starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : '',
                  duration_min: form.duration_min,
                  company: form.company,
                  application_id: form.application_id || undefined,
                  contact_ids: form.contact_ids,
                  location: form.location,
                  prep_notes: form.prep_notes,
                  outcome: form.outcome,
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

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

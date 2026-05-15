'use client'

import { useMemo, useState } from 'react'
import { Calendar, ClipboardList } from 'lucide-react'
import { useApplications, useAppointments, useContacts } from '@/lib/tracker'
import type { Appointment, Application, Contact } from '@/types'

const blank = (): Omit<Contact, 'id' | 'created_at' | 'updated_at'> => ({
  name: '', role: '', company: '', source: '', email: '', phone: '', linkedin: '',
  last_contacted: null, next_followup: null, tags: [], notes: '',
})

export default function ContactsList() {
  const { items, loaded, create, update, remove } = useContacts()
  const { items: applications } = useApplications()
  const { items: appointments } = useAppointments()
  const [editing, setEditing] = useState<Contact | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) =>
      `${c.name} ${c.role} ${c.company} ${c.source} ${c.tags.join(' ')} ${c.notes}`
        .toLowerCase()
        .includes(q)
    )
  }, [items, filter])

  if (!loaded) return <div className="text-neutral-500 text-sm">Loading…</div>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter contacts…"
          className="flex-1 min-w-[200px] px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Contact
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800/30 rounded-xl border border-neutral-700/50">
          <p className="text-neutral-400">{items.length === 0 ? 'No contacts yet.' : 'No matches.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const linkedApps = applications.filter((a) => a.contact_ids.includes(c.id)).length
            const linkedAppts = appointments.filter((a) => a.contact_ids.includes(c.id)).length
            return (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className="text-left bg-neutral-800/40 hover:bg-neutral-800/70 border border-neutral-700/50 hover:border-neutral-600 rounded-xl p-4 transition-all"
              >
                <div className="font-semibold text-neutral-100">{c.name || '—'}</div>
                <div className="text-sm text-neutral-400">{c.role}{c.role && c.company ? ' · ' : ''}{c.company}</div>
                {c.source && (
                  <div className="text-xs text-neutral-500 mt-1">Source: {c.source}</div>
                )}
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.tags.map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-700/60 text-neutral-300">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-neutral-500">
                  {c.last_contacted && <span>Last: {c.last_contacted}</span>}
                  {c.next_followup && <span className="text-amber-400">Next: {c.next_followup}</span>}
                  {linkedApps > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="size-3" /> {linkedApps}
                    </span>
                  )}
                  {linkedAppts > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" /> {linkedAppts}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {(showNew || editing) && (
        <ContactModal
          initial={editing ?? blank()}
          linkedApplications={editing ? applications.filter((a) => a.contact_ids.includes(editing.id)) : []}
          linkedAppointments={editing ? appointments.filter((a) => a.contact_ids.includes(editing.id)) : []}
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

function ContactModal({
  initial, linkedApplications, linkedAppointments, onClose, onSave, onDelete,
}: {
  initial: Partial<Contact>
  linkedApplications: Application[]
  linkedAppointments: Appointment[]
  onClose: () => void
  onSave: (data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    role: initial.role ?? '',
    company: initial.company ?? '',
    source: initial.source ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    linkedin: initial.linkedin ?? '',
    last_contacted: initial.last_contacted ?? '',
    next_followup: initial.next_followup ?? '',
    tags: (initial.tags ?? []).join(', '),
    notes: initial.notes ?? '',
  })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{onDelete ? 'Edit Contact' : 'New Contact'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Input label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="Jacobson, DMEC, LinkedIn…" />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div className="md:col-span-2">
            <Input label="LinkedIn" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} placeholder="https://linkedin.com/in/…" />
          </div>
          <Input label="Last contacted" type="date" value={form.last_contacted} onChange={(v) => setForm({ ...form, last_contacted: v })} />
          <Input label="Next follow-up" type="date" value={form.next_followup} onChange={(v) => setForm({ ...form, next_followup: v })} />
          <div className="md:col-span-2">
            <Input label="Tags (comma-separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="recruiter, referral" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {(linkedApplications.length > 0 || linkedAppointments.length > 0) && (
            <div className="md:col-span-2 mt-2 pt-3 border-t border-neutral-800 space-y-3">
              {linkedApplications.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Linked Applications ({linkedApplications.length})
                  </label>
                  <div className="space-y-1">
                    {linkedApplications.map((a) => (
                      <div key={a.id} className="text-xs bg-neutral-800/60 border border-neutral-700/50 rounded-md px-3 py-1.5">
                        <span className="text-neutral-200">{a.company} — {a.role}</span>
                        <span className="text-neutral-500"> · {a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {linkedAppointments.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Linked Appointments ({linkedAppointments.length})
                  </label>
                  <div className="space-y-1">
                    {linkedAppointments.map((a) => (
                      <div key={a.id} className="text-xs bg-neutral-800/60 border border-neutral-700/50 rounded-md px-3 py-1.5">
                        <span className="text-neutral-200">{a.title}</span>
                        <span className="text-neutral-500"> · {a.starts_at ? new Date(a.starts_at).toLocaleString() : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-5">
          <div>
            {onDelete && (
              <button onClick={() => { if (confirm('Delete this contact?')) onDelete() }} className="px-3 py-2 text-red-400 hover:text-red-300 text-sm">
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
                if (!form.name.trim()) return
                onSave({
                  name: form.name, role: form.role, company: form.company, source: form.source,
                  email: form.email, phone: form.phone, linkedin: form.linkedin,
                  last_contacted: form.last_contacted || null,
                  next_followup: form.next_followup || null,
                  tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
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

function Input({
  label, value, onChange, type = 'text', placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
    </div>
  )
}

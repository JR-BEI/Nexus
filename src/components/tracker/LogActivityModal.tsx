'use client'

import { useEffect, useState } from 'react'
import { Mail, Phone, Mic, StickyNote } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ContactPicker } from './ContactPicker'
import { applicationRepo } from '@/lib/repos/applicationRepo'
import { contactRepo } from '@/lib/repos/contactRepo'
import { newContactId } from '@/lib/id'
import type { TrackerApplication, TrackerContact, TrackerEventType } from '@/types/nexus'

const TYPES: { id: Exclude<TrackerEventType, 'status_change'>; label: string; icon: React.ReactNode }[] = [
  { id: 'email', label: 'Email', icon: <Mail className="size-3.5" /> },
  { id: 'call', label: 'Call', icon: <Phone className="size-3.5" /> },
  { id: 'interview', label: 'Interview', icon: <Mic className="size-3.5" /> },
  { id: 'note', label: 'Note', icon: <StickyNote className="size-3.5" /> },
]

interface Props {
  open: boolean
  app: TrackerApplication | null
  onClose: () => void
  /** Notified when an event is logged so the parent can refresh state. */
  onLogged?: (app: TrackerApplication) => void
}

export function LogActivityModal({ open, app, onClose, onLogged }: Props) {
  const [type, setType] = useState<typeof TYPES[number]['id']>('note')
  const [content, setContent] = useState('')
  const [contacts, setContacts] = useState<TrackerContact[]>([])
  const [contactId, setContactId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    contactRepo.list().then(setContacts)
    setType('note')
    setContent('')
    setContactId(null)
  }, [open])

  if (!app) return null

  const isPersonInteraction = type === 'email' || type === 'call' || type === 'interview'

  const handleCreateContact = async (name: string): Promise<string> => {
    const now = Date.now()
    const newContact: TrackerContact = {
      id: newContactId(),
      createdAt: now,
      updatedAt: now,
      name,
      linkedApplicationIds: [app.id],
    }
    await contactRepo.save(newContact)
    setContacts((prev) => [newContact, ...prev])
    return newContact.id
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const updated = await applicationRepo.appendEvent(app.id, {
        type,
        content: content.trim() || undefined,
      })
      if (!updated) return

      // Link contact bidirectionally if one was selected.
      if (contactId && !updated.linkedContactIds.includes(contactId)) {
        const next: TrackerApplication = {
          ...updated,
          linkedContactIds: [...updated.linkedContactIds, contactId],
        }
        await applicationRepo.save(next)

        const contact = await contactRepo.get(contactId)
        if (contact && !contact.linkedApplicationIds.includes(app.id)) {
          await contactRepo.save({
            ...contact,
            linkedApplicationIds: [...contact.linkedApplicationIds, app.id],
          })
        }
        onLogged?.(next)
      } else {
        onLogged?.(updated)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>
            {app.company} · {app.role}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                type === t.id
                  ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {isPersonInteraction && (
          <ContactPicker
            contacts={contacts}
            value={contactId}
            onChange={setContactId}
            linkedContactIds={app.linkedContactIds}
            onCreate={handleCreateContact}
          />
        )}

        <Textarea
          rows={3}
          placeholder="What happened? (optional)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Logging…' : 'Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

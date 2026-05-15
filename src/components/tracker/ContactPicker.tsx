'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { TrackerContact } from '@/types/nexus'

interface Props {
  contacts: TrackerContact[]
  value: string | null
  onChange: (id: string | null) => void
  linkedContactIds: string[]
  /** Called when the user wants to create a new contact inline. Returns the new ID. */
  onCreate?: (name: string) => Promise<string>
}

export function ContactPicker({ contacts, value, onChange, linkedContactIds, onCreate }: Props) {
  const [search, setSearch] = useState('')

  const linked = useMemo(
    () => contacts.filter((c) => linkedContactIds.includes(c.id)),
    [contacts, linkedContactIds]
  )
  const others = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contacts
      .filter((c) => !linkedContactIds.includes(c.id))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [contacts, linkedContactIds, search])

  const exactMatch = useMemo(
    () => contacts.some((c) => c.name.toLowerCase() === search.toLowerCase().trim()),
    [contacts, search]
  )

  const handleCreate = async () => {
    if (!onCreate) return
    const name = search.trim()
    if (!name) return
    const id = await onCreate(name)
    onChange(id)
    setSearch('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        Who was this with? <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
      </label>

      {linked.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Already linked</div>
          <div className="flex flex-wrap gap-2">
            {linked.map((c) => (
              <ContactChip
                key={c.id}
                contact={c}
                selected={value === c.id}
                onClick={() => onChange(value === c.id ? null : c.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Input
        type="text"
        placeholder="Search contacts or add new..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((c) => (
            <ContactChip
              key={c.id}
              contact={c}
              selected={value === c.id}
              onClick={() => onChange(value === c.id ? null : c.id)}
            />
          ))}
        </div>
      )}

      {search.trim() && !exactMatch && onCreate && (
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:underline"
        >
          <Plus className="size-3" />
          Create &ldquo;{search.trim()}&rdquo;
        </button>
      )}
    </div>
  )
}

function ContactChip({
  contact,
  selected,
  onClick,
}: {
  contact: TrackerContact
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
      }`}
    >
      {contact.name}
      {contact.company ? <span className="opacity-60"> · {contact.company}</span> : null}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { newImpactId } from '@/lib/id'
import type { ImpactStatement, RepositoryEntry } from '@/types/nexus'

export interface EntryFormDraft {
  company: string
  title: string
  startDate: string
  endDate: string | null
  summary: string
  impactStatements: ImpactStatement[]
  skills: string[]
  domains: string[]
}

export function emptyDraft(): EntryFormDraft {
  return {
    company: '',
    title: '',
    startDate: '',
    endDate: null,
    summary: '',
    impactStatements: [],
    skills: [],
    domains: [],
  }
}

export function fromEntry(e: RepositoryEntry): EntryFormDraft {
  return {
    company: e.company,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    summary: e.summary ?? '',
    impactStatements: e.impactStatements,
    skills: e.skills,
    domains: e.domains,
  }
}

interface Props {
  initial: EntryFormDraft
  submitLabel?: string
  onSubmit: (draft: EntryFormDraft) => void | Promise<void>
  onCancel?: () => void
}

export function EntryForm({ initial, submitLabel = 'Save entry', onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<EntryFormDraft>(initial)
  const [saving, setSaving] = useState(false)

  const valid = draft.company.trim() && draft.title.trim() && draft.startDate.trim()

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      await onSubmit(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Company *">
          <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
        </Field>
        <Field label="Title *">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Start (YYYY-MM) *">
          <Input
            placeholder="2022-01"
            value={draft.startDate}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
          />
        </Field>
        <Field label="End (YYYY-MM, blank = current)">
          <Input
            placeholder="2024-12"
            value={draft.endDate ?? ''}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value || null })}
          />
        </Field>
      </div>

      <Field label="Summary">
        <Textarea
          rows={2}
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        />
      </Field>

      <ImpactStatementsEditor
        statements={draft.impactStatements}
        onChange={(s) => setDraft({ ...draft, impactStatements: s })}
      />

      <TagsEditor
        label="Skills"
        tags={draft.skills}
        onChange={(skills) => setDraft({ ...draft, skills })}
      />
      <TagsEditor
        label="Domains"
        tags={draft.domains}
        onChange={(domains) => setDraft({ ...draft, domains })}
      />

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={!valid || saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
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

function ImpactStatementsEditor({
  statements,
  onChange,
}: {
  statements: ImpactStatement[]
  onChange: (s: ImpactStatement[]) => void
}) {
  const addOne = () =>
    onChange([
      ...statements,
      { id: newImpactId(), text: '', tags: [] },
    ])

  const update = (id: string, patch: Partial<ImpactStatement>) =>
    onChange(statements.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const remove = (id: string) => onChange(statements.filter((s) => s.id !== id))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Impact statements ({statements.length})
        </label>
        <Button variant="ghost" size="sm" onClick={addOne}>
          <Plus className="size-3.5 mr-1" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {statements.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] italic">
            No impact statements yet. Add a few measurable accomplishments.
          </p>
        )}
        {statements.map((s) => (
          <div
            key={s.id}
            className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div className="flex-1 space-y-2">
              <Textarea
                rows={2}
                value={s.text}
                onChange={(e) => update(s.id, { text: e.target.value })}
                placeholder="What did you accomplish?"
              />
              <Input
                value={s.metric ?? ''}
                onChange={(e) => update(s.id, { metric: e.target.value })}
                placeholder="Optional metric — e.g. '$20M annual savings'"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(s.id)}
              className="p-1 text-[var(--text-tertiary)] hover:text-red-400"
              aria-label="Remove impact"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TagsEditor({
  label,
  tags,
  onChange,
}: {
  label: string
  tags: string[]
  onChange: (t: string[]) => void
}) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (tags.includes(v)) return
    onChange([...tags, v])
    setInput('')
  }

  const remove = (t: string) => onChange(tags.filter((x) => x !== t))

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="hover:text-red-400"
              aria-label={`Remove ${t}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(input)
          }
        }}
        placeholder="Type and press Enter…"
      />
    </div>
  )
}

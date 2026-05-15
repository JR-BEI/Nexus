'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Mic, ClipboardPaste, Pencil, AlertTriangle, Trash2, Edit3 } from 'lucide-react'
import VoiceRecorder from '@/components/VoiceRecorder'
import Spinner from '@/components/Spinner'
import { PageShell } from '@/components/ui/PageShell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  EntryForm,
  emptyDraft,
  fromEntry,
  type EntryFormDraft,
} from '@/components/repository/EntryForm'
import { repositoryRepo } from '@/lib/repos/repositoryRepo'
import { newImpactId, newRepositoryId } from '@/lib/id'
import type { ImpactStatement, RepositoryEntry } from '@/types/nexus'

type Mode = 'voice' | 'paste' | 'manual'

export default function BuildPage() {
  const [entries, setEntries] = useState<RepositoryEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState<Mode>('voice')
  const [reviewDraft, setReviewDraft] = useState<{ draft: EntryFormDraft; source: RepositoryEntry['source']; raw?: { transcript?: string; text?: string } } | null>(null)
  const [editing, setEditing] = useState<RepositoryEntry | null>(null)

  const refresh = async () => {
    const all = await repositoryRepo.list()
    setEntries(all)
  }

  useEffect(() => {
    refresh().finally(() => setLoaded(true))
  }, [])

  const handleNewEntry = async (
    draft: EntryFormDraft,
    source: RepositoryEntry['source'],
    raw?: { transcript?: string; text?: string }
  ) => {
    const now = Date.now()
    const entry: RepositoryEntry = {
      id: newRepositoryId(),
      createdAt: now,
      updatedAt: now,
      source,
      company: draft.company.trim(),
      title: draft.title.trim(),
      startDate: draft.startDate.trim(),
      endDate: draft.endDate || null,
      summary: draft.summary.trim() || undefined,
      impactStatements: draft.impactStatements,
      skills: draft.skills,
      domains: draft.domains,
      rawTranscript: raw?.transcript,
      rawText: raw?.text,
      needsReview: false,
    }
    await repositoryRepo.save(entry)
    await refresh()
    setReviewDraft(null)
    toast.success(`Saved “${entry.company} — ${entry.title}” to repository`)
  }

  const handleEditSave = async (draft: EntryFormDraft) => {
    if (!editing) return
    const updated: RepositoryEntry = {
      ...editing,
      company: draft.company.trim(),
      title: draft.title.trim(),
      startDate: draft.startDate.trim(),
      endDate: draft.endDate || null,
      summary: draft.summary.trim() || undefined,
      impactStatements: draft.impactStatements,
      skills: draft.skills,
      domains: draft.domains,
      needsReview: false,
    }
    await repositoryRepo.save(updated)
    await refresh()
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    await repositoryRepo.delete(id)
    await refresh()
  }

  return (
    <PageShell
      icon={<BookOpen strokeWidth={1.5} />}
      titlePrefix="Build"
      titleAccent="Repository"
      subtitle="Your work history, structured for tailoring."
      status={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
      backHref="/"
      backLabel="Back to Home"
    >
      <RepositoryList
        entries={entries}
        loaded={loaded}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

      <section className="page-content-section">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Add a role</h2>

        <div className="inline-flex p-1 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] mb-4">
          {(['voice', 'paste', 'manual'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-[var(--bg-elevated-2)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent'
              }`}
            >
              {m === 'voice' && <Mic className="size-3.5" />}
              {m === 'paste' && <ClipboardPaste className="size-3.5" />}
              {m === 'manual' && <Pencil className="size-3.5" />}
              {m === 'voice' ? 'Voice' : m === 'paste' ? 'Paste' : 'Manual'}
            </button>
          ))}
        </div>

        {mode === 'voice' && !reviewDraft && (
          <VoiceMode
            onExtracted={(draft, raw) => setReviewDraft({ draft, source: 'voice', raw: { transcript: raw } })}
          />
        )}
        {mode === 'paste' && !reviewDraft && (
          <PasteMode
            onExtracted={(draft, raw) => setReviewDraft({ draft, source: 'paste', raw: { text: raw } })}
          />
        )}
        {mode === 'manual' && !reviewDraft && (
          <EntryForm
            initial={emptyDraft()}
            submitLabel="Save entry"
            onSubmit={(d) => handleNewEntry(d, 'manual')}
          />
        )}

        {reviewDraft && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Edit3 className="size-4 text-[var(--accent-blue)]" />
              Review extracted entry — edit anything that looks off.
            </div>
            <EntryForm
              initial={reviewDraft.draft}
              submitLabel="Save to repository"
              onSubmit={(d) => handleNewEntry(d, reviewDraft.source, reviewDraft.raw)}
              onCancel={() => setReviewDraft(null)}
            />
          </div>
        )}
      </section>

      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
          </DialogHeader>
          {editing && (
            <EntryForm
              initial={fromEntry(editing)}
              submitLabel="Save changes"
              onSubmit={handleEditSave}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

// =========================
// Repository list
// =========================
function RepositoryList({
  entries,
  loaded,
  onEdit,
  onDelete,
}: {
  entries: RepositoryEntry[]
  loaded: boolean
  onEdit: (e: RepositoryEntry) => void
  onDelete: (id: string) => void
}) {
  if (!loaded) return null

  if (entries.length === 0) {
    return (
      <section className="page-content-section">
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-8 text-center">
          <p className="text-base text-[var(--text-primary)] font-medium mb-1">No work history yet</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Add at least one role below. Analyses use this as context.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="page-content-section">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Your work history</h2>
      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <RepoEntryCard key={e.id} entry={e} onEdit={() => onEdit(e)} onDelete={() => onDelete(e.id)} />
        ))}
      </div>
    </section>
  )
}

function RepoEntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: RepositoryEntry
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article
      className={`rounded-[var(--radius-lg)] border ${
        entry.needsReview ? 'border-amber-500/40' : 'border-[var(--border-subtle)]'
      } bg-[var(--bg-elevated)] p-5 hover:border-[var(--border-default)] transition-colors`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{entry.title}</h3>
          <div className="text-sm text-[var(--text-secondary)]">
            {entry.company} · {entry.startDate} – {entry.endDate || 'present'}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit">
            <Edit3 className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {entry.needsReview && (
        <div className="mt-3 px-3 py-2 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 inline-flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" />
          AI extraction may need review
        </div>
      )}

      <div className="flex gap-2 text-xs text-[var(--text-tertiary)] mt-3">
        <span>
          {entry.impactStatements.length} impact statement
          {entry.impactStatements.length !== 1 ? 's' : ''}
        </span>
        {entry.skills.length > 0 && (
          <>
            <span>·</span>
            <span>{entry.skills.length} skills</span>
          </>
        )}
        {entry.domains.length > 0 && (
          <>
            <span>·</span>
            <span>{entry.domains.length} domains</span>
          </>
        )}
      </div>

      {entry.impactStatements.length > 0 && (
        <ul className="mt-3 pl-5 list-disc text-sm text-[var(--text-secondary)] space-y-1">
          {entry.impactStatements.slice(0, 3).map((i) => (
            <li key={i.id}>{i.text}</li>
          ))}
          {entry.impactStatements.length > 3 && (
            <li className="list-none -ml-5 text-[var(--text-tertiary)] italic">
              + {entry.impactStatements.length - 3} more
            </li>
          )}
        </ul>
      )}
    </article>
  )
}

// =========================
// Voice mode
// =========================
function VoiceMode({
  onExtracted,
}: {
  onExtracted: (draft: EntryFormDraft, rawTranscript: string) => void
}) {
  const [transcript, setTranscript] = useState('')
  const [editedTranscript, setEditedTranscript] = useState('')
  const [extracting, setExtracting] = useState(false)

  const handleExtract = async () => {
    if (!editedTranscript.trim()) return
    setExtracting(true)
    try {
      const res = await fetch('/api/extract-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: editedTranscript }),
      })
      if (!res.ok) throw new Error('extract failed')
      const data = await res.json()
      const draft = positionToDraft(data.position)
      onExtracted(draft, editedTranscript)
    } catch (err) {
      console.error(err)
      toast.error('Extraction failed. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  if (!transcript) {
    return (
      <VoiceRecorder
        onTranscript={(text) => {
          setTranscript(text)
          setEditedTranscript(text)
        }}
        loading={extracting}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Review transcript</h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">
          Edit if needed, then extract structured data.
        </p>
        <Textarea
          value={editedTranscript}
          onChange={(e) => setEditedTranscript(e.target.value)}
          className="min-h-[200px] resize-y"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => { setTranscript(''); setEditedTranscript('') }}>
          Start over
        </Button>
        <Button onClick={handleExtract} disabled={extracting || !editedTranscript.trim()}>
          {extracting ? (
            <>
              <Spinner size="sm" />
              <span>Extracting…</span>
            </>
          ) : (
            'Extract data'
          )}
        </Button>
      </div>
    </div>
  )
}

// =========================
// Paste mode
// =========================
function PasteMode({
  onExtracted,
}: {
  onExtracted: (draft: EntryFormDraft, rawText: string) => void
}) {
  const [text, setText] = useState('')
  const [extracting, setExtracting] = useState(false)

  const handleExtract = async () => {
    if (text.trim().length < 100) return
    setExtracting(true)
    try {
      const res = await fetch('/api/extract-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('extract failed')
      const data = await res.json()
      const draft = pasteResultToDraft(data.extracted)
      onExtracted(draft, text)
    } catch (err) {
      console.error(err)
      toast.error('Extraction failed. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-secondary)]">
        Paste a resume, LinkedIn export, or any block of text describing a role. AI will extract the structure.
      </p>
      <Textarea
        rows={10}
        placeholder="Paste resume text or role description here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">
          {text.length.toLocaleString()} characters
        </span>
        <Button onClick={handleExtract} disabled={text.trim().length < 100 || extracting}>
          {extracting ? (
            <>
              <Spinner size="sm" />
              <span>Extracting…</span>
            </>
          ) : (
            'Extract structure'
          )}
        </Button>
      </div>
    </div>
  )
}

// =========================
// Adapters
// =========================
interface VoicePosition {
  title?: string
  company?: string
  start_date?: string
  end_date?: string | null
  context?: string
  impact_statements?: { text: string; tags?: string[] }[]
  tags?: string[]
}

function positionToDraft(p: VoicePosition): EntryFormDraft {
  return {
    company: p.company ?? '',
    title: p.title ?? '',
    startDate: p.start_date ?? '',
    endDate: p.end_date ?? null,
    summary: p.context ?? '',
    impactStatements: (p.impact_statements ?? []).map<ImpactStatement>((i) => ({
      id: newImpactId(),
      text: i.text,
      tags: i.tags ?? [],
    })),
    skills: p.tags ?? [],
    domains: [],
  }
}

interface PasteExtraction {
  company?: string
  title?: string
  startDate?: string | null
  endDate?: string | null
  summary?: string
  impactStatements?: { text: string; metric?: string }[]
  skills?: string[]
  domains?: string[]
}

function pasteResultToDraft(j: PasteExtraction): EntryFormDraft {
  return {
    company: j.company ?? '',
    title: j.title ?? '',
    startDate: j.startDate ?? '',
    endDate: j.endDate ?? null,
    summary: j.summary ?? '',
    impactStatements: (j.impactStatements ?? []).map<ImpactStatement>((i) => ({
      id: newImpactId(),
      text: i.text,
      metric: i.metric,
      tags: [],
    })),
    skills: j.skills ?? [],
    domains: j.domains ?? [],
  }
}

'use client'

import { useMemo, useState } from 'react'
import { useNotes } from '@/lib/tracker'

function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function NotesTimeline() {
  const { items, loaded, create, remove } = useNotes()
  const [body, setBody] = useState('')
  const [date, setDate] = useState(todayIso())
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const s = new Set<string>()
    items.forEach((n) => n.tags.forEach((t) => s.add(t)))
    return Array.from(s).sort()
  }, [items])

  const visible = useMemo(() => {
    const sorted = [...items].sort((a, b) =>
      (b.date + b.created_at).localeCompare(a.date + a.created_at)
    )
    return tagFilter ? sorted.filter((n) => n.tags.includes(tagFilter)) : sorted
  }, [items, tagFilter])

  if (!loaded) return <div className="text-neutral-500 text-sm">Loading…</div>

  const handleAdd = () => {
    const text = body.trim()
    if (!text) return
    const tags = Array.from(new Set(text.match(/#[\w-]+/g) ?? []))
    create({ date, body: text, tags })
    setBody('')
  }

  return (
    <div>
      {/* Composer */}
      <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <span className="text-xs text-neutral-500">
            Tip: use #tags inline (e.g. #applied #networking)
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What happened today? Calls, follow-ups, applications…"
          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-neutral-500">⌘/Ctrl+Enter to save</span>
          <button
            onClick={handleAdd}
            disabled={!body.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Note
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setTagFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              tagFilter === null
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                tagFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {visible.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800/30 rounded-xl border border-neutral-700/50">
          <p className="text-neutral-400">{items.length === 0 ? 'No notes yet.' : 'No notes match this tag.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => (
            <div key={n.id} className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="text-xs text-neutral-500">{n.date}</div>
                <button
                  onClick={() => { if (confirm('Delete this note?')) remove(n.id) }}
                  className="text-xs text-neutral-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">{n.body}</p>
              {n.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {n.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

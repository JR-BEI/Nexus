'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'
import VoiceRecorder from '@/components/VoiceRecorder'
import Spinner from '@/components/Spinner'
import { PageShell } from '@/components/ui/PageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface ExtractedPosition {
  title: string
  company: string
  location: string
  start_date: string
  end_date: string | null
  context: string
  impact_statements?: Array<{ text: string; tags?: string[] }>
}

const HOW_IT_WORKS: Array<[number, string]> = [
  [1, 'Click mic, describe a role'],
  [2, 'Include company, title, dates, accomplishments'],
  [3, 'Review the transcript'],
  [4, 'AI extracts structured data'],
  [5, 'Confirm and save'],
]

export default function BuildPage() {
  const [transcript, setTranscript] = useState('')
  const [editedTranscript, setEditedTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractedPosition, setExtractedPosition] = useState<ExtractedPosition | null>(null)

  const handleTranscript = (text: string) => {
    setTranscript(text)
    setEditedTranscript(text)
  }

  const handleExtract = async () => {
    if (!editedTranscript.trim()) return
    setLoading(true)
    try {
      const response = await fetch('/api/extract-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: editedTranscript }),
      })
      if (!response.ok) throw new Error('Extraction failed')
      const data = await response.json()
      setExtractedPosition(data.position)
    } catch (error) {
      console.error('Extraction error:', error)
      toast.error('Failed to extract experience. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    const saved = localStorage.getItem('pending_positions')
    const pending = saved ? JSON.parse(saved) : []
    pending.push(extractedPosition)
    localStorage.setItem('pending_positions', JSON.stringify(pending))
    toast.success('Position saved to pending additions')
    setTranscript('')
    setEditedTranscript('')
    setExtractedPosition(null)
  }

  const reset = () => {
    setExtractedPosition(null)
    setTranscript('')
    setEditedTranscript('')
  }

  const updateField = <K extends keyof ExtractedPosition>(key: K, value: ExtractedPosition[K]) => {
    if (!extractedPosition) return
    setExtractedPosition({ ...extractedPosition, [key]: value })
  }

  return (
    <PageShell
      icon={<BookOpen strokeWidth={1.5} />}
      titlePrefix="Build"
      titleAccent="Repository"
      subtitle="Voice-record your work experience. AI structures it for you."
      status="Voice capture"
      backHref="/"
      backLabel="Back to Home"
    >
      {!transcript && (
        <>
          <section className="page-content-section">
            <div className="how-it-works">
              <span className="how-it-works-label">How it works</span>
              <div className="how-it-works-steps">
                {HOW_IT_WORKS.map(([n, label]) => (
                  <div key={n} className="hiw-step">
                    <span className="hiw-num">{n}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="page-content-section">
            <VoiceRecorder onTranscript={handleTranscript} loading={loading} />
          </section>
        </>
      )}

      {transcript && !extractedPosition && (
        <section className="page-content-section space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Review Transcript
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Edit if needed, then click &quot;Extract Data&quot; to structure this into your repository format.
            </p>
            <Textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="min-h-[256px] resize-y"
            />
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={reset}>
              Start Over
            </Button>
            <Button
              onClick={handleExtract}
              disabled={loading || !editedTranscript.trim()}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Extracting Data…</span>
                </>
              ) : (
                'Extract Data'
              )}
            </Button>
          </div>
        </section>
      )}

      {extractedPosition && (
        <section className="page-content-section space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Extracted Position Data
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Review the structured data below. You can edit fields if needed before saving.
            </p>

            <div className="space-y-4">
              <Field label="Title">
                <Input
                  value={extractedPosition.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Company">
                  <Input
                    value={extractedPosition.company}
                    onChange={(e) => updateField('company', e.target.value)}
                  />
                </Field>
                <Field label="Location">
                  <Input
                    value={extractedPosition.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date (YYYY-MM)">
                  <Input
                    value={extractedPosition.start_date}
                    onChange={(e) => updateField('start_date', e.target.value)}
                  />
                </Field>
                <Field label="End Date (YYYY-MM or empty for current)">
                  <Input
                    value={extractedPosition.end_date || ''}
                    onChange={(e) => updateField('end_date', e.target.value || null)}
                  />
                </Field>
              </div>

              <Field label="Context">
                <Textarea
                  rows={2}
                  value={extractedPosition.context}
                  onChange={(e) => updateField('context', e.target.value)}
                />
              </Field>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                  Impact Statements ({extractedPosition.impact_statements?.length || 0})
                </label>
                <div className="space-y-2">
                  {extractedPosition.impact_statements?.map((statement, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)]"
                    >
                      <p className="text-[var(--text-primary)] text-sm mb-2">{statement.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {statement.tags?.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={reset}>
              Start Over
            </Button>
            <Button
              onClick={handleSave}
              size="lg"
              className="bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-[var(--accent-green-fg)]"
            >
              Save to Repository
            </Button>
          </div>
        </section>
      )}
    </PageShell>
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

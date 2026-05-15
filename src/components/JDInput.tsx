'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Spinner from './Spinner'

interface JDInputProps {
  onAnalyze: (jobDescription: string) => void
  loading: boolean
}

const DRAFT_KEY = 'nexus.draft.jd'

export default function JDInput({ onAnalyze, loading }: JDInputProps) {
  const [jobDescription, setJobDescription] = useState('')

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) setJobDescription(draft)
    } catch {
      // ignore
    }
  }, [])

  // Persist draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, jobDescription)
    } catch {
      // ignore quota errors
    }
  }, [jobDescription])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (jobDescription.trim()) {
      onAnalyze(jobDescription)
    }
  }

  const charCount = jobDescription.length
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0
  const showShortHint = charCount > 0 && charCount < 200
  const tooLong = charCount > 10000
  const disabled = loading || charCount < 50

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label
        htmlFor="job-description"
        className="text-sm font-medium text-[var(--text-primary)]"
      >
        Paste Job Description
      </label>
      <Textarea
        id="job-description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the full job description here..."
        className="min-h-[320px] resize-y leading-relaxed text-base"
        disabled={loading}
      />
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] tabular-nums">
        <span>
          {charCount.toLocaleString()} characters · {wordCount.toLocaleString()} words
        </span>
        {showShortHint && (
          <span className="text-[var(--accent-amber)]">
            Tip: paste the full JD for better results
          </span>
        )}
        {tooLong && (
          <span className="text-[var(--accent-amber)] inline-flex items-center gap-1">
            <AlertTriangle className="size-3" /> Very long job description
          </span>
        )}
      </div>
      <Button
        type="submit"
        disabled={disabled}
        size="lg"
        className="mt-4 w-full text-base font-medium"
      >
        {loading ? (
          <>
            <Spinner size="sm" />
            <span>Analyzing Job Description...</span>
          </>
        ) : (
          'Analyze Job Description'
        )}
      </Button>
    </form>
  )
}

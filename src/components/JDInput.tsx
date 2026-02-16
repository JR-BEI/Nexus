'use client'

import { useState } from 'react'
import Spinner from './Spinner'

interface JDInputProps {
  onAnalyze: (jobDescription: string) => void
  loading: boolean
}

export default function JDInput({ onAnalyze, loading }: JDInputProps) {
  const [jobDescription, setJobDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (jobDescription.trim()) {
      onAnalyze(jobDescription)
    }
  }

  const charCount = jobDescription.length
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="job-description"
            className="block text-sm font-medium text-neutral-200 mb-2"
          >
            Paste Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-96 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all"
            disabled={loading}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
            <span>
              {charCount.toLocaleString()} characters · {wordCount.toLocaleString()} words
            </span>
            {charCount > 10000 && (
              <span className="text-amber-500">⚠ Very long job description</span>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !jobDescription.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Analyzing Job Description...</span>
            </>
          ) : (
            'Analyze Job Description'
          )}
        </button>
      </form>
    </div>
  )
}

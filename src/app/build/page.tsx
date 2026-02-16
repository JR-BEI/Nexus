'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VoiceRecorder from '@/components/VoiceRecorder'
import Spinner from '@/components/Spinner'

export default function BuildPage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [editedTranscript, setEditedTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractedPosition, setExtractedPosition] = useState<any>(null)

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
        body: JSON.stringify({ transcript: editedTranscript })
      })

      if (!response.ok) {
        throw new Error('Extraction failed')
      }

      const data = await response.json()
      setExtractedPosition(data.position)
    } catch (error) {
      console.error('Extraction error:', error)
      alert('Failed to extract experience. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    // For MVP, just save to localStorage as "pending additions"
    const saved = localStorage.getItem('pending_positions')
    const pending = saved ? JSON.parse(saved) : []
    pending.push(extractedPosition)
    localStorage.setItem('pending_positions', JSON.stringify(pending))

    alert('Position saved! (Stored in localStorage as pending addition)')

    // Reset for next position
    setTranscript('')
    setEditedTranscript('')
    setExtractedPosition(null)
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-100 mb-2 flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              Build Repository
            </h1>
            <p className="text-neutral-400">
              Voice record your work experience and let AI structure it for you
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            ← Back to Home
          </button>
        </div>

        {/* Instructions */}
        {!transcript && (
          <div className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50 mb-8">
            <h2 className="text-lg font-semibold text-neutral-100 mb-3">
              How it works
            </h2>
            <ol className="space-y-2 text-neutral-300 text-sm list-decimal list-inside">
              <li>Click the microphone and describe a position you held</li>
              <li>Include: company name, your title, dates, and what you accomplished</li>
              <li>Review and edit the transcript</li>
              <li>AI will extract structured data matching your repository format</li>
              <li>Confirm and save to add it to your repository</li>
            </ol>
          </div>
        )}

        {/* Voice Recorder */}
        {!transcript && (
          <div className="p-12 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
            <VoiceRecorder onTranscript={handleTranscript} loading={loading} />
          </div>
        )}

        {/* Transcript Editor */}
        {transcript && !extractedPosition && (
          <div className="space-y-4">
            <div className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
              <h2 className="text-xl font-semibold text-neutral-100 mb-4">
                Review Transcript
              </h2>
              <p className="text-neutral-400 text-sm mb-4">
                Edit if needed, then click "Extract Data" to structure this into your repository format.
              </p>
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all"
              />
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setTranscript('')
                  setEditedTranscript('')
                }}
                className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-xl transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                Start Over
              </button>
              <button
                onClick={handleExtract}
                disabled={loading || !editedTranscript.trim()}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Extracting Data...</span>
                  </>
                ) : (
                  'Extract Data'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Extracted Position Preview */}
        {extractedPosition && (
          <div className="space-y-4">
            <div className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
              <h2 className="text-xl font-semibold text-neutral-100 mb-4">
                Extracted Position Data
              </h2>
              <p className="text-neutral-400 text-sm mb-6">
                Review the structured data below. You can edit fields if needed before saving.
              </p>

              {/* Position Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={extractedPosition.title}
                    onChange={(e) =>
                      setExtractedPosition({ ...extractedPosition, title: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={extractedPosition.company}
                      onChange={(e) =>
                        setExtractedPosition({ ...extractedPosition, company: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={extractedPosition.location}
                      onChange={(e) =>
                        setExtractedPosition({ ...extractedPosition, location: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Start Date (YYYY-MM)
                    </label>
                    <input
                      type="text"
                      value={extractedPosition.start_date}
                      onChange={(e) =>
                        setExtractedPosition({ ...extractedPosition, start_date: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      End Date (YYYY-MM or leave empty for current)
                    </label>
                    <input
                      type="text"
                      value={extractedPosition.end_date || ''}
                      onChange={(e) =>
                        setExtractedPosition({
                          ...extractedPosition,
                          end_date: e.target.value || null
                        })
                      }
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Context
                  </label>
                  <textarea
                    value={extractedPosition.context}
                    onChange={(e) =>
                      setExtractedPosition({ ...extractedPosition, context: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Impact Statements ({extractedPosition.impact_statements?.length || 0})
                  </label>
                  <div className="space-y-2">
                    {extractedPosition.impact_statements?.map((statement: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg"
                      >
                        <p className="text-neutral-100 text-sm mb-2">{statement.text}</p>
                        <div className="flex flex-wrap gap-2">
                          {statement.tags?.map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setExtractedPosition(null)
                  setTranscript('')
                  setEditedTranscript('')
                }}
                className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-xl transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                Start Over
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all hover:shadow-lg hover:shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                Save to Repository
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

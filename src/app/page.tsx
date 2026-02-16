'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Analysis } from '@/types'

export default function Home() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])

  useEffect(() => {
    // Load past analyses from localStorage
    const saved = localStorage.getItem('analyses')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAnalyses(parsed)
      } catch (error) {
        console.error('Error loading analyses:', error)
      }
    }
  }, [])

  const handleDeleteAnalysis = (id: string) => {
    const updated = analyses.filter((a) => a.id !== id)
    setAnalyses(updated)
    localStorage.setItem('analyses', JSON.stringify(updated))
  }

  const handleViewAnalysis = (id: string) => {
    router.push(`/analyze?id=${id}`)
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-neutral-100 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">⚡</span>
            Nexus
          </h1>
          <p className="text-lg text-neutral-400 mb-8">
            AI-powered resume tailoring for your next role
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/analyze')}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/20 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              + New Analysis
            </button>
            <button
              onClick={() => router.push('/build')}
              className="px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-xl transition-all text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              🎙️ Build Repository
            </button>
          </div>
        </div>

        {/* Past Analyses */}
        {analyses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-neutral-300 mb-4">
              Past Analyses
            </h2>
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-5 bg-neutral-800/50 rounded-xl border border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-neutral-100 mb-1 truncate">
                        {analysis.job_title}
                      </h3>
                      <p className="text-neutral-400 text-sm mb-1.5">
                        {analysis.company}
                      </p>
                      <p className="text-neutral-500 text-xs">
                        {new Date(analysis.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleViewAnalysis(analysis.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className="px-4 py-2 bg-neutral-700 hover:bg-red-600 text-neutral-300 hover:text-white text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analyses.length === 0 && (
          <div className="text-center py-16 bg-neutral-800/30 rounded-xl border border-neutral-700/50">
            <div className="text-neutral-600 text-5xl mb-4">📋</div>
            <p className="text-neutral-400 text-lg mb-2">
              No past analyses yet
            </p>
            <p className="text-neutral-500 text-sm">
              Create your first analysis to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

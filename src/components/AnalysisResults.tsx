'use client'

import type { JDAnalysis, MatchedBlock } from '@/types'
import Spinner from './Spinner'

interface AnalysisResultsProps {
  jdAnalysis: JDAnalysis
  matchedBlocks: MatchedBlock[]
  summary: string
  loading: boolean
}

export default function AnalysisResults({
  jdAnalysis,
  matchedBlocks,
  summary,
  loading
}: AnalysisResultsProps) {
  if (loading) {
    return (
      <div className="w-full p-8 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Spinner size="lg" />
          <div className="text-neutral-300 font-medium">Matching against repository...</div>
          <div className="text-neutral-500 text-sm">This may take a few moments</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* JD Analysis */}
      <div className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
        <h2 className="text-xl font-semibold text-neutral-100 mb-5">
          Job Analysis
        </h2>
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Role</h3>
            <p className="text-neutral-100 text-lg">
              {jdAnalysis.role_title} <span className="text-neutral-400">({jdAnalysis.role_level})</span>
            </p>
          </div>
          {jdAnalysis.company && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                Company
              </h3>
              <p className="text-neutral-100 text-lg">{jdAnalysis.company}</p>
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {jdAnalysis.required_skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm rounded-lg font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Key Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {jdAnalysis.key_themes.map((theme, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-neutral-700 border border-neutral-600 text-neutral-200 text-sm rounded-lg"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match Summary */}
      <div className="p-6 bg-green-500/5 rounded-xl border border-green-500/20">
        <h2 className="text-xl font-semibold text-neutral-100 mb-3 flex items-center gap-2">
          <span className="text-green-400">✓</span>
          Overall Fit
        </h2>
        <p className="text-neutral-300 leading-relaxed">{summary}</p>
      </div>

      {/* Matched Blocks */}
      <div className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
        <h2 className="text-xl font-semibold text-neutral-100 mb-5">
          Matched Experience <span className="text-neutral-400 text-base font-normal">({matchedBlocks.length} statements)</span>
        </h2>
        <div className="space-y-3">
          {matchedBlocks.map((block, i) => (
            <div
              key={i}
              className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-700/50 hover:border-neutral-600 transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-400">
                    {block.company} <span className="text-neutral-600">·</span> {block.position_title}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-300 text-xs rounded-lg font-semibold flex-shrink-0">
                  {block.relevance_score}% match
                </span>
              </div>
              <p className="text-neutral-100 mb-3 leading-relaxed">{block.statement_text}</p>
              <p className="text-sm text-neutral-400 italic leading-relaxed">
                💡 {block.match_reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

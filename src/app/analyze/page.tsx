'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import JDInput from '@/components/JDInput'
import AnalysisResults from '@/components/AnalysisResults'
import ResumeOutput from '@/components/ResumeOutput'
import CoverLetterOutput from '@/components/CoverLetterOutput'
import StrategyBrief from '@/components/StrategyBrief'
import Spinner from '@/components/Spinner'
import type { JDAnalysis, MatchedBlock, Analysis } from '@/types'

type Step = 'input' | 'analysis' | 'outputs'
type OutputTab = 'resume' | 'cover' | 'strategy'

export default function AnalyzePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('input')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<OutputTab>('resume')
  const [viewingAnalysisId, setViewingAnalysisId] = useState<string | null>(null)

  // Data state
  const [jobDescription, setJobDescription] = useState('')
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysis | null>(null)
  const [matchedBlocks, setMatchedBlocks] = useState<MatchedBlock[]>([])
  const [matchSummary, setMatchSummary] = useState('')
  const [resume, setResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [strategyBrief, setStrategyBrief] = useState('')

  // Load analysis from localStorage if ID is present in URL
  useEffect(() => {
    const analysisId = searchParams.get('id')
    if (analysisId) {
      const saved = localStorage.getItem('analyses')
      if (saved) {
        try {
          const analyses: Analysis[] = JSON.parse(saved)
          const analysis = analyses.find((a) => a.id === analysisId)

          if (analysis) {
            // Populate all state from saved analysis
            setJobDescription(analysis.jd_text)
            setJdAnalysis(analysis.jd_analysis)
            setMatchedBlocks(analysis.matched_blocks)
            setMatchSummary('')
            setResume(analysis.resume || '')
            setCoverLetter(analysis.cover_letter || '')
            setStrategyBrief(analysis.strategy_brief || '')
            setViewingAnalysisId(analysisId)

            // Skip to outputs step
            setStep('outputs')
          }
        } catch (error) {
          console.error('Error loading analysis:', error)
        }
      }
    }
  }, [searchParams])

  const handleAnalyzeJD = async (jd: string) => {
    setLoading(true)
    setJobDescription(jd)

    try {
      // Step 1: Analyze JD
      const analyzeResponse = await fetch('/api/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd })
      })

      if (!analyzeResponse.ok) throw new Error('Failed to analyze JD')

      const analysis: JDAnalysis = await analyzeResponse.json()
      console.log('JD Analysis received:', analysis)
      setJdAnalysis(analysis)

      // Step 2: Match repository
      const matchResponse = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdAnalysis: analysis })
      })

      if (!matchResponse.ok) throw new Error('Failed to match repository')

      const matchData = await matchResponse.json()
      console.log('Match data received:', matchData)
      setMatchedBlocks(matchData.matched_blocks)
      setMatchSummary(matchData.summary)

      console.log('Setting step to analysis')
      setStep('analysis')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOutputs = async () => {
    if (!jdAnalysis || matchedBlocks.length === 0) return

    setLoading(true)

    try {
      // Generate all three outputs in parallel
      const [resumeRes, coverRes, strategyRes] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'resume',
            jd_analysis: jdAnalysis,
            matched_blocks: matchedBlocks
          })
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cover_letter',
            jd_analysis: jdAnalysis,
            matched_blocks: matchedBlocks
          })
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'strategy_brief',
            jd_analysis: jdAnalysis,
            matched_blocks: matchedBlocks
          })
        })
      ])

      if (!resumeRes.ok || !coverRes.ok || !strategyRes.ok) {
        throw new Error('Failed to generate outputs')
      }

      const [resumeData, coverData, strategyData] = await Promise.all([
        resumeRes.json(),
        coverRes.json(),
        strategyRes.json()
      ])

      setResume(resumeData.content)
      setCoverLetter(coverData.content)
      setStrategyBrief(strategyData.content)

      // Save to localStorage
      const analysis: Analysis = {
        id: Date.now().toString(),
        job_title: jdAnalysis.role_title,
        company: jdAnalysis.company || 'Unknown',
        date: new Date().toISOString(),
        jd_text: jobDescription,
        jd_analysis: jdAnalysis,
        matched_blocks: matchedBlocks,
        resume: resumeData.content,
        cover_letter: coverData.content,
        strategy_brief: strategyData.content
      }

      const saved = localStorage.getItem('analyses')
      const analyses = saved ? JSON.parse(saved) : []
      analyses.unshift(analysis)
      localStorage.setItem('analyses', JSON.stringify(analyses))

      setStep('outputs')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred generating outputs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to determine step completion
  const isStepComplete = (stepName: Step) => {
    if (stepName === 'input') return step !== 'input'
    if (stepName === 'analysis') return step === 'outputs'
    return false
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-100 mb-2 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Nexus
            </h1>
            <p className="text-neutral-400">
              AI-powered resume tailoring for your next role
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800"
          >
            ← Back to Home
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10 flex items-center justify-center space-x-3">
          {/* Step 1: Input */}
          <div
            className={`flex items-center ${
              step === 'input' ? 'text-blue-400' : isStepComplete('input') ? 'text-green-400' : 'text-neutral-500'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step === 'input'
                  ? 'border-blue-500 bg-blue-500/20 scale-105'
                  : isStepComplete('input')
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-neutral-600'
              }`}
            >
              {isStepComplete('input') ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className={step === 'input' ? 'font-bold' : ''}>1</span>
              )}
            </div>
            <span className={`ml-2 text-sm ${step === 'input' ? 'font-bold' : 'font-medium'}`}>Input</span>
          </div>

          {/* Connector */}
          <div className={`w-12 h-0.5 transition-colors ${isStepComplete('input') ? 'bg-green-500' : 'bg-neutral-700'}`}></div>

          {/* Step 2: Analysis */}
          <div
            className={`flex items-center ${
              step === 'analysis' ? 'text-blue-400' : isStepComplete('analysis') ? 'text-green-400' : 'text-neutral-500'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step === 'analysis'
                  ? 'border-blue-500 bg-blue-500/20 scale-105'
                  : isStepComplete('analysis')
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-neutral-600'
              }`}
            >
              {isStepComplete('analysis') ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className={step === 'analysis' ? 'font-bold' : ''}>2</span>
              )}
            </div>
            <span className={`ml-2 text-sm ${step === 'analysis' ? 'font-bold' : 'font-medium'}`}>Analysis</span>
          </div>

          {/* Connector */}
          <div className={`w-12 h-0.5 transition-colors ${isStepComplete('analysis') ? 'bg-green-500' : 'bg-neutral-700'}`}></div>

          {/* Step 3: Outputs */}
          <div
            className={`flex items-center ${
              step === 'outputs' ? 'text-blue-400' : 'text-neutral-500'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step === 'outputs'
                  ? 'border-blue-500 bg-blue-500/20 scale-105'
                  : 'border-neutral-600'
              }`}
            >
              <span className={step === 'outputs' ? 'font-bold' : ''}>3</span>
            </div>
            <span className={`ml-2 text-sm ${step === 'outputs' ? 'font-bold' : 'font-medium'}`}>Outputs</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 'input' && (
          <>
            {loading ? (
              <div className="w-full p-8 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <Spinner size="lg" />
                  <div className="text-center space-y-2">
                    <div className="text-neutral-100 font-semibold text-lg">Analyzing Job Description</div>
                    <div className="text-neutral-400 text-sm">Extracting requirements and matching your experience...</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            ) : (
              <JDInput onAnalyze={handleAnalyzeJD} loading={loading} />
            )}
          </>
        )}

        {step === 'analysis' && jdAnalysis && (
          <div className="space-y-6">
            <AnalysisResults
              jdAnalysis={jdAnalysis}
              matchedBlocks={matchedBlocks}
              summary={matchSummary}
              loading={false}
            />
            <div className="flex justify-center pt-2">
              <button
                onClick={handleGenerateOutputs}
                disabled={loading}
                className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Generating Outputs...</span>
                  </>
                ) : (
                  'Generate Resume & Outputs'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'outputs' && (
          <>
            {loading ? (
              <div className="w-full p-8 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <Spinner size="lg" />
                  <div className="text-center space-y-2">
                    <div className="text-neutral-100 font-semibold text-lg">Generating Your Outputs</div>
                    <div className="text-neutral-400 text-sm">Creating resume, cover letter, and strategy brief...</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="border-b border-neutral-700/50">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab('resume')}
                      className={`pb-3 px-4 text-base font-medium border-b-2 transition-all ${
                        activeTab === 'resume'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                      }`}
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => setActiveTab('cover')}
                      className={`pb-3 px-4 text-base font-medium border-b-2 transition-all ${
                        activeTab === 'cover'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                      }`}
                    >
                      Cover Letter
                    </button>
                    <button
                      onClick={() => setActiveTab('strategy')}
                      className={`pb-3 px-4 text-base font-medium border-b-2 transition-all ${
                        activeTab === 'strategy'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                      }`}
                    >
                      Strategy Brief
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'resume' && (
                  <ResumeOutput
                    content={resume}
                    companyName={jdAnalysis?.company}
                    matchedBlocks={matchedBlocks}
                  />
                )}
                {activeTab === 'cover' && (
                  <CoverLetterOutput
                    content={coverLetter}
                    companyName={jdAnalysis?.company}
                  />
                )}
                {activeTab === 'strategy' && (
                  <StrategyBrief content={strategyBrief} />
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 pt-6 border-t border-neutral-700/50 mt-8">
                  {viewingAnalysisId && (
                    <button
                      onClick={() => {
                        // Re-analyze with the same job description
                        setViewingAnalysisId(null)
                        setStep('input')
                        router.push('/analyze')
                        // Trigger analysis automatically
                        setTimeout(() => handleAnalyzeJD(jobDescription), 100)
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      Re-analyze
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewingAnalysisId(null)
                      router.push('/analyze')
                    }}
                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-xl transition-all font-medium"
                  >
                    Start New Analysis
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

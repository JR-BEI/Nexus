'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import JDInput from '@/components/JDInput'
import AnalysisResults from '@/components/AnalysisResults'
import ResumeOutput from '@/components/ResumeOutput'
import CoverLetterOutput from '@/components/CoverLetterOutput'
import StrategyBrief from '@/components/StrategyBrief'
import Spinner from '@/components/Spinner'
import { PageShell } from '@/components/ui/PageShell'
import { StepIndicator } from '@/components/StepIndicator'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { JDAnalysis, MatchedBlock, Analysis } from '@/types'

type Step = 'input' | 'analysis' | 'outputs'
type OutputTab = 'resume' | 'cover' | 'strategy'

const STEP_NUM: Record<Step, 1 | 2 | 3> = {
  input: 1,
  analysis: 2,
  outputs: 3,
}
const STEP_LABEL: Record<Step, string> = {
  input: 'Input',
  analysis: 'Analysis',
  outputs: 'Outputs',
}

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
            setJobDescription(analysis.jd_text)
            setJdAnalysis(analysis.jd_analysis)
            setMatchedBlocks(analysis.matched_blocks)
            setMatchSummary('')
            setResume(analysis.resume || '')
            setCoverLetter(analysis.cover_letter || '')
            setStrategyBrief(analysis.strategy_brief || '')
            setViewingAnalysisId(analysisId)
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
      const analyzeResponse = await fetch('/api/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd }),
      })
      if (!analyzeResponse.ok) throw new Error('Failed to analyze JD')

      const analysis: JDAnalysis = await analyzeResponse.json()
      setJdAnalysis(analysis)

      const matchResponse = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdAnalysis: analysis }),
      })
      if (!matchResponse.ok) throw new Error('Failed to match repository')

      const matchData = await matchResponse.json()
      setMatchedBlocks(matchData.matched_blocks)
      setMatchSummary(matchData.summary)
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
      const [resumeRes, coverRes, strategyRes] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'resume',
            jd_analysis: jdAnalysis,
            matched_blocks: matchedBlocks,
          }),
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cover_letter',
            jd_analysis: jdAnalysis,
            matched_blocks: matchedBlocks,
          }),
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'strategy_brief',
            jd_analysis: jdAnalysis,
            matched_blocks: matchedBlocks,
          }),
        }),
      ])

      if (!resumeRes.ok || !coverRes.ok || !strategyRes.ok) {
        throw new Error('Failed to generate outputs')
      }

      const [resumeData, coverData, strategyData] = await Promise.all([
        resumeRes.json(),
        coverRes.json(),
        strategyRes.json(),
      ])

      setResume(resumeData.content)
      setCoverLetter(coverData.content)
      setStrategyBrief(strategyData.content)

      const newAnalysis: Analysis = {
        id: Date.now().toString(),
        job_title: jdAnalysis.role_title,
        company: jdAnalysis.company || 'Unknown',
        date: new Date().toISOString(),
        jd_text: jobDescription,
        jd_analysis: jdAnalysis,
        matched_blocks: matchedBlocks,
        resume: resumeData.content,
        cover_letter: coverData.content,
        strategy_brief: strategyData.content,
      }

      const saved = localStorage.getItem('analyses')
      const analyses = saved ? JSON.parse(saved) : []
      analyses.unshift(newAnalysis)
      localStorage.setItem('analyses', JSON.stringify(analyses))

      setStep('outputs')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred generating outputs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentStep = STEP_NUM[step]
  const status =
    step === 'outputs' && jdAnalysis
      ? `Tailored for ${jdAnalysis.role_title}${jdAnalysis.company ? ` · ${jdAnalysis.company}` : ''}`
      : `Step ${currentStep} of 3 · ${STEP_LABEL[step]}`

  return (
    <PageShell
      titlePrefix="New"
      titleAccent="Analysis"
      subtitle="Paste a job description. Get a tailored resume, cover letter, and interview brief."
      status={status}
      backHref="/"
      backLabel="Back to Home"
    >
      <StepIndicator currentStep={currentStep} />

      {step === 'input' && (
        <section className="page-content-section">
          {loading ? (
            <LoadingCard
              title="Analyzing Job Description"
              body="Extracting requirements and matching your experience..."
            />
          ) : (
            <JDInput onAnalyze={handleAnalyzeJD} loading={loading} />
          )}
        </section>
      )}

      {step === 'analysis' && jdAnalysis && (
        <section className="page-content-section space-y-6">
          <AnalysisResults
            jdAnalysis={jdAnalysis}
            matchedBlocks={matchedBlocks}
            summary={matchSummary}
            loading={false}
          />
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleGenerateOutputs}
              disabled={loading}
              size="lg"
              className="text-base font-medium"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Generating Outputs...</span>
                </>
              ) : (
                'Generate Resume & Outputs'
              )}
            </Button>
          </div>
        </section>
      )}

      {step === 'outputs' && (
        <section className="page-content-section">
          {loading ? (
            <LoadingCard
              title="Generating Your Outputs"
              body="Creating resume, cover letter, and strategy brief..."
            />
          ) : (
            <div className="space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as OutputTab)}
              >
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                  <TabsTrigger value="cover">Cover Letter</TabsTrigger>
                  <TabsTrigger value="strategy">Strategy Brief</TabsTrigger>
                </TabsList>
                <TabsContent value="resume" className="mt-6">
                  <ResumeOutput
                    content={resume}
                    companyName={jdAnalysis?.company}
                    jobTitle={jdAnalysis?.role_title}
                    matchedBlocks={matchedBlocks}
                  />
                </TabsContent>
                <TabsContent value="cover" className="mt-6">
                  <CoverLetterOutput
                    content={coverLetter}
                    companyName={jdAnalysis?.company}
                  />
                </TabsContent>
                <TabsContent value="strategy" className="mt-6">
                  <StrategyBrief content={strategyBrief} />
                </TabsContent>
              </Tabs>

              <div className="outputs-footer pt-6 border-t border-[var(--border-subtle)]">
                {viewingAnalysisId && (
                  <Button
                    onClick={() => {
                      setViewingAnalysisId(null)
                      setStep('input')
                      router.push('/analyze')
                      setTimeout(() => handleAnalyzeJD(jobDescription), 100)
                    }}
                  >
                    Re-analyze
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setViewingAnalysisId(null)
                    router.push('/analyze')
                  }}
                >
                  Start New Analysis
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </PageShell>
  )
}

function LoadingCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="w-full p-8 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <Spinner size="lg" />
        <div className="text-center space-y-2">
          <div className="text-[var(--text-primary)] font-semibold text-lg">{title}</div>
          <div className="text-[var(--text-secondary)] text-sm">{body}</div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse delay-100" />
          <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse delay-200" />
        </div>
      </div>
    </div>
  )
}

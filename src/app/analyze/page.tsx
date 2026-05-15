'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ClipboardList, ArrowUpRight } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { ContextPreview } from '@/components/ContextPreview'
import { PrefillBanner } from '@/components/PrefillBanner'
import { SourceModal } from '@/components/SourceModal'
import { VersionPicker, RefineButton } from '@/components/RefineControls'
import { loadAllRepositoryEntries } from '@/lib/context/repositoryContext'
import {
  buildCompanyPromptBlock,
  findWatchlistById,
} from '@/lib/context/companyContext'
import { analysisRepo } from '@/lib/repos/analysisRepo'
import { applicationRepo } from '@/lib/repos/applicationRepo'
import { newAnalysisId, newApplicationId, newEventId, newVersionId } from '@/lib/id'
import {
  buildPreview,
  deleteDraft,
  getDraft,
  saveDraft,
  type AnalysisDraft,
} from '@/lib/drafts'
import type { JDAnalysis, MatchedBlock, Analysis as LegacyAnalysis } from '@/types'
import type {
  Analysis,
  AnalysisVersion,
  RepositoryEntry,
  TargetCompany,
  TrackerApplication,
} from '@/types/nexus'

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

const STATUS_LABEL: Record<TrackerApplication['status'], string> = {
  interested: 'Interested',
  applied: 'Applied',
  screening: 'Screening',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  'on-hold': 'On hold',
}

export default function AnalyzePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('input')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<OutputTab>('resume')
  const [viewingAnalysisId, setViewingAnalysisId] = useState<string | null>(null)

  // Data state (legacy shapes, still drive the in-flight flow)
  const [jobDescription, setJobDescription] = useState('')
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysis | null>(null)
  const [matchedBlocks, setMatchedBlocks] = useState<MatchedBlock[]>([])
  const [matchSummary, setMatchSummary] = useState('')
  const [resume, setResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [strategyBrief, setStrategyBrief] = useState('')

  // New connective-tissue state
  const [entries, setEntries] = useState<RepositoryEntry[]>([])
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())
  const [userAngle, setUserAngle] = useState('')
  const [prefillCompany, setPrefillCompany] = useState<TargetCompany | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [linkedApplication, setLinkedApplication] =
    useState<TrackerApplication | null>(null)
  const [sourceModalOpen, setSourceModalOpen] = useState(false)

  // Draft state (homepage "Continue draft" + autosave per doc 10).
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [draftInitialJD, setDraftInitialJD] = useState<string | undefined>(undefined)

  // Versioning state (doc 07). currentAnalysis owns the canonical outputs;
  // the resume/coverLetter/strategyBrief strings stay in sync with the
  // active version for backward compatibility with the existing renderers.
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null)
  const [activeVersionIds, setActiveVersionIds] = useState<{ resume: string; coverLetter: string; strategyBrief: string }>({
    resume: '',
    coverLetter: '',
    strategyBrief: '',
  })
  const [refiningType, setRefiningType] = useState<keyof Analysis['outputs'] | null>(null)

  // Load repository entries once on mount; default-select all.
  useEffect(() => {
    loadAllRepositoryEntries().then((all) => {
      setEntries(all)
      setSelectedEntryIds(new Set(all.map((e) => e.id)))
    })
  }, [])

  // Load draft if ?draft=<id> is present, else mint a fresh draft id.
  useEffect(() => {
    const draftParam = searchParams.get('draft')
    if (draftParam) {
      getDraft(draftParam).then((draft) => {
        if (!draft) {
          setDraftId(draftParam)
          setDraftHydrated(true)
          return
        }
        setDraftId(draft.id)
        setJobDescription(draft.jdText)
        setDraftInitialJD(draft.jdText)
        setUserAngle(draft.angle ?? '')
        if (draft.selectedEntryIds.length > 0) {
          setSelectedEntryIds(new Set(draft.selectedEntryIds))
        }
        if (draft.prefillCompanyId) {
          const seeded = findWatchlistById(draft.prefillCompanyId)
          if (seeded) setPrefillCompany(seeded)
        }
        setDraftHydrated(true)
      })
    } else {
      setDraftId(`draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`)
      setDraftHydrated(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced autosave whenever inputs change (only on the input step).
  useEffect(() => {
    if (!draftHydrated || !draftId) return
    if (step !== 'input') return
    if (!jobDescription.trim()) return
    const handle = setTimeout(() => {
      const draft: AnalysisDraft = {
        id: draftId,
        jdText: jobDescription,
        angle: userAngle.trim() || undefined,
        selectedEntryIds: Array.from(selectedEntryIds),
        prefillCompanyId: prefillCompany?.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preview: buildPreview(jobDescription),
      }
      saveDraft(draft).catch((err) => console.error('draft save failed:', err))
    }, 500)
    return () => clearTimeout(handle)
  }, [draftHydrated, draftId, step, jobDescription, userAngle, selectedEntryIds, prefillCompany])

  // Read query params for company prefill (doc 04).
  useEffect(() => {
    const companyId = searchParams.get('companyId')
    if (!companyId) return
    const seeded = findWatchlistById(companyId)
    if (seeded) {
      setPrefillCompany(seeded)
      return
    }
    // Fallback to params alone (no watchlist match) — minimal banner.
    const name = searchParams.get('company')
    const vertical = searchParams.get('vertical')
    const careersUrl = searchParams.get('careersUrl')
    if (name) {
      setPrefillCompany({
        id: companyId,
        name,
        vertical: vertical || 'unknown',
        fit: 0,
        tracked: false,
        passed: false,
        careersUrl: careersUrl || undefined,
      })
    }
  }, [searchParams])

  // Load existing analysis when ?id is present. Try new analysisRepo first,
  // fall back to legacy `analyses` localStorage.
  useEffect(() => {
    const analysisId = searchParams.get('id')
    if (!analysisId) return

    let cancelled = false
    ;(async () => {
      const fromNew = await analysisRepo.get(analysisId)
      if (!cancelled && fromNew) {
        hydrateFromNewAnalysis(fromNew)
        return
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem('analyses') : null
      if (!saved) return
      try {
        const arr: LegacyAnalysis[] = JSON.parse(saved)
        const found = arr.find((a) => a.id === analysisId)
        if (found && !cancelled) hydrateFromLegacyAnalysis(found)
      } catch {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [searchParams])

  // When an analysis is loaded/created, refresh linked application status.
  useEffect(() => {
    if (!currentAnalysisId) return
    applicationRepo.findByAnalysis(currentAnalysisId).then(setLinkedApplication)
  }, [currentAnalysisId])

  function hydrateFromNewAnalysis(a: Analysis) {
    setJobDescription(a.jdText)
    setJdAnalysis({
      role_title: a.extracted.role,
      role_level: a.extracted.seniority,
      company: a.extracted.company,
      required_skills: a.extracted.mustHaves,
      preferred_skills: a.extracted.niceToHaves,
      key_themes: a.extracted.keywords,
      cultural_signals: [],
    })
    setMatchedBlocks([])
    setMatchSummary('')
    const resumeLast = a.outputs.resume.at(-1)
    const coverLast = a.outputs.coverLetter.at(-1)
    const stratLast = a.outputs.strategyBrief.at(-1)
    setResume(resumeLast?.content ?? '')
    setCoverLetter(coverLast?.content ?? '')
    setStrategyBrief(stratLast?.content ?? '')
    setCurrentAnalysis(a)
    setActiveVersionIds({
      resume: resumeLast?.id ?? '',
      coverLetter: coverLast?.id ?? '',
      strategyBrief: stratLast?.id ?? '',
    })
    setUserAngle(a.userAngle ?? '')
    setSelectedEntryIds(new Set(a.linkedRepositoryEntries))
    setCurrentAnalysisId(a.id)
    setViewingAnalysisId(a.id)
    setStep('outputs')
  }

  function hydrateFromLegacyAnalysis(a: LegacyAnalysis) {
    setJobDescription(a.jd_text)
    setJdAnalysis(a.jd_analysis)
    setMatchedBlocks(a.matched_blocks)
    setMatchSummary('')
    setResume(a.resume || '')
    setCoverLetter(a.cover_letter || '')
    setStrategyBrief(a.strategy_brief || '')
    setCurrentAnalysisId(a.id)
    setViewingAnalysisId(a.id)
    setStep('outputs')
  }

  const clearPrefill = useCallback(() => {
    setPrefillCompany(null)
    // Strip company params from the URL without leaving history noise.
    router.replace('/analyze', { scroll: false })
  }, [router])

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
      toast.error('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOutputs = async () => {
    if (!jdAnalysis || matchedBlocks.length === 0) return
    setLoading(true)

    const companyContext = prefillCompany ? buildCompanyPromptBlock(prefillCompany) : ''
    const selectedIds = Array.from(selectedEntryIds)

    try {
      const baseBody = {
        jd_analysis: jdAnalysis,
        matched_blocks: matchedBlocks,
        user_angle: userAngle.trim() || undefined,
        company_context: companyContext || undefined,
        selected_entry_ids: selectedIds.length ? selectedIds : undefined,
      }

      const [resumeRes, coverRes, strategyRes] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'resume', ...baseBody }),
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'cover_letter', ...baseBody }),
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'strategy_brief', ...baseBody }),
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

      // Single shared ID across legacy + new repo so cross-references resolve.
      const id = newAnalysisId()
      const now = Date.now()

      // Legacy save (keeps homepage Past Analyses + ?id loader working).
      const legacyEntry: LegacyAnalysis = {
        id,
        job_title: jdAnalysis.role_title,
        company: jdAnalysis.company || 'Unknown',
        date: new Date(now).toISOString(),
        jd_text: jobDescription,
        jd_analysis: jdAnalysis,
        matched_blocks: matchedBlocks,
        resume: resumeData.content,
        cover_letter: coverData.content,
        strategy_brief: strategyData.content,
      }
      try {
        const saved = localStorage.getItem('analyses')
        const list = saved ? JSON.parse(saved) : []
        list.unshift(legacyEntry)
        localStorage.setItem('analyses', JSON.stringify(list))
      } catch (e) {
        console.error('legacy analysis save failed:', e)
      }

      // New analysisRepo save (powers tracker linkage, doc 03/04).
      const newEntry: Analysis = {
        id,
        createdAt: now,
        updatedAt: now,
        jdText: jobDescription,
        userAngle: userAngle.trim() || undefined,
        extracted: {
          role: jdAnalysis.role_title,
          company: jdAnalysis.company || prefillCompany?.name || '',
          seniority: jdAnalysis.role_level,
          mustHaves: jdAnalysis.required_skills ?? [],
          niceToHaves: jdAnalysis.preferred_skills ?? [],
          keywords: jdAnalysis.key_themes ?? [],
          redFlags: [],
        },
        outputs: {
          resume: [
            { id: newVersionId(), createdAt: now, content: resumeData.content, label: 'Original' },
          ],
          coverLetter: [
            { id: newVersionId(), createdAt: now, content: coverData.content, label: 'Original' },
          ],
          strategyBrief: [
            { id: newVersionId(), createdAt: now, content: strategyData.content, label: 'Original' },
          ],
        },
        linkedRepositoryEntries: selectedIds,
        linkedCompanyId: prefillCompany?.id,
      }
      await analysisRepo.save(newEntry)

      // Successful generation — clear the in-progress draft.
      if (draftId) {
        deleteDraft(draftId).catch((err) => console.error('draft delete failed:', err))
      }

      setCurrentAnalysis(newEntry)
      setActiveVersionIds({
        resume: newEntry.outputs.resume[0]?.id ?? '',
        coverLetter: newEntry.outputs.coverLetter[0]?.id ?? '',
        strategyBrief: newEntry.outputs.strategyBrief[0]?.id ?? '',
      })
      setCurrentAnalysisId(id)
      setStep('outputs')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Map output tab key → API type label.
  const REFINE_API_TYPE: Record<keyof Analysis['outputs'], 'resume' | 'cover_letter' | 'strategy_brief'> = {
    resume: 'resume',
    coverLetter: 'cover_letter',
    strategyBrief: 'strategy_brief',
  }

  const setActiveContent = (key: keyof Analysis['outputs'], content: string) => {
    if (key === 'resume') setResume(content)
    else if (key === 'coverLetter') setCoverLetter(content)
    else setStrategyBrief(content)
  }

  const handleSelectVersion = (key: keyof Analysis['outputs'], versionId: string) => {
    if (!currentAnalysis) return
    const v = currentAnalysis.outputs[key].find((x) => x.id === versionId)
    if (!v) return
    setActiveVersionIds((prev) => ({ ...prev, [key]: versionId }))
    setActiveContent(key, v.content)
  }

  const handleRefine = async (
    key: keyof Analysis['outputs'],
    label: string,
    instruction: string
  ) => {
    if (!currentAnalysis) return
    const currentVersion = currentAnalysis.outputs[key].find(
      (v) => v.id === activeVersionIds[key]
    )
    if (!currentVersion) return
    setRefiningType(key)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_type: REFINE_API_TYPE[key],
          current_content: currentVersion.content,
          instruction,
        }),
      })
      if (!res.ok) throw new Error('refine failed')
      const data = await res.json()
      const now = Date.now()
      const newVersion: AnalysisVersion = {
        id: newVersionId(),
        createdAt: now,
        content: data.content,
        label,
        parentVersionId: currentVersion.id,
      }
      const updated: Analysis = {
        ...currentAnalysis,
        outputs: {
          ...currentAnalysis.outputs,
          [key]: [...currentAnalysis.outputs[key], newVersion],
        },
      }
      await analysisRepo.save(updated)
      setCurrentAnalysis(updated)
      setActiveVersionIds((prev) => ({ ...prev, [key]: newVersion.id }))
      setActiveContent(key, newVersion.content)
      toast.success(`Created v${updated.outputs[key].length} — ${label}`)
    } catch (err) {
      console.error(err)
      toast.error('Refinement failed. Try again.')
    } finally {
      setRefiningType(null)
    }
  }

  const handleTrackClick = () => {
    if (!currentAnalysisId) return
    if (linkedApplication) {
      router.push(`/tracker?app=${linkedApplication.id}`)
      return
    }
    setSourceModalOpen(true)
  }

  const handleTrackConfirm = async (source: string) => {
    setSourceModalOpen(false)
    if (!currentAnalysisId || !jdAnalysis) return

    const now = Date.now()
    const app: TrackerApplication = {
      id: newApplicationId(),
      createdAt: now,
      updatedAt: now,
      company: jdAnalysis.company || prefillCompany?.name || 'Unknown',
      role: jdAnalysis.role_title,
      status: 'interested',
      source: source || undefined,
      linkedAnalysisId: currentAnalysisId,
      linkedCompanyId: prefillCompany?.id,
      linkedContactIds: [],
      events: [
        {
          id: newEventId(),
          at: now,
          type: 'status_change',
          toStatus: 'interested',
          content: `Created from analysis "${jdAnalysis.role_title} at ${jdAnalysis.company || 'Unknown'}"`,
        },
      ],
      notes: '',
    }
    await applicationRepo.save(app)

    const existing = await analysisRepo.get(currentAnalysisId)
    if (existing) {
      await analysisRepo.save({ ...existing, linkedTrackerId: app.id })
    }

    setLinkedApplication(app)
    toast.success('Added to Tracker', {
      action: {
        label: 'Open',
        onClick: () => router.push(`/tracker?app=${app.id}`),
      },
    })
  }

  const currentStep = STEP_NUM[step]
  const status =
    step === 'outputs' && jdAnalysis
      ? `Tailored for ${jdAnalysis.role_title}${jdAnalysis.company ? ` · ${jdAnalysis.company}` : ''}`
      : `Step ${currentStep} of 3 · ${STEP_LABEL[step]}`

  // Map of entry id → entry for "Tailored from" chips on the outputs step.
  const entryMap = new Map(entries.map((e) => [e.id, e]))
  const usedEntryIds = currentAnalysisId
    ? Array.from(selectedEntryIds)
    : []

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
        <section className="page-content-section space-y-4">
          {prefillCompany && (
            <PrefillBanner company={prefillCompany} onClear={clearPrefill} />
          )}

          {loading ? (
            <LoadingCard
              title="Analyzing Job Description"
              body="Extracting requirements and matching your experience..."
            />
          ) : (
            <>
              <JDInput
                onAnalyze={handleAnalyzeJD}
                loading={loading}
                initialValue={draftInitialJD}
                onTextChange={setJobDescription}
              />

              <ContextPreview
                entries={entries}
                selectedIds={selectedEntryIds}
                onChange={setSelectedEntryIds}
              />

              <div>
                <label
                  htmlFor="angle"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                >
                  Emphasize a particular angle?{' '}
                  <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                </label>
                <Input
                  id="angle"
                  value={userAngle}
                  onChange={(e) => setUserAngle(e.target.value)}
                  placeholder="e.g. Lean into AI/ML work over insurance domain"
                />
              </div>
            </>
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
              {usedEntryIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] flex-wrap">
                  <span className="font-medium">Tailored from:</span>
                  {usedEntryIds.slice(0, 8).map((id) => {
                    const entry = entryMap.get(id)
                    if (!entry) return null
                    return (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                      >
                        {entry.company}
                      </span>
                    )
                  })}
                  {usedEntryIds.length > 8 && (
                    <span className="text-[var(--text-tertiary)]">
                      +{usedEntryIds.length - 8} more
                    </span>
                  )}
                </div>
              )}

              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as OutputTab)}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <TabsList className="justify-start">
                    <TabsTrigger value="resume">Resume</TabsTrigger>
                    <TabsTrigger value="cover">Cover Letter</TabsTrigger>
                    <TabsTrigger value="strategy">Strategy Brief</TabsTrigger>
                  </TabsList>
                  {currentAnalysis && (() => {
                    const tabKey: keyof Analysis['outputs'] =
                      activeTab === 'resume' ? 'resume' : activeTab === 'cover' ? 'coverLetter' : 'strategyBrief'
                    const versions = currentAnalysis.outputs[tabKey]
                    return (
                      <div className="flex items-center gap-2">
                        <VersionPicker
                          versions={versions}
                          activeId={activeVersionIds[tabKey]}
                          onSelect={(id) => handleSelectVersion(tabKey, id)}
                        />
                        <RefineButton
                          disabled={refiningType !== null}
                          onRefine={(label, instruction) => handleRefine(tabKey, label, instruction)}
                        />
                      </div>
                    )
                  })()}
                </div>

                {refiningType && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-3">
                    <Spinner size="sm" />
                    Refining {refiningType === 'coverLetter' ? 'cover letter' : refiningType === 'strategyBrief' ? 'strategy brief' : 'resume'}…
                  </div>
                )}

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

              <div className="outputs-footer pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
                {currentAnalysisId && (
                  linkedApplication ? (
                    <Link
                      href={`/tracker?app=${linkedApplication.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-green)] text-sm hover:bg-emerald-500/15"
                    >
                      ✓ Tracked as {STATUS_LABEL[linkedApplication.status]}
                      <ArrowUpRight className="size-3.5 opacity-60" />
                    </Link>
                  ) : (
                    <Button onClick={handleTrackClick}>
                      <ClipboardList className="size-4 mr-1" />
                      Track this application
                    </Button>
                  )
                )}

                {viewingAnalysisId && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setViewingAnalysisId(null)
                      setCurrentAnalysisId(null)
                      setLinkedApplication(null)
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
                    setCurrentAnalysisId(null)
                    setLinkedApplication(null)
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

      <SourceModal
        open={sourceModalOpen}
        onConfirm={handleTrackConfirm}
        onCancel={() => setSourceModalOpen(false)}
      />
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

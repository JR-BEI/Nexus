'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Analysis, Application } from '@/types'
import { APPLICATION_STATUSES } from '@/lib/tracker'
import {
  Sparkles,
  ClipboardList,
  Mic,
  Target,
  Compass,
  FileText,
} from 'lucide-react'
import AuroraBackground from '@/components/ui/AuroraBackground'
import AnimatedGridPattern from '@/components/ui/AnimatedGridPattern'
import BentoCard from '@/components/ui/BentoCard'

export default function Home() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    try {
      const a = localStorage.getItem('analyses')
      if (a) setAnalyses(JSON.parse(a))
      const apps = localStorage.getItem('tracker.applications')
      if (apps) setApplications(JSON.parse(apps))
    } catch (error) {
      console.error('Error loading from localStorage:', error)
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

  const statusFor = (analysisId: string) => {
    const app = applications.find((a) => a.analysis_id === analysisId)
    if (!app) return null
    return APPLICATION_STATUSES.find((s) => s.value === app.status) ?? null
  }

  return (
    <div className="relative min-h-screen text-foreground overflow-hidden">
      {/* Ambient layers (body provides the grid+wash; these add depth on the homepage hero) */}
      <AnimatedGridPattern numSquares={40} maxOpacity={0.12} className="z-0" />

      <div className="relative z-10">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="page-content-section relative px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <AuroraBackground />
          <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center">
            <div className="status-pill mb-6">
              <span className="status-dot" />
              AI resume tailoring · powered by Claude
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4">
              <span className="text-gradient-hero">Nexus</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Tailor resumes, hunt the right roles, track every conversation — all in one workspace built for executive job searches.
            </p>
          </div>
        </section>

        {/* ─── Bento Grid ──────────────────────────────────────── */}
        <section className="page-content-section max-w-6xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            <BentoCard
              icon={<Sparkles className="size-7" strokeWidth={1.5} />}
              title="New Analysis"
              subtitle="Paste a JD. Get a tailored resume, cover letter, and interview brief."
              onClick={() => router.push('/analyze')}
              gradient="from-blue-500/20 via-indigo-500/10 to-purple-500/20"
              featured
              className="sm:col-span-2 sm:row-span-1"
            />
            <BentoCard
              icon={<ClipboardList className="size-6" strokeWidth={1.5} />}
              title="Tracker"
              subtitle="Applications, contacts, interviews, notes."
              onClick={() => router.push('/tracker')}
              gradient="from-emerald-500/15 to-teal-500/10"
            />
            <BentoCard
              icon={<Mic className="size-6" strokeWidth={1.5} />}
              title="Build Repository"
              subtitle="Capture impact statements by voice or text."
              onClick={() => router.push('/build')}
              gradient="from-fuchsia-500/15 to-pink-500/10"
            />
            <BentoCard
              icon={<Target className="size-6" strokeWidth={1.5} />}
              title="Target Companies"
              subtitle="119 insurtech & disability-focused employers, ranked."
              onClick={() => router.push('/companies')}
              gradient="from-amber-500/15 to-orange-500/10"
            />
            <BentoCard
              icon={<Compass className="size-6" strokeWidth={1.5} />}
              title="Strategy"
              subtitle="Recruiters, boards, conferences — your playbook."
              onClick={() => router.push('/strategy')}
              gradient="from-sky-500/15 to-cyan-500/10"
            />
          </div>
        </section>

        {/* ─── Past Analyses ──────────────────────────────────── */}
        <section className="page-content-section max-w-6xl mx-auto px-6 pb-20">
          {analyses.length > 0 ? (
            <>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-100">Past Analyses</h2>
                  <p className="text-sm text-neutral-500">{analyses.length} saved · click to reopen</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyses.map((analysis) => {
                  const status = statusFor(analysis.id)
                  return (
                    <div
                      key={analysis.id}
                      className="moving-border group relative bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-neutral-800 hover:border-neutral-700 p-5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-neutral-100 truncate group-hover:text-blue-300 transition-colors">
                            {analysis.job_title}
                          </h3>
                          <p className="text-sm text-neutral-400 truncate">{analysis.company}</p>
                        </div>
                        {status && (
                          <span className={`shrink-0 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-md border ${status.color}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-4">
                        {new Date(analysis.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAnalysis(analysis.id)}
                          className="flex-1 px-3 py-2 bg-blue-600/90 hover:bg-blue-600 text-white text-sm rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="px-3 py-2 bg-neutral-800 hover:bg-red-600/80 text-neutral-300 hover:text-white text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-neutral-900/40 backdrop-blur-sm rounded-2xl border border-neutral-800/80">
              <FileText className="size-12 text-[var(--text-disabled)] mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-neutral-300 text-lg mb-2">No past analyses yet</p>
              <p className="text-neutral-500 text-sm">
                Start with{' '}
                <button
                  onClick={() => router.push('/analyze')}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  + New Analysis
                </button>{' '}
                to tailor your first resume.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

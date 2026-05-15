// Cross-entity search for the Cmd+K palette. Each entity type is queried in
// parallel; results are scored, sorted, then truncated.

import { analysisRepo } from '../repos/analysisRepo'
import { applicationRepo } from '../repos/applicationRepo'
import { contactRepo } from '../repos/contactRepo'
import { companyRepo } from '../repos/companyRepo'
import { strategyRepo } from '../repos/strategyRepo'
import { loadAllRepositoryEntries } from '../context/repositoryContext'
import { adaptWatchlistEntry } from '../context/companyContext'
import { trackerStatusLabel } from '../staleness'
import { formatRelativeDate } from '../format'
import watchlist from '@/data/watchlist.json'
import { getActions } from './actions'
import type { PaletteResult } from './types'

const RESULT_CAP = 30

export async function searchAcrossEverything(query: string): Promise<PaletteResult[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: PaletteResult[] = []

  // Actions match by title or keyword.
  for (const a of getActions()) {
    const hay = `${a.title} ${(a.keywords ?? []).join(' ')}`.toLowerCase()
    if (hay.includes(q)) {
      results.push({ ...a, score: 100 + matchScore(hay, q) })
    }
  }

  // Run independent repo queries in parallel.
  const [analyses, apps, contacts, companies, strategy, repoEntries] = await Promise.all([
    analysisRepo.list(),
    applicationRepo.list(),
    contactRepo.list(),
    companyRepo.list(),
    strategyRepo.list(),
    loadAllRepositoryEntries(),
  ])

  for (const a of analyses) {
    const text = `${a.extracted.role} ${a.extracted.company}`.toLowerCase()
    if (text.includes(q)) {
      results.push({
        id: `analysis-${a.id}`,
        type: 'analysis',
        group: 'Analyses',
        icon: '📄',
        title: a.extracted.role || '(Untitled analysis)',
        subtitle: `${a.extracted.company || 'Unknown'} · ${formatRelativeDate(a.createdAt)}`,
        href: `/analyze?id=${a.id}`,
        score: 50 + matchScore(text, q),
      })
    }
  }

  for (const app of apps) {
    const text = `${app.company} ${app.role} ${app.notes}`.toLowerCase()
    if (text.includes(q)) {
      results.push({
        id: `app-${app.id}`,
        type: 'application',
        group: 'Tracker',
        icon: statusIcon(app.status),
        title: `${app.company} — ${app.role}`,
        subtitle: trackerStatusLabel(app.status),
        href: `/tracker?app=${app.id}`,
        score: 45 + matchScore(text, q),
      })
    }
  }

  // Companies: union of seeded watchlist + user companyRepo entries.
  const seenCompanyIds = new Set<string>()
  const allCompanies = [
    ...companies,
    ...watchlist.map((e) => adaptWatchlistEntry(e)),
  ]
  for (const c of allCompanies) {
    if (seenCompanyIds.has(c.id)) continue
    seenCompanyIds.add(c.id)
    if (c.name.toLowerCase().includes(q)) {
      results.push({
        id: `company-${c.id}`,
        type: 'company',
        group: 'Target Companies',
        icon: '🏢',
        title: c.name,
        subtitle: `${c.vertical}${c.fit ? ` · ${c.fit}/10 fit` : ''}`,
        href: `/companies`,
        score: 40 + matchScore(c.name.toLowerCase(), q),
      })
    }
  }

  for (const c of contacts) {
    const text = `${c.name} ${c.company ?? ''} ${c.role ?? ''}`.toLowerCase()
    if (text.includes(q)) {
      results.push({
        id: `contact-${c.id}`,
        type: 'contact',
        group: 'Contacts',
        icon: '👤',
        title: c.name,
        subtitle:
          c.role && c.company ? `${c.role} at ${c.company}` : c.company || c.role || '',
        href: `/tracker?contact=${c.id}`,
        score: 35 + matchScore(text, q),
      })
    }
  }

  for (const s of strategy) {
    if (s.name.toLowerCase().includes(q)) {
      results.push({
        id: `strategy-${s.id}`,
        type: 'strategy',
        group: 'Strategy',
        icon: '🤝',
        title: s.name,
        subtitle: s.category,
        href: `/strategy#${s.id}`,
        score: 30 + matchScore(s.name.toLowerCase(), q),
      })
    }
  }

  for (const e of repoEntries) {
    const text = `${e.title} ${e.company}`.toLowerCase()
    if (text.includes(q)) {
      results.push({
        id: `repo-${e.id}`,
        type: 'repository',
        group: 'Repository',
        icon: '📚',
        title: `${e.title} at ${e.company}`,
        subtitle: `${e.startDate} – ${e.endDate || 'present'}`,
        href: `/build`,
        score: 25 + matchScore(text, q),
      })
    }
  }

  return results
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, RESULT_CAP)
}

export function matchScore(text: string, query: string): number {
  if (text.startsWith(query)) return 10
  if (text.includes(` ${query}`)) return 5
  return 0
}

function statusIcon(status: string): string {
  switch (status) {
    case 'interested':
      return '👀'
    case 'applied':
      return '📤'
    case 'screening':
      return '☎'
    case 'interviewing':
      return '🎤'
    case 'offer':
      return '🎉'
    case 'rejected':
      return '✖'
    case 'on-hold':
      return '⏸'
    default:
      return '·'
  }
}

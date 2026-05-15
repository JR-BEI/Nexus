// Stable IDs and lookups for Target Companies. The seeded list lives in
// src/data/watchlist.json (no IDs of its own); per-company user state lives
// in companyRepo. We bridge the two via a slug-based ID derived from the
// company name.

import type { TargetCompany } from '@/types/nexus'
import watchlist from '@/data/watchlist.json'
import { slugify } from '@/lib/slugify'

type WatchlistEntry = (typeof watchlist)[number]

export function companyIdFromName(name: string): string {
  return `tc_${slugify(name)}`
}

export function adaptWatchlistEntry(entry: WatchlistEntry): TargetCompany {
  return {
    id: companyIdFromName(entry.company),
    name: entry.company,
    vertical: entry.list,
    location: entry.hq || undefined,
    stage: entry.stage || undefined,
    fit: entry.fit_score ?? 0,
    whyFit: entry.why_fit || undefined,
    note: entry.notes || undefined,
    ats: entry.ats || undefined,
    careersUrl: entry.careers_url || undefined,
    tracked: false,
    passed: false,
  }
}

export function findWatchlistById(id: string): TargetCompany | null {
  const entry = (watchlist as WatchlistEntry[]).find(
    (e) => companyIdFromName(e.company) === id
  )
  return entry ? adaptWatchlistEntry(entry) : null
}

export function buildCompanyPromptBlock(company: TargetCompany): string {
  const lines = [
    `# Target Company Context`,
    `- **Name:** ${company.name}`,
    `- **Vertical:** ${company.vertical}`,
    company.stage ? `- **Stage:** ${company.stage}` : '',
    company.whyFit ? `- **Why this is a fit:** ${company.whyFit}` : '',
    company.note ? `- **Note:** ${company.note}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

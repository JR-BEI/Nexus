// Adapter + formatter for assembling Repository entries into model context.
//
// Today's source of truth for work history is the static src/data/repository.json
// (Position[] shape from the legacy types). Doc 08 will introduce user-built
// entries via repositoryRepo. To avoid blocking doc 02 on doc 08, this module
// adapts seeded positions to the new RepositoryEntry shape and merges them
// with anything in the new repo.

import type { Position, Repository as LegacyRepository } from '@/types'
import type { ImpactStatement, RepositoryEntry } from '@/types/nexus'
import repositoryData from '@/data/repository.json'
import { repositoryRepo } from '@/lib/repos/repositoryRepo'

export interface RepositoryContext {
  entries: RepositoryEntry[]
  formatted: string
  tokenEstimate: number
}

export function adaptPositionToEntry(position: Position): RepositoryEntry {
  // Flatten old categories[].blocks (long-form prose) and impact_statements
  // into a single ImpactStatement[]. Keep IDs stable so re-adapting is
  // idempotent — the seeded position id is reused as the entry id.
  const fromCategories: ImpactStatement[] = position.categories.flatMap((cat) =>
    cat.blocks.map((text, i) => ({
      id: `${position.id}-cat-${slug(cat.name)}-${i}`,
      text,
      tags: [cat.name],
    }))
  )
  const fromImpacts: ImpactStatement[] = position.impact_statements.map((s) => ({
    id: s.id,
    text: s.text,
    tags: s.tags,
  }))

  return {
    id: position.id,
    createdAt: 0,
    updatedAt: 0,
    source: 'manual',
    company: position.company,
    title: position.title,
    startDate: position.start_date,
    endDate: position.end_date,
    summary: position.context || undefined,
    impactStatements: [...fromImpacts, ...fromCategories],
    skills: position.tags ?? [],
    domains: [],
    needsReview: false,
  }
}

/**
 * All repository entries available to the analyze flow. Seeded positions from
 * repository.json plus any user-built entries from repositoryRepo, deduped by
 * id (user entries win on conflict).
 */
export async function loadAllRepositoryEntries(): Promise<RepositoryEntry[]> {
  const seeded = (repositoryData as LegacyRepository).positions.map(adaptPositionToEntry)
  const userEntries = await repositoryRepo.list()
  const userIds = new Set(userEntries.map((e) => e.id))
  const merged = [...userEntries, ...seeded.filter((e) => !userIds.has(e.id))]
  return sortByEndDateDesc(merged)
}

function sortByEndDateDesc(entries: RepositoryEntry[]): RepositoryEntry[] {
  return [...entries].sort((a, b) => {
    const aEnd = a.endDate || '9999'
    const bEnd = b.endDate || '9999'
    return bEnd.localeCompare(aEnd)
  })
}

export function buildRepositoryContext(entries: RepositoryEntry[]): RepositoryContext {
  const sorted = sortByEndDateDesc(entries)
  const formatted = sorted.map(formatEntry).join('\n\n---\n\n')
  return {
    entries: sorted,
    formatted,
    tokenEstimate: Math.ceil(formatted.length / 4),
  }
}

function formatEntry(e: RepositoryEntry): string {
  const dateRange = e.endDate ? `${e.startDate} to ${e.endDate}` : `${e.startDate} to present`
  const impacts = e.impactStatements
    .map((i) => `- ${i.text}${i.metric ? ` (${i.metric})` : ''}`)
    .join('\n')
  return [
    `**${e.title}** at **${e.company}** (${dateRange})`,
    e.summary ? `Summary: ${e.summary}` : '',
    impacts ? `Impact:\n${impacts}` : '',
    e.skills.length ? `Skills: ${e.skills.join(', ')}` : '',
    e.domains.length ? `Domains: ${e.domains.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

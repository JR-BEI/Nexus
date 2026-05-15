// Merge curated strategy entries with user state. Curated data is the source
// of truth for name/category/description; user state (status/notes/last
// contacted) lives in strategyRepo and is grafted on at read time.

import type { StrategyContact } from '@/types/nexus'
import { STRATEGY_ENTRIES } from '@/data/strategy'
import { strategyRepo } from './repos/strategyRepo'

export interface MergedStrategyEntry extends StrategyContact {
  /** True when this entry came from the user (not the curated seed). */
  customAdded: boolean
}

export async function loadMergedStrategyEntries(): Promise<MergedStrategyEntry[]> {
  const userContacts = await strategyRepo.list()
  const userById = new Map(userContacts.map((c) => [c.id, c]))

  const curated: MergedStrategyEntry[] = STRATEGY_ENTRIES.map((seed) => {
    const user = userById.get(seed.id)
    return {
      ...seed,
      status: user?.status ?? 'not_contacted',
      userNotes: user?.userNotes,
      lastContactedAt: user?.lastContactedAt,
      customAdded: false,
    }
  })

  const curatedIds = new Set(curated.map((c) => c.id))
  const custom: MergedStrategyEntry[] = userContacts
    .filter((c) => !curatedIds.has(c.id) && c.customAdded)
    .map((c) => ({ ...c, customAdded: true }))

  return [...curated, ...custom]
}

/** Persist user state for an entry (curated or custom). */
export async function upsertStrategyState(entry: MergedStrategyEntry): Promise<void> {
  const { customAdded, ...rest } = entry
  await strategyRepo.save({ ...rest, customAdded })
}

export function groupByCategory(
  entries: MergedStrategyEntry[]
): { label: string; items: MergedStrategyEntry[] }[] {
  const groups = new Map<string, MergedStrategyEntry[]>()
  for (const e of entries) {
    const arr = groups.get(e.category) ?? []
    arr.push(e)
    groups.set(e.category, arr)
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

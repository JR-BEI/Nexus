import type { TargetCompany } from '@/types/nexus'
import { createRepo } from './baseRepo'

// Note: only stores user state for companies. The seed catalog still lives in
// src/data/watchlist.json. Doc 04 will reconcile the two via name matching.
const base = createRepo<TargetCompany>('nexus.company.')

export const companyRepo = {
  ...base,
  async findByName(name: string): Promise<TargetCompany | null> {
    const all = await base.list()
    const target = name.toLowerCase().trim()
    return all.find((c) => c.name.toLowerCase().trim() === target) ?? null
  },
}

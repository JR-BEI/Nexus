import type { Analysis } from '@/types/nexus'
import { createRepo } from './baseRepo'

const base = createRepo<Analysis>('nexus.analysis.')

export const analysisRepo = {
  ...base,
  async findByCompany(company: string): Promise<Analysis[]> {
    const all = await base.list()
    const target = company.toLowerCase().trim()
    return all.filter((a) => a.extracted.company.toLowerCase().trim() === target)
  },
}

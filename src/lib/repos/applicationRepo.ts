import type { TrackerApplication, TrackerEvent } from '@/types/nexus'
import { newEventId } from '../id'
import { createRepo } from './baseRepo'

const base = createRepo<TrackerApplication>('nexus.application.')

export const applicationRepo = {
  ...base,
  async findByAnalysis(analysisId: string): Promise<TrackerApplication | null> {
    const all = await base.list()
    return all.find((a) => a.linkedAnalysisId === analysisId) ?? null
  },
  async findByCompany(companyId: string): Promise<TrackerApplication[]> {
    const all = await base.list()
    return all.filter((a) => a.linkedCompanyId === companyId)
  },
  async appendEvent(
    appId: string,
    event: Omit<TrackerEvent, 'id' | 'at'> & { at?: number }
  ): Promise<TrackerApplication | null> {
    const app = await base.get(appId)
    if (!app) return null
    const fullEvent: TrackerEvent = {
      id: newEventId(),
      at: event.at ?? Date.now(),
      type: event.type,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      content: event.content,
    }
    const updated: TrackerApplication = {
      ...app,
      events: [...app.events, fullEvent],
    }
    await base.save(updated)
    return updated
  },
}

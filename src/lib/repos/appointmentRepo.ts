import type { TrackerAppointment } from '@/types/nexus'
import { createRepo } from './baseRepo'

const base = createRepo<TrackerAppointment>('nexus.appointment.')

export const appointmentRepo = {
  ...base,
  async upcoming(withinMs: number = 14 * 24 * 60 * 60 * 1000): Promise<TrackerAppointment[]> {
    const now = Date.now()
    const all = await base.list()
    return all
      .filter((a) => a.at >= now && a.at <= now + withinMs)
      .sort((a, b) => a.at - b.at)
  },
}

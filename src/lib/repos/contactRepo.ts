import type { TrackerContact } from '@/types/nexus'
import { createRepo } from './baseRepo'

const base = createRepo<TrackerContact>('nexus.contact.')

export const contactRepo = {
  ...base,
  async findByApplication(appId: string): Promise<TrackerContact[]> {
    const all = await base.list()
    return all.filter((c) => c.linkedApplicationIds.includes(appId))
  },
}

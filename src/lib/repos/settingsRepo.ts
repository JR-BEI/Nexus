import type { NexusSettings } from '@/types/nexus'
import { storage } from '../storage'

const KEY = 'nexus.settings'

export const settingsRepo = {
  async get(): Promise<NexusSettings> {
    return (await storage.get<NexusSettings>(KEY)) ?? {}
  },
  async patch(patch: Partial<NexusSettings>): Promise<NexusSettings> {
    const current = await this.get()
    const next = { ...current, ...patch }
    await storage.set(KEY, next)
    return next
  },
}

// Generic per-entity CRUD wrapper. Each entity has its own keyspace
// (e.g. "nexus.analysis.") so list() can scan just that prefix.

import { storage } from '../storage'

export interface Identified {
  id: string
  updatedAt?: number
}

export interface BaseRepo<T extends Identified> {
  get(id: string): Promise<T | null>
  list(): Promise<T[]>
  save(item: T): Promise<void>
  delete(id: string): Promise<void>
}

export function createRepo<T extends Identified>(prefix: string): BaseRepo<T> {
  const keyFor = (id: string) => `${prefix}${id}`

  return {
    async get(id: string): Promise<T | null> {
      return storage.get<T>(keyFor(id))
    },

    async list(): Promise<T[]> {
      const keys = await storage.list(prefix)
      const raw = await Promise.all(keys.map((k) => storage.get<T>(k)))
      const items: T[] = []
      for (const item of raw) {
        if (item !== null) items.push(item)
      }
      items.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      return items
    },

    async save(item: T): Promise<void> {
      const stamped = { ...item, updatedAt: Date.now() } as T
      await storage.set(keyFor(item.id), stamped)
    },

    async delete(id: string): Promise<void> {
      await storage.delete(keyFor(id))
    },
  }
}

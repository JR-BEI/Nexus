// Storage adapter. Promise-based interface so we can swap LocalStorage for
// IndexedDB later without rewriting any repo. localStorage is synchronous
// under the hood — Promises here are purely for forward-compat.

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  list(prefix: string): Promise<string[]>
}

class LocalStorageAdapter implements StorageAdapter {
  private get safeWindow(): Window | null {
    return typeof window === 'undefined' ? null : window
  }

  async get<T>(key: string): Promise<T | null> {
    const w = this.safeWindow
    if (!w) return null
    try {
      const raw = w.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const w = this.safeWindow
    if (!w) return
    w.localStorage.setItem(key, JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    const w = this.safeWindow
    if (!w) return
    w.localStorage.removeItem(key)
  }

  async list(prefix: string): Promise<string[]> {
    const w = this.safeWindow
    if (!w) return []
    const out: string[] = []
    for (let i = 0; i < w.localStorage.length; i++) {
      const k = w.localStorage.key(i)
      if (k && k.startsWith(prefix)) out.push(k)
    }
    return out
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter()

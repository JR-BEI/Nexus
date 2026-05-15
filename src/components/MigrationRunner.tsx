'use client'

import { useEffect } from 'react'
import { runMigrations } from '@/lib/migrate'

/**
 * Mounts at the app root and runs one-time data migrations on first paint.
 * Renders nothing. Migration is idempotent — safe to mount on every page.
 */
export function MigrationRunner() {
  useEffect(() => {
    runMigrations().catch((err) => {
      console.error('[nexus] migration failed:', err)
    })
  }, [])

  return null
}

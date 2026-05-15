'use client'

import { useEffect, useState } from 'react'
import { buildQuickStats, type QuickStats as Stats } from '@/lib/today'

export function QuickStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    buildQuickStats().then(setStats)
  }, [])

  if (!stats) return null
  // Hide if user has no data — keeps the new-user state clean.
  if (stats.activeApps === 0 && stats.appliedThisWeek === 0 && stats.upcomingThisWeek === 0) {
    return null
  }

  return (
    <div className="flex justify-center gap-3 text-sm text-[var(--text-tertiary)] mt-4">
      <span>
        <strong className="text-[var(--text-primary)] tabular-nums font-semibold">
          {stats.activeApps}
        </strong>{' '}
        active applications
      </span>
      <span>·</span>
      <span>
        <strong className="text-[var(--text-primary)] tabular-nums font-semibold">
          {stats.appliedThisWeek}
        </strong>{' '}
        applied this week
      </span>
      <span>·</span>
      <span>
        <strong className="text-[var(--text-primary)] tabular-nums font-semibold">
          {stats.upcomingThisWeek}
        </strong>{' '}
        upcoming this week
      </span>
    </div>
  )
}

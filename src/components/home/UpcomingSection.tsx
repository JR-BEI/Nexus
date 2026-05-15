'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { appointmentRepo } from '@/lib/repos/appointmentRepo'
import { formatTime } from '@/lib/format'
import type { TrackerAppointment } from '@/types/nexus'

const TYPE_LABEL: Record<TrackerAppointment['type'], string> = {
  phone_screen: '📞 Phone screen',
  interview: '🎤 Interview',
  follow_up: '↪ Follow-up',
  other: '· Event',
}

export function UpcomingSection() {
  const [items, setItems] = useState<TrackerAppointment[] | null>(null)

  useEffect(() => {
    appointmentRepo.upcoming().then(setItems)
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="page-content-section max-w-5xl mx-auto px-6 pb-10">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight mb-3">
        Upcoming
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((apt) => {
          const date = new Date(apt.at)
          const day = date.toLocaleDateString(undefined, { day: '2-digit' })
          const month = date.toLocaleDateString(undefined, { month: 'short' })
          return (
            <Link
              key={apt.id}
              href={`/tracker?appointment=${apt.id}`}
              className="flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)] no-underline text-inherit transition-colors"
            >
              <div className="flex flex-col items-center w-12 shrink-0">
                <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
                  {day}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mt-0.5">
                  {month}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {apt.title}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {formatTime(apt.at)}
                  {apt.durationMin ? ` · ${apt.durationMin} min` : ''}
                  {' · '}
                  {TYPE_LABEL[apt.type]}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

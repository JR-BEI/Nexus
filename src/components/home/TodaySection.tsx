'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buildTodayItems, type TodayItem, type TodayItemType } from '@/lib/today'
import { formatLongDate } from '@/lib/format'

const TYPE_ACCENT: Record<TodayItemType, string> = {
  event: 'border-l-[3px] border-l-[var(--accent-blue)]',
  stale: 'border-l-[3px] border-l-red-500',
  draft: 'border-l-[3px] border-l-amber-500',
  reminder: 'border-l-[3px] border-l-purple-400',
  streak: 'border-l-[3px] border-l-emerald-400',
}

export function TodaySection() {
  const [items, setItems] = useState<TodayItem[] | null>(null)

  useEffect(() => {
    buildTodayItems().then(setItems)
  }, [])

  // Suppress entirely until loaded — and once loaded, hide if empty.
  if (!items || items.length === 0) return null

  return (
    <section className="page-content-section max-w-5xl mx-auto px-6 pb-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
          Today
        </h2>
        <span className="text-sm text-[var(--text-tertiary)]">{formatLongDate()}</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.actionHref}
            className={`grid grid-cols-[36px_1fr_auto] gap-3 items-center px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-2)] hover:border-[var(--border-default)] transition-all hover:translate-x-[2px] no-underline text-inherit ${TYPE_ACCENT[item.type]}`}
          >
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] flex items-center justify-center text-base">
              <span aria-hidden>{item.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                {item.title}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                {item.description}
              </div>
            </div>
            <div className="text-sm font-medium text-[var(--accent-blue)] inline-flex items-center gap-1 shrink-0">
              {item.actionLabel}
              <ArrowRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

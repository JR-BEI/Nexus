// Aggregates the most actionable items across the app for the homepage
// "Today" section. Sorted by priority: events > stale apps > drafts > strategy.

import { applicationRepo } from './repos/applicationRepo'
import { appointmentRepo } from './repos/appointmentRepo'
import { strategyRepo } from './repos/strategyRepo'
import { loadDrafts } from './drafts'
import { getStaleness, trackerStatusLabel, DAY_MS } from './staleness'
import { formatRelativeDate, formatTime } from './format'

export type TodayItemType = 'event' | 'stale' | 'draft' | 'reminder' | 'streak'

export interface TodayItem {
  id: string
  priority: number
  icon: string
  title: string
  description: string
  actionLabel: string
  actionHref: string
  type: TodayItemType
}

const DRAFT_MIN_AGE_MS = 5 * 60 * 1000
const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000
const STRATEGY_FOLLOWUP_MS = 14 * DAY_MS

export async function buildTodayItems(): Promise<TodayItem[]> {
  const items: TodayItem[] = []

  // 1. Upcoming events in next 48h
  const appointments = await appointmentRepo.list()
  const soon = appointments.filter((a) => {
    const diff = a.at - Date.now()
    return diff > 0 && diff < UPCOMING_WINDOW_MS
  })
  for (const apt of soon) {
    items.push({
      id: `apt-${apt.id}`,
      priority: 100,
      icon: '🎤',
      title: apt.title,
      description: `${formatTime(apt.at)} · ${apt.type.replace(/_/g, ' ')}`,
      actionLabel: 'View',
      actionHref: `/tracker?appointment=${apt.id}`,
      type: 'event',
    })
  }

  // 2. Stale applications needing follow-up (top 2)
  const apps = await applicationRepo.list()
  const stale = apps
    .map((app) => ({ app, staleness: getStaleness(app) }))
    .filter(({ staleness }) => staleness.level === 'stale')
    .sort((a, b) => b.staleness.daysSinceActivity - a.staleness.daysSinceActivity)
    .slice(0, 2)
  for (const { app, staleness } of stale) {
    items.push({
      id: `stale-${app.id}`,
      priority: 80,
      icon: '🔔',
      title: `${app.company} — ${app.role}`,
      description: `${staleness.daysSinceActivity} days in ${trackerStatusLabel(
        app.status
      )}. ${staleness.suggestedAction}`,
      actionLabel: 'Log activity',
      actionHref: `/tracker?app=${app.id}&action=log`,
      type: 'stale',
    })
  }

  // 3. Draft analyses older than DRAFT_MIN_AGE_MS
  const drafts = await loadDrafts()
  const eligibleDrafts = drafts.filter((d) => Date.now() - d.updatedAt > DRAFT_MIN_AGE_MS)
  for (const draft of eligibleDrafts.slice(0, 2)) {
    items.push({
      id: `draft-${draft.id}`,
      priority: 60,
      icon: '✎',
      title: 'Continue draft analysis',
      description: draft.preview || `Started ${formatRelativeDate(draft.createdAt)}`,
      actionLabel: 'Continue',
      actionHref: `/analyze?draft=${draft.id}`,
      type: 'draft',
    })
  }

  // 4. Strategy contacts marked actionable but untouched 14+ days
  const strategy = await strategyRepo.list()
  const strategyTodo = strategy
    .filter((e) => e.status === 'in_conversation' || e.status === 'reached_out')
    .filter(
      (e) => !e.lastContactedAt || Date.now() - e.lastContactedAt > STRATEGY_FOLLOWUP_MS
    )
    .slice(0, 1)
  for (const entry of strategyTodo) {
    items.push({
      id: `strategy-${entry.id}`,
      priority: 40,
      icon: '🤝',
      title: `Follow up with ${entry.name}`,
      description:
        entry.userNotes ||
        (entry.lastContactedAt
          ? `Last touched ${formatRelativeDate(entry.lastContactedAt)}`
          : 'No contact yet'),
      actionLabel: 'Open',
      actionHref: `/strategy#${entry.id}`,
      type: 'reminder',
    })
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 5)
}

export interface QuickStats {
  activeApps: number
  appliedThisWeek: number
  upcomingThisWeek: number
}

export async function buildQuickStats(): Promise<QuickStats> {
  const [apps, appointments] = await Promise.all([
    applicationRepo.list(),
    appointmentRepo.list(),
  ])
  const weekAgo = Date.now() - 7 * DAY_MS
  const weekFromNow = Date.now() + 7 * DAY_MS

  const activeApps = apps.filter(
    (a) => a.status !== 'rejected' && a.status !== 'on-hold'
  ).length

  const appliedThisWeek = apps.filter((a) =>
    a.events.some(
      (e) => e.type === 'status_change' && e.toStatus === 'applied' && e.at >= weekAgo
    )
  ).length

  const upcomingThisWeek = appointments.filter(
    (a) => a.at >= Date.now() && a.at <= weekFromNow
  ).length

  return { activeApps, appliedThisWeek, upcomingThisWeek }
}

// Application staleness detection. Different statuses warrant different
// follow-up cadences (an Offer sitting 3 days is alarming; an On-hold app
// sitting 30 days is fine).

import type { ApplicationStatus, TrackerApplication } from '@/types/nexus'

export const DAY_MS = 24 * 60 * 60 * 1000

export type StalenessLevel = 'fresh' | 'warning' | 'stale'

export interface Staleness {
  level: StalenessLevel
  daysSinceActivity: number
  suggestedAction: string
}

interface StalenessConfig {
  warningDays: number
  staleDays: number
  suggestedAction: string
}

const STALENESS_BY_STATUS: Record<ApplicationStatus, StalenessConfig> = {
  interested: {
    warningDays: 7,
    staleDays: 14,
    suggestedAction: 'Apply or pass — it has been sitting in your interest list',
  },
  applied: {
    warningDays: 10,
    staleDays: 21,
    suggestedAction: 'Send a polite follow-up to the recruiter or hiring manager',
  },
  screening: {
    warningDays: 7,
    staleDays: 14,
    suggestedAction: 'Reach out to confirm next steps',
  },
  interviewing: {
    warningDays: 5,
    staleDays: 10,
    suggestedAction:
      'Check in on timeline — interview cadence often signals interest level',
  },
  offer: {
    warningDays: 3,
    staleDays: 7,
    suggestedAction: 'Respond to the offer',
  },
  rejected: {
    warningDays: Infinity,
    staleDays: Infinity,
    suggestedAction: '',
  },
  'on-hold': {
    warningDays: 30,
    staleDays: 60,
    suggestedAction: 'Check if the role is still on hold',
  },
}

export function getLastActivityAt(app: TrackerApplication): number {
  if (app.events.length === 0) return app.createdAt
  return Math.max(...app.events.map((e) => e.at))
}

export function getStaleness(app: TrackerApplication): Staleness {
  const config = STALENESS_BY_STATUS[app.status]
  const last = getLastActivityAt(app)
  const daysSince = Math.floor((Date.now() - last) / DAY_MS)

  let level: StalenessLevel = 'fresh'
  if (daysSince >= config.staleDays) level = 'stale'
  else if (daysSince >= config.warningDays) level = 'warning'

  return {
    level,
    daysSinceActivity: daysSince,
    suggestedAction: level === 'fresh' ? '' : config.suggestedAction,
  }
}

export function trackerStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    interested: 'Interested',
    applied: 'Applied',
    screening: 'Screening',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
    'on-hold': 'On hold',
  }
  return labels[status]
}

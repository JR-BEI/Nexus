// Items to show when the palette opens with no query: top actions + a few
// recent analyses + recent applications.

import { analysisRepo } from '../repos/analysisRepo'
import { applicationRepo } from '../repos/applicationRepo'
import { formatRelativeDate } from '../format'
import { trackerStatusLabel } from '../staleness'
import { getActions } from './actions'
import type { PaletteResult } from './types'

export async function getRecentAndActions(): Promise<PaletteResult[]> {
  const items: PaletteResult[] = []

  for (const a of getActions().slice(0, 4)) {
    items.push(a)
  }

  const [analyses, apps] = await Promise.all([
    analysisRepo.list(),
    applicationRepo.list(),
  ])

  for (const a of analyses.slice(0, 3)) {
    items.push({
      id: `recent-analysis-${a.id}`,
      type: 'analysis',
      group: 'Recent analyses',
      icon: '📄',
      title: a.extracted.role || '(Untitled analysis)',
      subtitle: `${a.extracted.company || 'Unknown'} · ${formatRelativeDate(a.createdAt)}`,
      href: `/analyze?id=${a.id}`,
    })
  }

  for (const app of apps.slice(0, 3)) {
    items.push({
      id: `recent-app-${app.id}`,
      type: 'application',
      group: 'Recent applications',
      icon: '📋',
      title: `${app.company} — ${app.role}`,
      subtitle: `${trackerStatusLabel(app.status)} · updated ${formatRelativeDate(app.updatedAt)}`,
      href: `/tracker?app=${app.id}`,
    })
  }

  return items
}

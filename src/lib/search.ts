// Tracker-page search. Scans across application fields, event content, linked
// contact data, and the linked analysis's JD text. Matched fields are returned
// alongside each app so the UI can render "matched X" chips.

import type { TrackerApplication, TrackerContact, Analysis } from '@/types/nexus'
import { contactRepo } from './repos/contactRepo'
import { analysisRepo } from './repos/analysisRepo'

export interface SearchableApp {
  app: TrackerApplication
  matchedFields: string[]
}

export async function searchApplications(
  query: string,
  apps: TrackerApplication[]
): Promise<SearchableApp[]> {
  if (!query.trim()) {
    return apps.map((app) => ({ app, matchedFields: [] }))
  }

  const q = query.toLowerCase()
  const [contacts, analyses] = await Promise.all([
    contactRepo.list(),
    analysisRepo.list(),
  ])
  const contactsMap = new Map<string, TrackerContact>(contacts.map((c) => [c.id, c]))
  const analysesMap = new Map<string, Analysis>(analyses.map((a) => [a.id, a]))

  const out: SearchableApp[] = []
  for (const app of apps) {
    const matched: string[] = []
    if (app.company.toLowerCase().includes(q)) matched.push('company')
    if (app.role.toLowerCase().includes(q)) matched.push('role')
    if (app.source?.toLowerCase().includes(q)) matched.push('source')
    if (app.notes.toLowerCase().includes(q)) matched.push('notes')

    if (app.events.some((e) => e.content?.toLowerCase().includes(q))) {
      matched.push('activity')
    }

    for (const cid of app.linkedContactIds) {
      const c = contactsMap.get(cid)
      if (
        c &&
        (c.name.toLowerCase().includes(q) || (c.notes ?? '').toLowerCase().includes(q))
      ) {
        matched.push('contact')
        break
      }
    }

    if (app.linkedAnalysisId) {
      const a = analysesMap.get(app.linkedAnalysisId)
      if (a && a.jdText.toLowerCase().includes(q)) {
        matched.push('JD')
      }
    }

    if (matched.length > 0) out.push({ app, matchedFields: matched })
  }
  return out
}

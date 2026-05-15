// In-progress analysis drafts. Stored as a single array under one key so
// loadDrafts/saveDraft round-trips don't need a list-by-prefix scan.

import { storage } from './storage'

export interface AnalysisDraft {
  id: string
  jdText: string
  angle?: string
  selectedEntryIds: string[]
  prefillCompanyId?: string
  createdAt: number
  updatedAt: number
  preview: string // first 80 chars of JD
}

const DRAFTS_KEY = 'nexus.analysisDrafts'

export function buildPreview(jdText: string): string {
  const trimmed = jdText.trim().replace(/\s+/g, ' ')
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed
}

export async function loadDrafts(): Promise<AnalysisDraft[]> {
  const raw = await storage.get<AnalysisDraft[]>(DRAFTS_KEY)
  return raw ?? []
}

export async function getDraft(id: string): Promise<AnalysisDraft | null> {
  const all = await loadDrafts()
  return all.find((d) => d.id === id) ?? null
}

export async function saveDraft(draft: AnalysisDraft): Promise<void> {
  const all = await loadDrafts()
  const idx = all.findIndex((d) => d.id === draft.id)
  if (idx >= 0) all[idx] = draft
  else all.push(draft)
  await storage.set(DRAFTS_KEY, all)
}

export async function deleteDraft(id: string): Promise<void> {
  const all = await loadDrafts()
  await storage.set(
    DRAFTS_KEY,
    all.filter((d) => d.id !== id)
  )
}

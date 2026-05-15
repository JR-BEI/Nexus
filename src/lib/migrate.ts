// One-time data migration from the legacy localStorage shapes (defined in
// src/types/index.ts and src/lib/tracker.ts) to the canonical Nexus model in
// src/types/nexus.ts.
//
// Strategy: COPY into the new namespace. The legacy keys are NOT removed, so
// the existing Tracker UI in src/lib/tracker.ts keeps reading from them and
// nothing visibly breaks. New Phase 1+ features write to the new repos. The
// legacy hooks will be retired in a later phase (likely doc 06).
//
// A snapshot backup is written to `nexus.migrations.v1.backup` before any
// writes so the user can roll back via the browser console if needed.

import type {
  Analysis as LegacyAnalysis,
  Application as LegacyApplication,
  Contact as LegacyContact,
  Appointment as LegacyAppointment,
  ActivityNote as LegacyNote,
  ApplicationStatus as LegacyApplicationStatus,
} from '@/types'
import type {
  Analysis,
  AnalysisVersion,
  ApplicationStatus,
  AppointmentType,
  TrackerApplication,
  TrackerAppointment,
  TrackerContact,
  TrackerEvent,
} from '@/types/nexus'
import { newEventId, newVersionId } from './id'
import { storage } from './storage'

const MIGRATION_KEY = 'nexus.migrations.v1'
const BACKUP_KEY = 'nexus.migrations.v1.backup'

const LEGACY_KEYS = {
  analyses: 'analyses',
  applications: 'tracker.applications',
  contacts: 'tracker.contacts',
  appointments: 'tracker.appointments',
  notes: 'tracker.notes',
} as const

/** Run all pending migrations. Idempotent and safe to call repeatedly. */
export async function runMigrations(): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(MIGRATION_KEY) === 'true') return

  const backup = snapshotLegacyKeys()
  window.localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))

  await migrateAnalyses(backup.analyses)
  await migrateApplications(backup.applications, backup.notes)
  await migrateContacts(backup.contacts, backup.applications)
  await migrateAppointments(backup.appointments)

  window.localStorage.setItem(MIGRATION_KEY, 'true')
}

// =========================
// Snapshot
// =========================

interface LegacySnapshot {
  analyses: LegacyAnalysis[]
  applications: LegacyApplication[]
  contacts: LegacyContact[]
  appointments: LegacyAppointment[]
  notes: LegacyNote[]
}

function snapshotLegacyKeys(): LegacySnapshot {
  const read = <T>(key: string): T[] => {
    try {
      const raw = window.localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : null
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return {
    analyses: read<LegacyAnalysis>(LEGACY_KEYS.analyses),
    applications: read<LegacyApplication>(LEGACY_KEYS.applications),
    contacts: read<LegacyContact>(LEGACY_KEYS.contacts),
    appointments: read<LegacyAppointment>(LEGACY_KEYS.appointments),
    notes: read<LegacyNote>(LEGACY_KEYS.notes),
  }
}

// =========================
// Helpers
// =========================

function toMs(input: string | number | null | undefined, fallback: number): number {
  if (input == null || input === '') return fallback
  if (typeof input === 'number') return input
  const t = Date.parse(input)
  return Number.isFinite(t) ? t : fallback
}

function mapAppStatus(s: LegacyApplicationStatus | undefined): ApplicationStatus {
  if (s === 'on_hold') return 'on-hold'
  if (
    s === 'interested' ||
    s === 'applied' ||
    s === 'screening' ||
    s === 'interviewing' ||
    s === 'offer' ||
    s === 'rejected'
  ) {
    return s
  }
  return 'interested'
}

function mapAppointmentType(t: LegacyAppointment['type'] | undefined): AppointmentType {
  switch (t) {
    case 'phone_screen':
      return 'phone_screen'
    case 'recruiter_call':
      return 'phone_screen'
    case 'technical':
    case 'panel':
    case 'exec':
      return 'interview'
    case 'networking':
      return 'follow_up'
    default:
      return 'other'
  }
}

// =========================
// Per-entity migrations
// =========================

async function migrateAnalyses(legacy: LegacyAnalysis[]): Promise<void> {
  for (const old of legacy) {
    const createdAt = toMs(old.date, Date.now())
    const versions = (content: string | undefined): AnalysisVersion[] =>
      content
        ? [{ id: newVersionId(), createdAt, content, label: 'Original' }]
        : []

    const next: Analysis = {
      id: old.id,
      createdAt,
      updatedAt: createdAt,
      jdText: old.jd_text ?? '',
      extracted: {
        role: old.jd_analysis?.role_title ?? old.job_title ?? '',
        company: old.jd_analysis?.company ?? old.company ?? '',
        seniority: old.jd_analysis?.role_level ?? '',
        mustHaves: old.jd_analysis?.required_skills ?? [],
        niceToHaves: old.jd_analysis?.preferred_skills ?? [],
        keywords: old.jd_analysis?.key_themes ?? [],
        redFlags: [],
      },
      outputs: {
        resume: versions(old.resume),
        coverLetter: versions(old.cover_letter),
        strategyBrief: versions(old.strategy_brief),
      },
      linkedRepositoryEntries: [],
    }
    await storage.set(`nexus.analysis.${next.id}`, next)
  }
}

async function migrateApplications(
  legacy: LegacyApplication[],
  notes: LegacyNote[]
): Promise<void> {
  const notesByApp = new Map<string, LegacyNote[]>()
  for (const n of notes) {
    if (!n.application_id) continue
    const arr = notesByApp.get(n.application_id) ?? []
    arr.push(n)
    notesByApp.set(n.application_id, arr)
  }

  for (const old of legacy) {
    const createdAt = toMs(old.created_at, Date.now())
    const updatedAt = toMs(old.updated_at, createdAt)
    const status = mapAppStatus(old.status)

    const events: TrackerEvent[] = []
    if (old.applied_date) {
      events.push({
        id: newEventId(),
        at: toMs(old.applied_date, createdAt),
        type: 'status_change',
        toStatus: 'applied',
      })
    }
    for (const n of notesByApp.get(old.id) ?? []) {
      events.push({
        id: newEventId(),
        at: toMs(n.created_at ?? n.date, createdAt),
        type: 'note',
        content: n.body,
      })
    }
    events.sort((a, b) => a.at - b.at)

    // Preserve fields that don't have a home in the new shape by appending to
    // the free-text notes field. Avoids silently dropping data.
    const extras: string[] = []
    if (old.jd_url) extras.push(`JD URL: ${old.jd_url}`)
    if (old.salary_target) extras.push(`Salary target: ${old.salary_target}`)
    const notesField = [old.notes, ...extras].filter(Boolean).join('\n\n')

    const next: TrackerApplication = {
      id: old.id,
      createdAt,
      updatedAt,
      company: old.company ?? '',
      role: old.role ?? '',
      status,
      source: old.source || undefined,
      linkedAnalysisId: old.analysis_id || undefined,
      linkedContactIds: Array.isArray(old.contact_ids) ? old.contact_ids : [],
      events,
      notes: notesField,
    }
    await storage.set(`nexus.application.${next.id}`, next)
  }
}

async function migrateContacts(
  legacy: LegacyContact[],
  applications: LegacyApplication[]
): Promise<void> {
  // Derive bidirectional linkage from the application side.
  const linksByContact = new Map<string, string[]>()
  for (const app of applications) {
    for (const cid of app.contact_ids ?? []) {
      const arr = linksByContact.get(cid) ?? []
      arr.push(app.id)
      linksByContact.set(cid, arr)
    }
  }

  for (const old of legacy) {
    const createdAt = toMs(old.created_at, Date.now())
    const updatedAt = toMs(old.updated_at, createdAt)

    const extras: string[] = []
    if (old.phone) extras.push(`Phone: ${old.phone}`)
    if (old.source) extras.push(`Source: ${old.source}`)
    if (Array.isArray(old.tags) && old.tags.length) extras.push(`Tags: ${old.tags.join(', ')}`)
    if (old.last_contacted) extras.push(`Last contacted: ${old.last_contacted}`)
    if (old.next_followup) extras.push(`Next follow-up: ${old.next_followup}`)
    const notesField = [old.notes, ...extras].filter(Boolean).join('\n\n')

    const next: TrackerContact = {
      id: old.id,
      createdAt,
      updatedAt,
      name: old.name ?? '',
      role: old.role || undefined,
      company: old.company || undefined,
      email: old.email || undefined,
      linkedinUrl: old.linkedin || undefined,
      notes: notesField || undefined,
      linkedApplicationIds: linksByContact.get(old.id) ?? [],
    }
    await storage.set(`nexus.contact.${next.id}`, next)
  }
}

async function migrateAppointments(legacy: LegacyAppointment[]): Promise<void> {
  for (const old of legacy) {
    const createdAt = toMs(old.created_at, Date.now())
    const at = toMs(old.starts_at, createdAt)

    const extras: string[] = []
    if (old.location) extras.push(`Location: ${old.location}`)
    if (old.prep_notes) extras.push(`Prep: ${old.prep_notes}`)
    if (old.outcome) extras.push(`Outcome: ${old.outcome}`)
    if (old.company) extras.push(`Company: ${old.company}`)
    const notes = extras.join('\n\n') || undefined

    const next: TrackerAppointment = {
      id: old.id,
      createdAt,
      at,
      title: old.title ?? '',
      type: mapAppointmentType(old.type),
      durationMin: old.duration_min || undefined,
      notes,
      linkedApplicationId: old.application_id || undefined,
      linkedContactIds: Array.isArray(old.contact_ids) ? old.contact_ids : [],
    }
    await storage.set(`nexus.appointment.${next.id}`, next)
  }
}

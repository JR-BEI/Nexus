// Canonical Nexus data model. See docs/functionality_updates/01-data-model.md.
// All entity types use camelCase and unix-ms timestamps. IDs are prefixed
// (rep_, ana_, app_, con_, apt_, evt_, ver_, tc_, rec_) and ULID-ish so they
// sort by creation time.

// =========================
// Repository (work history)
// =========================
export interface RepositoryEntry {
  id: string
  createdAt: number
  updatedAt: number

  source: 'voice' | 'paste' | 'linkedin' | 'manual'

  company: string
  title: string
  startDate: string // ISO "YYYY-MM"
  endDate: string | null // null = current

  summary?: string
  impactStatements: ImpactStatement[]
  skills: string[]
  domains: string[]

  rawTranscript?: string
  rawText?: string

  needsReview: boolean
}

export interface ImpactStatement {
  id: string
  text: string
  metric?: string
  tags: string[]
}

// =========================
// Analysis (a JD → output run)
// =========================
export interface Analysis {
  id: string
  createdAt: number
  updatedAt: number

  jdText: string
  jdSource?: string
  userAngle?: string

  extracted: AnalysisExtracted

  outputs: {
    resume: AnalysisVersion[]
    coverLetter: AnalysisVersion[]
    strategyBrief: AnalysisVersion[]
  }

  linkedRepositoryEntries: string[]
  linkedCompanyId?: string
  linkedTrackerId?: string
}

export interface AnalysisExtracted {
  role: string
  company: string
  seniority: string
  mustHaves: string[]
  niceToHaves: string[]
  keywords: string[]
  redFlags: string[]
}

export interface AnalysisVersion {
  id: string
  createdAt: number
  content: string // markdown
  label?: string
  parentVersionId?: string
}

// =========================
// Tracker
// =========================
export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'on-hold'

export type TrackerEventType =
  | 'status_change'
  | 'note'
  | 'email'
  | 'call'
  | 'interview'
  | 'task'

export interface TrackerEvent {
  id: string
  at: number
  type: TrackerEventType
  fromStatus?: ApplicationStatus
  toStatus?: ApplicationStatus
  content?: string
}

export interface TrackerApplication {
  id: string
  createdAt: number
  updatedAt: number

  company: string
  role: string
  status: ApplicationStatus
  source?: string

  linkedAnalysisId?: string
  linkedCompanyId?: string
  linkedContactIds: string[]

  events: TrackerEvent[]
  notes: string
}

export interface TrackerContact {
  id: string
  createdAt: number
  updatedAt: number

  name: string
  role?: string
  company?: string
  email?: string
  linkedinUrl?: string
  notes?: string

  linkedApplicationIds: string[]
  linkedCompanyId?: string
}

export type AppointmentType =
  | 'phone_screen'
  | 'interview'
  | 'follow_up'
  | 'other'

export interface TrackerAppointment {
  id: string
  createdAt: number
  at: number
  title: string
  type: AppointmentType
  durationMin?: number
  attendees?: string[]
  notes?: string

  linkedApplicationId?: string
  linkedContactIds: string[]
}

// =========================
// Target Companies
// =========================
export interface TargetCompany {
  id: string
  name: string
  vertical: string // 'insurtech' | 'disability' | 'absence' | string
  location?: string
  stage?: string
  fit: number // 0–10
  whyFit?: string
  note?: string
  ats?: string
  careersUrl?: string

  tracked: boolean
  passed: boolean
  passedReason?: string
  lastSeenHiring?: number
}

// =========================
// Strategy (recruiter playbook)
// =========================
export type StrategyStatus =
  | 'not_contacted'
  | 'reached_out'
  | 'in_conversation'
  | 'passed'
  | 'no_response'

export interface StrategyContact {
  id: string
  name: string
  category: string
  type: 'recruiter' | 'board' | 'conference' | 'association'
  description?: string
  priority?: 'highest' | 'high' | 'medium' | 'low'

  status: StrategyStatus
  userNotes?: string
  lastContactedAt?: number
  customAdded?: boolean
}

// =========================
// Settings (single-item)
// =========================
export interface NexusSettings {
  notificationsEnabled?: boolean
  cmdKHintDismissed?: boolean
}

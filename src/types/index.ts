// Core repository types
export interface Education {
  degree: string
  school: string
  location: string
  year: number
}

export interface Meta {
  name: string
  location: string
  email: string
  phone: string
  linkedin: string
  education: Education[]
}

export interface Category {
  name: string
  blocks: string[]
}

export interface ImpactStatement {
  id: string
  text: string
  tags: string[]
}

export interface Position {
  id: string
  title: string
  company: string
  location: string
  start_date: string          // "YYYY-MM" format
  end_date: string | null     // null = current role
  context: string
  categories: Category[]
  impact_statements: ImpactStatement[]
  tags: string[]
}

export interface Repository {
  meta: Meta
  positions: Position[]
}

// API request/response types
export interface JDAnalysis {
  role_title: string
  role_level: string
  company?: string
  industry?: string
  required_skills: string[]
  preferred_skills: string[]
  key_themes: string[]
  cultural_signals: string[]
}

export interface MatchedBlock {
  position_id: string
  position_title: string
  company: string
  statement_id?: string
  statement_text: string
  match_reason: string
  relevance_score: number
  tags: string[]
}

export interface MatchResponse {
  matched_blocks: MatchedBlock[]
  summary: string
}

export interface GenerateRequest {
  type: 'resume' | 'cover_letter' | 'strategy_brief'
  jd_analysis: JDAnalysis
  matched_blocks: MatchedBlock[]
  repository: Repository
}

export interface GenerateResponse {
  content: string
  type: string
}

// localStorage types
export interface Analysis {
  id: string
  job_title: string
  company: string
  date: string
  jd_text: string
  jd_analysis: JDAnalysis
  matched_blocks: MatchedBlock[]
  resume?: string
  cover_letter?: string
  strategy_brief?: string
}

// ============================================================================
// Tracker types (applications, contacts, appointments, notes)
// ============================================================================

export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'on_hold'

export interface Application {
  id: string
  company: string
  role: string
  status: ApplicationStatus
  applied_date: string | null    // ISO date "YYYY-MM-DD"
  jd_url: string
  source: string                 // e.g. "Jacobson", "LinkedIn", "Direct", "Referral"
  salary_target: string
  analysis_id?: string           // link to localStorage Analysis
  contact_ids: string[]          // linked contacts
  notes: string
  created_at: string             // ISO timestamp
  updated_at: string
}

export interface Contact {
  id: string
  name: string
  role: string                   // job title
  company: string
  source: string                 // "Jacobson", "DMEC", "LinkedIn", etc.
  email: string
  phone: string
  linkedin: string
  last_contacted: string | null  // ISO date
  next_followup: string | null   // ISO date
  tags: string[]                 // e.g. ["recruiter", "hiring-manager", "referral"]
  notes: string
  created_at: string
  updated_at: string
}

export type AppointmentType =
  | 'recruiter_call'
  | 'phone_screen'
  | 'technical'
  | 'panel'
  | 'exec'
  | 'networking'
  | 'other'

export interface Appointment {
  id: string
  title: string
  type: AppointmentType
  starts_at: string              // ISO datetime
  duration_min: number
  company: string
  application_id?: string
  contact_ids: string[]
  location: string               // physical or video link
  prep_notes: string
  outcome: string
  created_at: string
  updated_at: string
}

export interface ActivityNote {
  id: string
  date: string                   // ISO date
  body: string
  tags: string[]                 // free-form, e.g. ["#applied", "#networking"]
  application_id?: string
  contact_id?: string
  created_at: string
}

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

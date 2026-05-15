# 01 — Data Model & Storage Foundation

**Read this first.** This file defines the shared data model that every other doc references. The goal is to establish stable types and a consistent storage pattern so features can link to each other cleanly.

## Why this matters

Right now, each feature likely has its own storage shape. Repository entries don't know about Analyses. Analyses don't reference Tracker entries. Tracker entries don't link back to anything. The result is a product where the user has to mentally hold the connections.

This doc establishes:
- A canonical TypeScript type for each entity
- A unified storage adapter (so we can swap localStorage for IndexedDB later without rewriting everything)
- The relationship graph between entities (Repository → Analysis → Tracker)
- IDs and timestamps as universal fields

## 1. Entity types

Create `src/types/nexus.ts` (or your equivalent):

```ts
// =========================
// Repository (work history)
// =========================
export interface RepositoryEntry {
  id: string;                       // e.g. "rep_01HQX..."
  createdAt: number;                // unix ms
  updatedAt: number;

  // Source — how this entry was added
  source: 'voice' | 'paste' | 'linkedin' | 'manual';

  // Core fields
  company: string;
  title: string;
  startDate: string;                // ISO "YYYY-MM" (e.g. "2022-01")
  endDate: string | null;           // null = current

  // Structured content
  summary?: string;                 // 1-2 sentence role summary
  impactStatements: ImpactStatement[];
  skills: string[];                 // ["LLMs", "Product Strategy", ...]
  domains: string[];                // ["disability insurance", "claims", ...]

  // Original input (for re-extraction if model improves)
  rawTranscript?: string;           // voice mode
  rawText?: string;                 // paste mode

  // Confidence — was this extracted cleanly?
  needsReview: boolean;
}

export interface ImpactStatement {
  id: string;
  text: string;                     // "Led development of Maverick AI..."
  metric?: string;                  // "$20M annual savings"
  tags: string[];                   // ["AI", "leadership", "product"]
}

// =========================
// Analysis (a JD → output run)
// =========================
export interface Analysis {
  id: string;                       // e.g. "ana_01HQX..."
  createdAt: number;
  updatedAt: number;

  // Input
  jdText: string;
  jdSource?: string;                // URL or company.com/careers/...
  userAngle?: string;               // optional context user provided

  // Extracted metadata (AI-derived from JD)
  extracted: {
    role: string;                   // "Sr. Product Manager, Model Development"
    company: string;                // "SmarterDx"
    seniority: string;              // "senior" | "director" | "vp" | "c-level"
    mustHaves: string[];
    niceToHaves: string[];
    keywords: string[];
    redFlags: string[];             // things to be cautious about
  };

  // Outputs — each is a versioned string
  outputs: {
    resume: AnalysisVersion[];
    coverLetter: AnalysisVersion[];
    strategyBrief: AnalysisVersion[];
  };

  // Linkage to other entities
  linkedRepositoryEntries: string[];  // RepositoryEntry IDs used as context
  linkedCompanyId?: string;           // TargetCompany ID if launched from Companies
  linkedTrackerId?: string;           // TrackerApplication ID if tracking
}

export interface AnalysisVersion {
  id: string;
  createdAt: number;
  content: string;                  // markdown
  label?: string;                   // "Original", "More conversational", etc.
  parentVersionId?: string;         // for regenerations from a prior version
}

// =========================
// Tracker (applications, contacts, appointments)
// =========================
export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'on-hold';

export interface TrackerApplication {
  id: string;                       // e.g. "app_01HQX..."
  createdAt: number;
  updatedAt: number;

  company: string;
  role: string;
  status: ApplicationStatus;
  source?: string;                  // "Referral - John", "LinkedIn", "Recruiter outreach"

  // Linkage
  linkedAnalysisId?: string;        // Analysis used for this app
  linkedCompanyId?: string;         // TargetCompany if matched
  linkedContactIds: string[];       // TrackerContact IDs

  // Activity
  events: TrackerEvent[];           // status changes, notes, interactions
  notes: string;                    // free-text notes

  // Computed (don't store — derive)
  // daysSinceLastActivity, isStale, etc. — see doc 05
}

export interface TrackerEvent {
  id: string;
  at: number;                       // unix ms
  type: 'status_change' | 'note' | 'email' | 'call' | 'interview' | 'task';
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  content?: string;
}

export interface TrackerContact {
  id: string;                       // e.g. "con_01HQX..."
  createdAt: number;
  updatedAt: number;

  name: string;
  role?: string;
  company?: string;
  email?: string;
  linkedinUrl?: string;
  notes?: string;

  // Linkage
  linkedApplicationIds: string[];
  linkedCompanyId?: string;
}

export interface TrackerAppointment {
  id: string;
  createdAt: number;
  at: number;                       // unix ms of the event
  title: string;
  type: 'phone_screen' | 'interview' | 'follow_up' | 'other';
  durationMin?: number;
  attendees?: string[];             // names or contact IDs
  notes?: string;

  linkedApplicationId?: string;
  linkedContactIds: string[];
}

// =========================
// Target Companies
// =========================
export interface TargetCompany {
  id: string;                       // stable, e.g. "tc_evolutioniq"
  name: string;
  vertical: 'insurtech' | 'disability' | 'absence' | string;
  location?: string;
  stage?: string;                   // "Series C", "Late stage", etc.
  fit: number;                      // 0-10
  whyFit?: string;
  note?: string;
  ats?: string;                     // "Greenhouse", "Lever", etc.
  careersUrl?: string;

  // User state
  tracked: boolean;
  passed: boolean;                  // user said "not interested"
  passedReason?: string;
  lastSeenHiring?: number;          // unix ms — if we detect activity
}

// =========================
// Strategy (recruiter playbook)
// =========================
export interface StrategyContact {
  id: string;                       // e.g. "rec_jacobson_group"
  name: string;                     // "The Jacobson Group"
  category: string;                 // "Insurance-focused firms"
  type: 'recruiter' | 'board' | 'conference' | 'association';
  description?: string;
  priority?: 'highest' | 'high' | 'medium' | 'low';

  // User state (the interactive layer)
  status: 'not_contacted' | 'reached_out' | 'in_conversation' | 'passed' | 'no_response';
  userNotes?: string;
  lastContactedAt?: number;
  customAdded?: boolean;            // true if user added this themselves
}
```

## 2. ID generation

Use ULIDs or a similar sortable ID format. They sort by creation time, which is useful for "most recent" queries without a separate index.

```ts
// src/lib/id.ts
export function generateId(prefix: string): string {
  // ULID-style: prefix_<base32-time><base32-random>
  // Use a tiny library or hand-roll. The 'ulid' npm package is 1KB.
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${time}${rand}`;
}

export const newRepositoryId = () => generateId('rep');
export const newAnalysisId = () => generateId('ana');
export const newApplicationId = () => generateId('app');
export const newContactId = () => generateId('con');
export const newAppointmentId = () => generateId('apt');
export const newEventId = () => generateId('evt');
export const newVersionId = () => generateId('ver');
```

## 3. Storage adapter

Wrap whatever you're using today (localStorage, IndexedDB, etc.) in a typed adapter. This is the single most important refactor — once it's in place, swapping storage backends later is a one-file change.

```ts
// src/lib/storage.ts
export interface Storage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// LocalStorage implementation
class LocalStorageAdapter implements Storage {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async list(prefix: string): Promise<string[]> {
    return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  }
}

export const storage: Storage = new LocalStorageAdapter();
```

**Migration path:** If/when data outgrows localStorage (analyses with large outputs will get there fast), swap `LocalStorageAdapter` for an IndexedDB adapter. Nothing else needs to change.

## 4. Repository pattern (per entity)

Wrap entity CRUD in repository modules. Each module owns its key namespace.

```ts
// src/lib/repos/analysisRepo.ts
import { storage } from '../storage';
import { Analysis } from '../../types/nexus';

const KEY_PREFIX = 'nexus.analysis.';
const keyFor = (id: string) => `${KEY_PREFIX}${id}`;

export const analysisRepo = {
  async get(id: string): Promise<Analysis | null> {
    return storage.get<Analysis>(keyFor(id));
  },

  async list(): Promise<Analysis[]> {
    const keys = await storage.list(KEY_PREFIX);
    const items = await Promise.all(keys.map((k) => storage.get<Analysis>(k)));
    return items
      .filter((x): x is Analysis => x !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async save(analysis: Analysis): Promise<void> {
    const updated = { ...analysis, updatedAt: Date.now() };
    await storage.set(keyFor(analysis.id), updated);
  },

  async delete(id: string): Promise<void> {
    await storage.delete(keyFor(id));
  },

  async findByCompany(company: string): Promise<Analysis[]> {
    const all = await this.list();
    return all.filter((a) => a.extracted.company.toLowerCase() === company.toLowerCase());
  },
};
```

Create the same pattern for:
- `repositoryRepo` (key prefix `nexus.repository.`)
- `applicationRepo` (key prefix `nexus.application.`)
- `contactRepo` (key prefix `nexus.contact.`)
- `appointmentRepo` (key prefix `nexus.appointment.`)
- `companyRepo` (key prefix `nexus.company.`)
- `strategyRepo` (key prefix `nexus.strategy.`)
- `settingsRepo` (key prefix `nexus.settings.`, single-item)

## 5. Cross-entity helpers

The connective tissue functions. These live in a separate module because they touch multiple entities.

```ts
// src/lib/relations.ts
import { Analysis, TrackerApplication } from '../types/nexus';
import { analysisRepo } from './repos/analysisRepo';
import { applicationRepo } from './repos/applicationRepo';

/** Get the application that was created from a given analysis, if any. */
export async function getApplicationForAnalysis(analysisId: string): Promise<TrackerApplication | null> {
  const apps = await applicationRepo.list();
  return apps.find((a) => a.linkedAnalysisId === analysisId) || null;
}

/** Get the analysis that powered a given application, if any. */
export async function getAnalysisForApplication(appId: string): Promise<Analysis | null> {
  const app = await applicationRepo.get(appId);
  if (!app?.linkedAnalysisId) return null;
  return analysisRepo.get(app.linkedAnalysisId);
}

/** Get all analyses for a target company. */
export async function getAnalysesForCompany(companyName: string): Promise<Analysis[]> {
  return analysisRepo.findByCompany(companyName);
}
```

## 6. Migration from existing data

You almost certainly have data already in localStorage in older shapes. Write a one-time migration:

```ts
// src/lib/migrate.ts
const MIGRATION_KEY = 'nexus.migrations.v1';

export async function runMigrations(): Promise<void> {
  const done = localStorage.getItem(MIGRATION_KEY);
  if (done === 'true') return;

  // Example: convert old "pastAnalyses" array into individual entries
  const oldKey = 'pastAnalyses';
  const old = localStorage.getItem(oldKey);
  if (old) {
    try {
      const arr = JSON.parse(old);
      for (const item of arr) {
        // Map old shape → new Analysis shape
        // Save via analysisRepo.save(...)
      }
      localStorage.removeItem(oldKey);
    } catch {}
  }

  // Add more migrations here as needed.

  localStorage.setItem(MIGRATION_KEY, 'true');
}
```

Run on app boot before any UI mounts.

## 7. Acceptance criteria

- [ ] All entity types defined in `src/types/nexus.ts`
- [ ] ID generator at `src/lib/id.ts` with one helper per entity
- [ ] Storage adapter at `src/lib/storage.ts` with `get`/`set`/`delete`/`list`
- [ ] Per-entity repo modules in `src/lib/repos/`
- [ ] Cross-entity helpers in `src/lib/relations.ts`
- [ ] Migration script runs once on app boot
- [ ] Existing features still work (no regressions from refactor)
- [ ] Each entity is queryable by ID and listable, sorted by `updatedAt` desc

## 8. What this enables

Once this is in place, every other doc in this set becomes trivial. "Add a Track button on Outputs" is a one-liner: `await applicationRepo.save({...})`. "Show stale applications" is a list-and-filter. "Link analyses to companies" is a foreign key. Without this foundation, every feature reinvents storage.

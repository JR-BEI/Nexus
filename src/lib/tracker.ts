'use client'

import { useEffect, useState, useCallback } from 'react'
import type {
  Analysis,
  Application,
  ApplicationStatus,
  Contact,
  Appointment,
  ActivityNote,
} from '@/types'

const KEYS = {
  applications: 'tracker.applications',
  contacts: 'tracker.contacts',
  appointments: 'tracker.appointments',
  notes: 'tracker.notes',
} as const

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string; hex: string }[] = [
  { value: 'interested',  label: 'Interested',   color: 'bg-neutral-600/40 text-neutral-300 border-neutral-600/50', hex: '#6366F1' },
  { value: 'applied',     label: 'Applied',      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',         hex: '#3B82F6' },
  { value: 'screening',   label: 'Screening',    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',         hex: '#14B8A6' },
  { value: 'interviewing',label: 'Interviewing', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',   hex: '#A855F7' },
  { value: 'offer',       label: 'Offer',        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',hex: '#10B981' },
  { value: 'rejected',    label: 'Rejected',     color: 'bg-red-500/20 text-red-300 border-red-500/40',            hex: '#EF4444' },
  { value: 'on_hold',     label: 'On hold',      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',      hex: '#F59E0B' },
]

export const APPOINTMENT_TYPES: { value: Appointment['type']; label: string }[] = [
  { value: 'recruiter_call', label: 'Recruiter call' },
  { value: 'phone_screen', label: 'Phone screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'panel', label: 'Panel' },
  { value: 'exec', label: 'Exec interview' },
  { value: 'networking', label: 'Networking' },
  { value: 'other', label: 'Other' },
]

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

function useEntity<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setItems(load<T>(key))
    setLoaded(true)
  }, [key])

  const create = useCallback(
    (item: Omit<T, 'id'> & { id?: string }) => {
      const id = item.id ?? makeId()
      const next = [{ ...item, id } as T, ...load<T>(key)]
      save(key, next)
      setItems(next)
      return id
    },
    [key]
  )

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      const next = load<T>(key).map((it) => (it.id === id ? { ...it, ...patch } : it))
      save(key, next)
      setItems(next)
    },
    [key]
  )

  const remove = useCallback(
    (id: string) => {
      const next = load<T>(key).filter((it) => it.id !== id)
      save(key, next)
      setItems(next)
    },
    [key]
  )

  return { items, loaded, create, update, remove }
}

export const useApplications = () => {
  const e = useEntity<Application>(KEYS.applications)
  const create = (input: Omit<Application, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    return e.create({ ...input, created_at: now, updated_at: now })
  }
  const update = (id: string, patch: Partial<Application>) =>
    e.update(id, { ...patch, updated_at: new Date().toISOString() })
  return { ...e, create, update }
}

export const useContacts = () => {
  const e = useEntity<Contact>(KEYS.contacts)
  const create = (input: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    return e.create({ ...input, created_at: now, updated_at: now })
  }
  const update = (id: string, patch: Partial<Contact>) =>
    e.update(id, { ...patch, updated_at: new Date().toISOString() })
  return { ...e, create, update }
}

export const useAppointments = () => {
  const e = useEntity<Appointment>(KEYS.appointments)
  const create = (input: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    return e.create({ ...input, created_at: now, updated_at: now })
  }
  const update = (id: string, patch: Partial<Appointment>) =>
    e.update(id, { ...patch, updated_at: new Date().toISOString() })
  return { ...e, create, update }
}

export const useNotes = () => {
  const e = useEntity<ActivityNote>(KEYS.notes)
  const create = (input: Omit<ActivityNote, 'id' | 'created_at'>) => {
    return e.create({ ...input, created_at: new Date().toISOString() })
  }
  return { ...e, create }
}

// Read-only loader for past analyses (created by the analyze flow)
export function useAnalyses(): Analysis[] {
  const [items, setItems] = useState<Analysis[]>([])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('analyses')
      setItems(raw ? (JSON.parse(raw) as Analysis[]) : [])
    } catch {
      setItems([])
    }
  }, [])
  return items
}

export function exportAll(): string {
  return JSON.stringify(
    {
      version: 1,
      exported_at: new Date().toISOString(),
      applications: load<Application>(KEYS.applications),
      contacts: load<Contact>(KEYS.contacts),
      appointments: load<Appointment>(KEYS.appointments),
      notes: load<ActivityNote>(KEYS.notes),
    },
    null,
    2
  )
}

export function importAll(json: string) {
  const data = JSON.parse(json)
  if (Array.isArray(data.applications)) save(KEYS.applications, data.applications)
  if (Array.isArray(data.contacts)) save(KEYS.contacts, data.contacts)
  if (Array.isArray(data.appointments)) save(KEYS.appointments, data.appointments)
  if (Array.isArray(data.notes)) save(KEYS.notes, data.notes)
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'
import ApplicationsBoard from '@/components/tracker/ApplicationsBoard'
import ContactsList from '@/components/tracker/ContactsList'
import AppointmentsList from '@/components/tracker/AppointmentsList'
import NotesTimeline from '@/components/tracker/NotesTimeline'
import { PageShell } from '@/components/ui/PageShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { exportAll, importAll } from '@/lib/tracker'
import type { Application } from '@/types'

type Tab = 'applications' | 'contacts' | 'appointments' | 'notes'

const TABS: { value: Tab; label: string }[] = [
  { value: 'applications', label: 'Applications' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'notes', label: 'Activity' },
]

export default function TrackerPage() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  )
}

function TrackerInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('applications')
  const [seedApp, setSeedApp] = useState<Partial<Application> | null>(null)

  useEffect(() => {
    if (searchParams.get('new_app') === '1') {
      setTab('applications')
      setSeedApp({
        company: searchParams.get('company') ?? '',
        role: searchParams.get('role') ?? '',
        source: searchParams.get('source') ?? '',
        jd_url: searchParams.get('jd_url') ?? '',
        status: 'interested',
        applied_date: null,
        salary_target: '',
        contact_ids: [],
        notes: '',
      })
    }
  }, [searchParams])

  const handleExport = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          importAll(String(reader.result))
          toast.success('Import succeeded. Reloading…')
          window.location.reload()
        } catch (err) {
          toast.error(`Import failed: ${err}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <PageShell
      icon={<ClipboardList strokeWidth={1.5} />}
      titlePrefix="Job Search"
      titleAccent="Tracker"
      subtitle="Applications, contacts, appointments & activity — all in your browser."
      status="Local · Your data stays in your browser"
      backHref="/"
      backLabel="Back to Home"
      headerAction={
        <>
          <Button variant="secondary" size="sm" onClick={handleImport}>
            Import
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export
          </Button>
        </>
      }
    >
      <section className="page-content-section">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="applications" className="mt-6">
            <ApplicationsBoard
              seedNew={seedApp}
              onSeedConsumed={() => {
                setSeedApp(null)
                router.replace('/tracker', { scroll: false })
              }}
            />
          </TabsContent>
          <TabsContent value="contacts" className="mt-6">
            <ContactsList />
          </TabsContent>
          <TabsContent value="appointments" className="mt-6">
            <AppointmentsList />
          </TabsContent>
          <TabsContent value="notes" className="mt-6">
            <NotesTimeline />
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  )
}

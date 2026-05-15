'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const PRESETS = [
  'LinkedIn',
  'Company website',
  'Referral',
  'Recruiter outreach',
  'Job board',
  'Other',
] as const

interface Props {
  open: boolean
  onConfirm: (source: string) => void
  onCancel: () => void
}

export function SourceModal({ open, onConfirm, onCancel }: Props) {
  const [source, setSource] = useState('')

  const handlePreset = (preset: string) => {
    // If user already typed something custom and clicks a preset, replace it.
    setSource(preset)
  }

  const handleConfirm = () => {
    onConfirm(source.trim())
    setSource('')
  }

  const handleCancel = () => {
    setSource('')
    onCancel()
  }

  const presetActive = (p: string) => source === p

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Where did you find this role?</DialogTitle>
          <DialogDescription>
            Optional — useful later for spotting which sources convert best.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                presetActive(p)
                  ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <Input
          type="text"
          placeholder="Or add a name (e.g. 'Referral - John Smith')"
          value={PRESETS.includes(source as (typeof PRESETS)[number]) ? '' : source}
          onChange={(e) => setSource(e.target.value)}
        />

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Skip
          </Button>
          <Button onClick={handleConfirm}>Track</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

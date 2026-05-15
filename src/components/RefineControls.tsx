'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, History, Wand2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeDate } from '@/lib/format'
import type { AnalysisVersion } from '@/types/nexus'

const PRESETS = [
  { id: 'shorter', label: 'Shorter', instruction: 'Make this significantly shorter while preserving the key points.' },
  { id: 'longer', label: 'More detail', instruction: "Expand this with more specifics and examples from the candidate's history." },
  { id: 'conversational', label: 'More conversational', instruction: 'Rewrite in a more conversational, less formal tone.' },
  { id: 'formal', label: 'More formal', instruction: 'Rewrite in a more formal, executive-appropriate tone.' },
  { id: 'punchier', label: 'Punchier opening', instruction: 'Rewrite the opening to be punchier and more attention-grabbing.' },
] as const

interface VersionPickerProps {
  versions: AnalysisVersion[]
  activeId: string
  onSelect: (id: string) => void
}

export function VersionPicker({ versions, activeId, onSelect }: VersionPickerProps) {
  if (versions.length <= 1) return null
  const versionNum = versions.findIndex((v) => v.id === activeId) + 1
  const active = versions.find((v) => v.id === activeId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <History className="size-3.5 mr-1" />
          v{versionNum}
          {active?.label ? <span className="text-[var(--text-tertiary)] ml-1">— {active.label}</span> : null}
          <ChevronDown className="size-3.5 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[240px]">
        <DropdownMenuLabel>Versions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {versions.map((v, idx) => (
          <DropdownMenuItem
            key={v.id}
            onSelect={() => onSelect(v.id)}
            className={v.id === activeId ? 'bg-[var(--bg-elevated-2)]' : ''}
          >
            <span className="font-mono text-xs text-[var(--text-tertiary)] mr-2">v{idx + 1}</span>
            <span className="flex-1">{v.label || 'Untitled'}</span>
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums ml-2">
              {formatRelativeDate(v.createdAt)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface RefineButtonProps {
  onRefine: (label: string, instruction: string) => void
  disabled?: boolean
}

export function RefineButton({ onRefine, disabled }: RefineButtonProps) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" disabled={disabled}>
            <Sparkles className="size-3.5 mr-1" />
            Refine
            <ChevronDown className="size-3.5 ml-1 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuLabel>Quick refinements</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => onRefine(p.label, p.instruction)}
            >
              <Wand2 className="size-3.5 mr-2 opacity-60" />
              {p.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCustomOpen(true)}>
            <Pencil className="size-3.5 mr-2 opacity-60" />
            <span className="text-[var(--accent-blue)]">Custom instruction…</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CustomRefineModal
        open={customOpen}
        onCancel={() => setCustomOpen(false)}
        onConfirm={(label, instruction) => {
          setCustomOpen(false)
          onRefine(label, instruction)
        }}
      />
    </>
  )
}

function CustomRefineModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean
  onConfirm: (label: string, instruction: string) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [instruction, setInstruction] = useState('')

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom refinement</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Version label (short)
            </label>
            <Input
              placeholder="e.g. 'for warm intro'"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Instruction to the AI
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. 'Mention that I was referred by Sarah Chen at Bestow'"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(label.trim(), instruction.trim())}
            disabled={!label.trim() || !instruction.trim()}
          >
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

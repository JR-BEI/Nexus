'use client'

import { Target, ArrowUpRight, X } from 'lucide-react'
import type { TargetCompany } from '@/types/nexus'

interface Props {
  company: TargetCompany
  onClear: () => void
}

export function PrefillBanner({ company, onClear }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-blue-500/30 bg-[var(--bg-elevated)] p-4 flex items-center gap-4">
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent-blue)] shadow-[0_0_12px_var(--accent-blue)]"
      />
      <Target className="size-5 text-[var(--accent-blue)] shrink-0" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--text-primary)]">
          Analyzing for <strong>{company.name}</strong>
        </div>
        <div className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
          {company.vertical}
          {company.fit ? ` · Fit ${company.fit}/10` : ''}
          {company.whyFit ? ` · ${company.whyFit}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {company.careersUrl && (
          <a
            href={normalizeUrl(company.careersUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:underline"
          >
            View open roles
            <ArrowUpRight className="size-3" />
          </a>
        )}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear company prefill"
          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

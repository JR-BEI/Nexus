'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

export interface TocSection {
  id: string
  label: string
  level: 1 | 2
}

interface StrategyTOCProps {
  sections: TocSection[]
  activeId: string
}

export function StrategyTOC({ sections, activeId }: StrategyTOCProps) {
  const [query, setQuery] = useState('')
  const filtered = query
    ? sections.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
    : sections

  return (
    <nav className="toc" aria-label="Table of contents">
      <div className="toc-header">
        <span className="toc-label">On this page</span>
        <Input
          type="search"
          placeholder="Filter sections…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <ul className="toc-list">
        {filtered.map((s) => (
          <li
            key={s.id}
            className={[
              'toc-item',
              `toc-item-l${s.level}`,
              activeId === s.id ? 'toc-item-active' : '',
            ].join(' ')}
          >
            <a href={`#${s.id}`} className="toc-link">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

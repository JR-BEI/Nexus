'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import watchlist from '@/data/watchlist.json'
import { Target, MapPin, BarChart3, ArrowUpRight } from 'lucide-react'
import { PageShell } from '@/components/ui/PageShell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fitTier, careersHref } from '@/lib/companies'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Entry = (typeof watchlist)[number]
type SortKey = 'fit_score' | 'company' | 'rank'
type ListFilter = 'all' | 'insurtech' | 'disability'

const LIST_LABELS: Record<ListFilter, string> = {
  all: 'All',
  insurtech: 'Insurtech',
  disability: 'Disability & Absence',
}

export default function CompaniesPage() {
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [atsFilter, setAtsFilter] = useState<string>('all')
  const [minFit, setMinFit] = useState<number>(0)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('fit_score')

  const categories = useMemo(() => {
    const s = new Set<string>()
    watchlist.forEach((e) => {
      if (e.category) s.add(e.category)
    })
    return Array.from(s).sort()
  }, [])

  const atsOptions = useMemo(() => {
    const s = new Set<string>()
    watchlist.forEach((e) => {
      const first = (e.ats || '').split(/\s+or\s+|\s*\/\s*/)[0]?.trim()
      if (first) s.add(first)
    })
    return Array.from(s).sort()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = (watchlist as Entry[]).filter((e) => {
      if (listFilter !== 'all' && e.list !== listFilter) return false
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
      if (atsFilter !== 'all' && !(e.ats || '').toLowerCase().includes(atsFilter.toLowerCase())) return false
      if ((e.fit_score ?? 0) < minFit) return false
      if (q) {
        const hay = [
          e.company,
          e.what_they_do,
          e.hq,
          e.why_fit,
          e.notes,
          e.category ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    return rows.sort((a, b) => {
      if (sortKey === 'company') return a.company.localeCompare(b.company)
      if (sortKey === 'rank') return (a.rank ?? 999) - (b.rank ?? 999)
      return (b.fit_score ?? 0) - (a.fit_score ?? 0)
    })
  }, [listFilter, categoryFilter, atsFilter, minFit, query, sortKey])

  const resetFilters = () => {
    setListFilter('all')
    setCategoryFilter('all')
    setAtsFilter('all')
    setMinFit(0)
    setQuery('')
    setSortKey('fit_score')
  }

  return (
    <PageShell
      icon={<Target strokeWidth={1.5} />}
      titlePrefix="Target"
      titleAccent="Companies"
      subtitle={`${filtered.length} of ${watchlist.length} companies across insurtech, disability & absence`}
      status={`${watchlist.length} companies tracked`}
      backHref="/"
      backLabel="Back to Home"
    >
      <section className="page-content-section">
        <div className="filter-card">
          <div className="filter-row filter-tabs">
            {(Object.keys(LIST_LABELS) as ListFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setListFilter(k)
                  setCategoryFilter('all')
                }}
                className={`filter-tab ${listFilter === k ? 'filter-tab-active' : ''}`}
              >
                {LIST_LABELS[k]}
              </button>
            ))}
          </div>

          <div className="filter-row filter-controls">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, focus, why-fit…"
            />
            <Select value={atsFilter} onValueChange={setAtsFilter}>
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="All ATS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ATS</SelectItem>
                {atsOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fit_score">Sort: Fit score</SelectItem>
                <SelectItem value="rank">Sort: Original rank</SelectItem>
                <SelectItem value="company">Sort: Company A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="filter-row">
            <span className="filter-label">Min fit:</span>
            {[0, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setMinFit(n)}
                className={`filter-chip ${minFit === n ? 'filter-chip-active' : ''}`}
              >
                {n === 0 ? 'Any' : `≥ ${n}`}
              </button>
            ))}

            {listFilter === 'disability' && categories.length > 0 && (
              <>
                <span className="filter-label ml-2">Category:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="min-w-[160px] h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="page-content-section">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No companies match these filters</p>
            <p className="empty-state-body">Try lowering the min fit or clearing search.</p>
            <Button variant="secondary" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="company-list">
            {filtered.map((e, i) => {
              const href = careersHref(e.careers_url)
              const tier = fitTier(e.fit_score)
              return (
                <article key={`${e.list}-${e.company}-${i}`} className="company-card">
                  <div className="company-card-main">
                    <div className={`fit-score fit-score-${tier}`}>
                      {e.fit_score ?? '—'}
                    </div>

                    <div className="company-card-content">
                      <div className="company-card-header">
                        <h3 className="company-name">{e.company}</h3>
                        <span className="company-vertical">{e.list}</span>
                        {e.category && (
                          <span className="text-[11px] px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                            {e.category}
                          </span>
                        )}
                      </div>

                      <div className="company-card-meta">
                        {e.hq && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" /> {e.hq}
                          </span>
                        )}
                        {e.stage && (
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 className="size-3.5" /> {e.stage}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {e.what_they_do}
                      </p>

                      {e.why_fit && (
                        <p className="company-whyfit">
                          <strong>Why fit:</strong> {e.why_fit}
                        </p>
                      )}
                      {e.notes && <p className="company-note">{e.notes}</p>}
                    </div>

                    <div className="company-actions">
                      {e.ats && <span className="company-ats">{e.ats}</span>}
                      <Link
                        href={{
                          pathname: '/tracker',
                          query: {
                            new_app: '1',
                            company: e.company,
                            source: e.ats || '',
                            jd_url: href ?? '',
                          },
                        }}
                      >
                        <Button variant="secondary" size="sm">
                          + Track
                        </Button>
                      </Link>
                      {href && (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          <Button size="sm">
                            Careers <ArrowUpRight className="size-3.5 ml-1" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </PageShell>
  )
}

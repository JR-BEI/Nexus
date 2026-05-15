'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Compass } from 'lucide-react'
import { PageShell } from '@/components/ui/PageShell'
import { ReadingProgress } from '@/components/strategy/ReadingProgress'
import { StrategyTOC, type TocSection } from '@/components/strategy/StrategyTOC'
import { slugify } from '@/lib/slugify'

function extractToc(md: string): TocSection[] {
  const lines = md.split('\n')
  const items: TocSection[] = []
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line.trim())
    if (m) {
      const level: 1 | 2 = m[1].length === 2 ? 1 : 2
      const text = m[2].replace(/\*\*/g, '').trim()
      items.push({ level, label: text, id: slugify(text) })
    }
  }
  return items
}

function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || '')

  useEffect(() => {
    if (sectionIds.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: `-${offset}px 0px -60% 0px`, threshold: 0 }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sectionIds, offset])

  return activeId
}

export default function StrategyView({ markdown }: { markdown: string }) {
  const toc = useMemo(() => extractToc(markdown), [markdown])
  const sectionIds = useMemo(() => toc.map((s) => s.id), [toc])
  const activeId = useScrollSpy(sectionIds)

  return (
    <>
      <ReadingProgress />
      <PageShell
        icon={<Compass strokeWidth={1.5} />}
        titlePrefix="Job Search"
        titleAccent="Strategy"
        subtitle="Executive disability insurance / insurtech — playbook & contacts."
        status="Playbook · Executive disability insurance"
        backHref="/"
        backLabel="Back to Home"
      >
        <section className="page-content-section">
          <div className="strategy-layout">
            <aside className="strategy-toc">
              <StrategyTOC sections={toc} activeId={activeId} />
            </aside>

            <article className="strategy-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => {
                    const text = String(children)
                    return <h2 id={slugify(text)}>{children}</h2>
                  },
                  h3: ({ children }) => {
                    const text = String(children)
                    return <h3 id={slugify(text)}>{children}</h3>
                  },
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </article>
          </div>
        </section>
      </PageShell>
    </>
  )
}

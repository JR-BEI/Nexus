import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contract test for Nexus design tokens.
 *
 * Every token below MUST exist in src/app/globals.css. New design tokens
 * should be added here when added to globals.css so future contributors
 * can't silently delete one.
 *
 * Read this together with docs/01-design-system.md.
 */
const REQUIRED_TOKENS = [
  // surfaces
  '--bg-base',
  '--bg-elevated',
  '--bg-elevated-2',
  '--bg-input',
  // borders
  '--border-subtle',
  '--border-default',
  '--border-strong',
  // text
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--text-disabled',
  // brand + accents
  '--gradient-brand',
  '--gradient-brand-subtle',
  '--accent-blue',
  '--accent-blue-hover',
  '--accent-green',
  '--accent-green-fg',
  '--accent-amber',
  '--accent-red',
  // glows
  '--glow-brand',
  '--glow-blue',
  '--glow-subtle',
  // spacing
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-6',
  '--space-8',
  '--space-12',
  '--space-16',
  '--space-24',
  // radii
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-full',
  // container
  '--container-max',
  '--container-padding',
  // type scale
  '--text-xs',
  '--text-sm',
  '--text-base',
  '--text-lg',
  '--text-xl',
  '--text-2xl',
  '--text-3xl',
  '--text-4xl',
  '--text-5xl',
  // weights + tracking
  '--weight-normal',
  '--weight-medium',
  '--weight-semibold',
  '--weight-bold',
  '--tracking-tight',
  '--tracking-normal',
  '--tracking-wide',
  // motion
  '--transition-fast',
  '--transition-base',
  '--transition-slow',
  '--transition-slower',
  '--ease-out',
  '--ease-in-out',
]

/**
 * Pattern names that hand-written code relies on. If renamed, downstream
 * pages break silently. Updating these requires also updating callers.
 */
const REQUIRED_CLASSES = [
  // shell
  'container-shell',
  'page-header',
  'page-header-top',
  'page-header-text',
  'page-header-action',
  'page-title',
  'page-title-icon',
  'page-subtitle',
  'gradient-text',
  'back-link',
  'status-pill',
  'status-dot',
  'page-content-section',
  // step indicator
  'step-indicator',
  'step-circle',
  'step-pending',
  'step-active',
  'step-complete',
  'step-connector',
  // document card
  'document-card',
  'document-actions',
  'document-content',
  'outputs-footer',
  // build / mic
  'how-it-works',
  'mic-stage',
  'mic-button',
  'mic-rings',
  // tracker
  'tracker-toolbar',
  'tracker-hint',
  'kanban',
  'kanban-column',
  'kanban-pill',
  'kanban-card',
  'kanban-empty',
  // companies
  'filter-card',
  'filter-tab',
  'filter-chip',
  'company-card',
  'fit-score',
  'fit-score-high',
  'fit-score-good',
  'fit-score-fair',
  'fit-score-low',
  // strategy
  'reading-progress',
  'reading-progress-fill',
  'strategy-layout',
  'strategy-toc',
  'strategy-content',
  'toc-list',
  'toc-link',
  'toc-item-active',
]

const globalsPath = path.resolve(__dirname, '../src/app/globals.css')
const globals = readFileSync(globalsPath, 'utf8')

describe('design tokens (globals.css)', () => {
  it.each(REQUIRED_TOKENS)('defines %s', (token) => {
    expect(globals).toMatch(new RegExp(`${token}\\s*:`))
  })

  it('maps shadcn vars onto Nexus tokens (dark, single-theme app)', () => {
    expect(globals).toMatch(/--background:\s*var\(--bg-base\)/)
    expect(globals).toMatch(/--card:\s*var\(--bg-elevated\)/)
    expect(globals).toMatch(/--primary:\s*var\(--accent-blue\)/)
    expect(globals).toMatch(/--destructive:\s*var\(--accent-red\)/)
  })

  it('applies the ambient grid background to <body>', () => {
    expect(globals).toMatch(/body\s*\{[\s\S]*background-image:[\s\S]*linear-gradient/)
  })
})

describe('design system class contract', () => {
  it.each(REQUIRED_CLASSES)('defines .%s', (cls) => {
    // Either a top-level rule or a state variant must exist
    expect(globals).toMatch(new RegExp(`\\.${cls}[\\s,{:.]`))
  })
})

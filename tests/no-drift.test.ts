import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Drift guards.
 *
 * These tests fail if a contributor reintroduces:
 *   1. emoji glyphs in JSX/TS source (use Lucide icons instead)
 *   2. raw hex colors in pages/components (use tokens; hex only allowed in
 *      globals.css and the kanban-color map in src/lib/tracker.ts)
 *   3. tailwind neutral-* utilities (use Nexus surface/text tokens instead)
 *
 * If you have a justified exception, add the exact file path to the
 * corresponding allowlist below with a one-line comment explaining why.
 */

const SRC = path.resolve(__dirname, '../src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'test' || entry === '__tests__' || entry === 'node_modules') continue
      walk(full, out)
    } else if (/\.(tsx?|css)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const allFiles = walk(SRC)
const tsxFiles = allFiles.filter((f) => /\.tsx$/.test(f))
const tsFiles = allFiles.filter((f) => /\.tsx?$/.test(f))

/* ------------------------------------------------------------------ */
/* 1. No emoji glyphs in source                                       */
/* ------------------------------------------------------------------ */

// Pictographs, symbols, dingbats. Excludes basic ASCII and arrow box-drawing.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]|↗|↓|✓|✔|✘/u

const EMOJI_ALLOWLIST: string[] = [
  // Empty by design. Use Lucide icons in src/components or pass via PageShell `icon` prop.
]

describe('no emoji glyphs in source (use Lucide icons)', () => {
  it.each(tsFiles)('%s', (file) => {
    const rel = path.relative(SRC, file)
    if (EMOJI_ALLOWLIST.includes(rel)) return
    const content = readFileSync(file, 'utf8')
    const match = content.match(EMOJI)
    if (match) {
      throw new Error(
        `Emoji glyph "${match[0]}" found in src/${rel}. ` +
          `Replace with a Lucide icon from "lucide-react". ` +
          `If genuinely unavoidable, add "${rel}" to EMOJI_ALLOWLIST with a justification.`
      )
    }
  })
})

/* ------------------------------------------------------------------ */
/* 2. No raw hex colors in components / pages                         */
/* ------------------------------------------------------------------ */

// 3, 4, 6, 8-digit hex. Excludes shorter sequences that might be IDs.
const RAW_HEX = /#[0-9A-Fa-f]{3,8}\b/

const HEX_ALLOWLIST = new Set([
  // Token source of truth — every hex in the app lives here.
  'app/globals.css',
  // Kanban column color map — surfaces as `--col-color` CSS var per column.
  'lib/tracker.ts',
  // @react-pdf/renderer can't read CSS variables — PDFs must use literal hex.
  'components/ResumePDF.tsx',
  'components/CoverLetterPDF.tsx',
])

describe('no raw hex colors outside the token source', () => {
  it.each(allFiles)('%s', (file) => {
    const rel = path.relative(SRC, file).split(path.sep).join('/')
    if (HEX_ALLOWLIST.has(rel)) return
    const content = readFileSync(file, 'utf8')
    // Strip strings that aren't styles (e.g., #anchor links in markdown)
    // and obvious safe contexts. Then check.
    // The hex match itself is conservative: 3+ hex digits prefixed by #.
    // False positives in JSX are rare and worth catching.
    const matches = content.match(new RegExp(RAW_HEX, 'g'))
    if (matches) {
      const samples = matches.slice(0, 3).join(', ')
      throw new Error(
        `Raw hex color(s) ${samples} found in src/${rel}. ` +
          `Use a CSS variable from globals.css (var(--accent-blue), etc.). ` +
          `If this is the right place for a literal, add "${rel}" to HEX_ALLOWLIST.`
      )
    }
  })
})

/* ------------------------------------------------------------------ */
/* 3. Tailwind neutral-* utilities are deprecated                     */
/* ------------------------------------------------------------------ */

// neutral-* fights the Nexus token system. Use bg-elevated / text-secondary etc.
const NEUTRAL_UTIL = /\b(bg|text|border|ring|placeholder|hover:bg|hover:text|hover:border)-neutral-\d+/

// Pre-existing surface area we're not blocking — the bento card, modal, and
// list components that haven't been migrated yet. New files must NOT match.
// Shrink this list over time; do not grow it without an opening rationale.
const NEUTRAL_ALLOWLIST = new Set([
  'app/page.tsx',
  'components/ui/BentoCard.tsx',
  'components/ui/AuroraBackground.tsx',
  'components/AnalysisResults.tsx',
  'components/Spinner.tsx',
  'components/tracker/ApplicationsBoard.tsx',
  'components/tracker/ContactsList.tsx',
  'components/tracker/AppointmentsList.tsx',
  'components/tracker/NotesTimeline.tsx',
])

describe('no new Tailwind neutral-* utilities (use Nexus tokens)', () => {
  it.each(tsxFiles)('%s', (file) => {
    const rel = path.relative(SRC, file).split(path.sep).join('/')
    if (NEUTRAL_ALLOWLIST.has(rel)) return
    const content = readFileSync(file, 'utf8')
    const match = content.match(NEUTRAL_UTIL)
    if (match) {
      throw new Error(
        `Tailwind neutral utility "${match[0]}" found in src/${rel}. ` +
          `Use Nexus surface/text tokens instead — e.g., bg-[var(--bg-elevated)] ` +
          `or text-[var(--text-secondary)]. ` +
          `If migrating a legacy file, add "${rel}" to NEUTRAL_ALLOWLIST and ` +
          `plan the migration in a follow-up.`
      )
    }
  })
})

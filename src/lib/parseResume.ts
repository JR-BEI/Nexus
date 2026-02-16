// Parse markdown resume into structured data for PDF generation

export interface ParsedPosition {
  title: string
  company: string
  dates: string
  bullets: string[]
}

export interface ParsedResume {
  summary: string
  positions: ParsedPosition[]
}

export function parseMarkdownResume(markdown: string): ParsedResume {
  const positions: ParsedPosition[] = []
  let summary = ''
  const lines = markdown.split('\n')

  let currentPosition: ParsedPosition | null = null
  let inSummarySection = false
  let inExperienceSection = false
  let summaryLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Remove any markdown bold/italic markers that might have slipped through
    const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '').trim()

    // Detect Professional Summary section
    if (cleanLine.match(/^##\s*(Professional\s+Summary|Summary)/i)) {
      inSummarySection = true
      inExperienceSection = false
      continue
    }

    // Detect Experience section
    if (cleanLine.match(/^##\s*Experience/i)) {
      inSummarySection = false
      inExperienceSection = true
      // Save summary if we collected any
      if (summaryLines.length > 0) {
        summary = summaryLines.join(' ')
          .replace(/—/g, '-')  // Replace em-dashes with regular hyphens
          .replace(/–/g, '-')  // Replace en-dashes with regular hyphens
          .trim()
      }
      continue
    }

    // Detect Education section (stop processing experience)
    if (cleanLine.match(/^##\s*Education/i)) {
      inSummarySection = false
      inExperienceSection = false
      // Save current position if exists
      if (currentPosition) {
        positions.push(currentPosition)
        currentPosition = null
      }
      continue
    }

    // Skip empty lines, other section headers, and stray formatting
    if (!cleanLine ||
        cleanLine.startsWith('#') ||
        cleanLine === '|' ||
        cleanLine.match(/^[|*\-\s]+$/)) {
      continue
    }

    // Collect summary content
    if (inSummarySection && cleanLine && !cleanLine.startsWith('#')) {
      // Skip lines that look like dates or formatting artifacts
      if (!cleanLine.match(/^\d{4}[-–]\d{4}$/) &&
          !cleanLine.match(/^\*\d{4}[-–]\d{4}\*$/) &&
          cleanLine.length > 10) {
        summaryLines.push(cleanLine)
      }
      continue
    }

    // Position header (### format)
    if (inExperienceSection && line.startsWith('### ')) {
      // Save previous position if exists
      if (currentPosition) {
        positions.push(currentPosition)
      }

      // Parse new position header
      // Format: ### Title | Company | Dates
      const headerText = line.replace('### ', '').replace(/\*\*/g, '').trim()
      const parts = headerText.split('|').map(p => p.trim())

      currentPosition = {
        title: parts[0] || '',
        company: parts[1] || '',
        dates: (parts[2] || '').replace(/—/g, '-').replace(/–/g, '-'), // Replace em/en-dashes with hyphens
        bullets: []
      }
      continue
    }

    // Skip standalone company names or date lines (duplicates)
    if (inExperienceSection && !line.startsWith('- ') && !line.startsWith('* ') && !line.startsWith('### ')) {
      // This might be a duplicate company name or stray date line, skip it
      // Check if it looks like a date pattern or matches a known company
      if (cleanLine.match(/^\d{4}[-–]/) ||
          cleanLine.match(/^\*\d{4}/) ||
          cleanLine.length < 50) { // Short lines that aren't bullets are likely duplicates
        continue
      }
    }

    // Bullet point
    if (inExperienceSection && (line.startsWith('- ') || line.startsWith('* '))) {
      if (currentPosition) {
        const bullet = cleanLine
          .replace(/^[-*]\s+/, '')
          .replace(/—/g, '-')  // Replace em-dashes with regular hyphens
          .replace(/–/g, '-')  // Replace en-dashes with regular hyphens
          .trim()
        if (bullet && bullet.length > 5) { // Only add non-empty, substantial bullets
          currentPosition.bullets.push(bullet)
        }
      }
    }
  }

  // Save last position
  if (currentPosition) {
    positions.push(currentPosition)
  }

  // If no summary was found in sections, look for content before Experience section
  if (!summary && summaryLines.length === 0) {
    summary = 'Experienced professional with a proven track record of delivering results.'
  }

  return { summary, positions }
}

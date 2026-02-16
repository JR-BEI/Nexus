// Parse markdown resume into structured data for PDF generation

export interface ParsedPosition {
  title: string
  company: string
  dates: string
  bullets: string[]
}

export interface ParsedResume {
  positions: ParsedPosition[]
}

export function parseMarkdownResume(markdown: string): ParsedResume {
  const positions: ParsedPosition[] = []
  const lines = markdown.split('\n')

  let currentPosition: ParsedPosition | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines, main headers, and stray formatting characters
    if (!line ||
        line.startsWith('# ') ||
        line.startsWith('## ') ||
        line === '|' ||
        line === '**' ||
        line.match(/^[|*\-\s]+$/)) {
      continue
    }

    // Position header (### format)
    if (line.startsWith('### ')) {
      // Save previous position if exists
      if (currentPosition) {
        positions.push(currentPosition)
      }

      // Parse new position header
      // Format: ### Title | Company | Dates
      const headerText = line.replace('### ', '')
      const parts = headerText.split('|').map(p => p.trim())

      currentPosition = {
        title: parts[0] || '',
        company: parts[1] || '',
        dates: parts[2] || '',
        bullets: []
      }
    }
    // Strong/bold position header (alternative format)
    else if (line.startsWith('**') && line.includes('|')) {
      // Save previous position if exists
      if (currentPosition) {
        positions.push(currentPosition)
      }

      // Remove ** markers and parse
      const headerText = line.replace(/\*\*/g, '').trim()
      const parts = headerText.split('|').map(p => p.trim())

      currentPosition = {
        title: parts[0] || '',
        company: parts[1] || '',
        dates: parts[2] || '',
        bullets: []
      }
    }
    // Bullet point
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentPosition) {
        const bullet = line.replace(/^[-*]\s+/, '').trim()
        if (bullet) { // Only add non-empty bullets
          currentPosition.bullets.push(bullet)
        }
      }
    }
  }

  // Save last position
  if (currentPosition) {
    positions.push(currentPosition)
  }

  return { positions }
}

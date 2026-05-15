import { NextRequest, NextResponse } from 'next/server'
import { callClaude, extractJSON } from '@/lib/claude'

interface ExtractRequest {
  text: string
}

interface ExtractedShape {
  company?: string
  title?: string
  startDate?: string | null
  endDate?: string | null
  summary?: string
  impactStatements?: { text: string; metric?: string }[]
  skills?: string[]
  domains?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as ExtractRequest
    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'text is required and must be at least 50 characters' },
        { status: 400 }
      )
    }

    const prompt = `Extract structured information about a single role from the following text. If the text contains multiple roles, focus on the most prominent or first one.

Return ONLY a JSON object with this exact shape (no prose, no code fences):
{
  "company": "string",
  "title": "string",
  "startDate": "YYYY-MM",
  "endDate": "YYYY-MM" or null,
  "summary": "1-2 sentence summary",
  "impactStatements": [
    { "text": "Achievement description", "metric": "Optional metric like '$20M saved'" }
  ],
  "skills": ["skill1", "skill2"],
  "domains": ["domain1", "domain2"]
}

If anything is unclear, leave the field as null or empty array — do not guess. Do not use em dashes.

Text:
"""
${text}
"""`

    const raw = await callClaude(prompt)
    const json = JSON.parse(extractJSON(raw)) as ExtractedShape

    return NextResponse.json({ extracted: json })
  } catch (error) {
    console.error('Error extracting:', error)
    return NextResponse.json({ error: 'Failed to extract' }, { status: 500 })
  }
}

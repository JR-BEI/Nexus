import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'

interface RefineRequest {
  output_type: 'resume' | 'cover_letter' | 'strategy_brief'
  current_content: string
  instruction: string
}

const TYPE_LABEL: Record<RefineRequest['output_type'], string> = {
  resume: 'resume',
  cover_letter: 'cover letter',
  strategy_brief: 'interview strategy brief',
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RefineRequest
    const { output_type, current_content, instruction } = body

    if (!output_type || !current_content || !instruction) {
      return NextResponse.json(
        { error: 'output_type, current_content and instruction are required' },
        { status: 400 }
      )
    }

    const label = TYPE_LABEL[output_type] ?? 'document'
    const prompt = `You previously generated this ${label} for a job application:

---
${current_content}
---

The user has asked for a refinement: "${instruction}"

Apply the refinement and return the full revised ${label}.
Preserve all factual claims and key accomplishments — only adjust style, length, or emphasis as requested.
Do not use em dashes (—) or en dashes (–); replace with regular hyphens, commas, or rewrite.
Output in markdown format.`

    const content = await callClaude(prompt)
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error refining content:', error)
    return NextResponse.json({ error: 'Failed to refine content' }, { status: 500 })
  }
}

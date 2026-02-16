import { NextRequest, NextResponse } from 'next/server'
import { anthropic, MODEL } from '@/lib/claude'
import { extractExperiencePrompt } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Invalid transcript' },
        { status: 400 }
      )
    }

    // Call Claude to extract structured position data
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: extractExperiencePrompt(transcript)
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse the JSON response
    let position
    try {
      // Try to extract JSON from markdown code blocks if present
      const text = content.text.trim()
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      position = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse JSON:', content.text)
      return NextResponse.json(
        { error: 'Failed to parse extracted data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Extract experience error:', error)
    return NextResponse.json(
      { error: 'Extraction failed' },
      { status: 500 }
    )
  }
}

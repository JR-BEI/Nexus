import { NextRequest, NextResponse } from 'next/server'
import { callClaude, extractJSON } from '@/lib/claude'
import { analyzeJDPrompt } from '@/lib/prompts'
import type { JDAnalysis } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json()

    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    const prompt = analyzeJDPrompt(jobDescription)
    const response = await callClaude(prompt)

    // Parse the JSON response (strip markdown code blocks if present)
    const jsonText = extractJSON(response)
    const jdAnalysis: JDAnalysis = JSON.parse(jsonText)

    return NextResponse.json(jdAnalysis)
  } catch (error) {
    console.error('Error analyzing job description:', error)
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { callClaude, extractJSON } from '@/lib/claude'
import { matchRepositoryPrompt } from '@/lib/prompts'
import type { JDAnalysis, MatchResponse, Repository } from '@/types'
import repositoryData from '@/data/repository.json'

export async function POST(request: NextRequest) {
  try {
    const { jdAnalysis } = await request.json() as { jdAnalysis: JDAnalysis }

    if (!jdAnalysis) {
      return NextResponse.json(
        { error: 'JD analysis is required' },
        { status: 400 }
      )
    }

    const repository = repositoryData as Repository
    const prompt = matchRepositoryPrompt(jdAnalysis, repository)
    const response = await callClaude(prompt)

    // Parse the JSON response (strip markdown code blocks if present)
    const jsonText = extractJSON(response)
    const matchResponse: MatchResponse = JSON.parse(jsonText)

    return NextResponse.json(matchResponse)
  } catch (error) {
    console.error('Error matching repository:', error)
    return NextResponse.json(
      { error: 'Failed to match repository' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import {
  generateResumePrompt,
  generateCoverLetterPrompt,
  generateStrategyBriefPrompt
} from '@/lib/prompts'
import type { GenerateRequest, GenerateResponse, Repository } from '@/types'
import repositoryData from '@/data/repository.json'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateRequest

    const { type, jd_analysis, matched_blocks } = body

    if (!type || !jd_analysis || !matched_blocks) {
      return NextResponse.json(
        { error: 'type, jd_analysis, and matched_blocks are required' },
        { status: 400 }
      )
    }

    const repository = repositoryData as Repository

    let prompt: string
    switch (type) {
      case 'resume':
        prompt = generateResumePrompt(jd_analysis, matched_blocks, repository)
        break
      case 'cover_letter':
        prompt = generateCoverLetterPrompt(jd_analysis, matched_blocks, repository)
        break
      case 'strategy_brief':
        prompt = generateStrategyBriefPrompt(jd_analysis, matched_blocks, repository)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid generation type' },
          { status: 400 }
        )
    }

    const content = await callClaude(prompt)

    const response: GenerateResponse = {
      content,
      type
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

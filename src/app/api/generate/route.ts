import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import {
  generateResumePrompt,
  generateCoverLetterPrompt,
  generateStrategyBriefPrompt
} from '@/lib/prompts'
import type { GenerateRequest, GenerateResponse, Repository } from '@/types'
import repositoryData from '@/data/repository.json'

interface ExtendedGenerateRequest extends GenerateRequest {
  user_angle?: string
  company_context?: string
  selected_entry_ids?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExtendedGenerateRequest

    const { type, jd_analysis, user_angle, company_context, selected_entry_ids } = body
    let { matched_blocks } = body

    if (!type || !jd_analysis || !matched_blocks) {
      return NextResponse.json(
        { error: 'type, jd_analysis, and matched_blocks are required' },
        { status: 400 }
      )
    }

    // If the client narrowed the repository entries to consider, drop matched
    // blocks for unselected positions so the prompt actually respects it.
    if (Array.isArray(selected_entry_ids) && selected_entry_ids.length > 0) {
      const allowed = new Set(selected_entry_ids)
      const filtered = matched_blocks.filter((b) => allowed.has(b.position_id))
      // Don't filter down to nothing — fall back to all matches if intersection is empty.
      if (filtered.length > 0) matched_blocks = filtered
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

    // Prepend optional supplemental context. Keeps existing prompt templates
    // untouched while letting the analyze flow inject company + angle hints.
    const supplements: string[] = []
    if (company_context && company_context.trim()) {
      supplements.push(company_context.trim())
    }
    if (user_angle && user_angle.trim()) {
      supplements.push(`# Candidate's Note on Angle\n${user_angle.trim()}`)
    }
    if (supplements.length) {
      prompt = `${supplements.join('\n\n')}\n\n${prompt}`
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

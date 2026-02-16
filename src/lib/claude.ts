import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export const MODEL = 'claude-sonnet-4-20250514'

export async function callClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const content = message.content[0]
  if (content.type === 'text') {
    return content.text
  }

  throw new Error('Unexpected response format from Claude')
}

// Helper to strip markdown code blocks from JSON responses
export function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
  const match = text.match(codeBlockRegex)

  if (match) {
    return match[1].trim()
  }

  return text.trim()
}

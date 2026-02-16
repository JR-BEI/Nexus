# Code Patterns — Nexus

This document defines the architectural patterns, conventions, and best practices for Nexus development.

---

## Project Architecture

### App Structure (Next.js App Router)

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Home dashboard
│   ├── analyze/
│   │   └── page.tsx        # Main analysis workflow
│   ├── build/
│   │   └── page.tsx        # Voice repository builder
│   └── api/                # API routes (server-side only)
│       ├── analyze-jd/
│       ├── match/
│       ├── generate/
│       ├── transcribe/
│       └── extract-experience/
│
├── components/             # React components
│   ├── JDInput.tsx
│   ├── AnalysisResults.tsx
│   ├── ResumeOutput.tsx
│   ├── ...
│
├── lib/                    # Utilities and shared logic
│   ├── claude.ts           # Claude API client wrapper
│   ├── deepgram.ts         # Deepgram client
│   └── prompts.ts          # All AI prompts
│
├── types/                  # TypeScript types
│   └── index.ts
│
└── data/                   # Static data files
    └── repository.json     # Resume repository
```

### Conventions

- **Pages are client components by default** — use `'use client'` at the top
- **API routes are server-only** — never expose API keys to the client
- **All AI calls go through API routes** — keeps API keys secure
- **Components are collocated by feature** — if a component is only used in one place, consider defining it inline
- **Types are centralized** — all shared types go in `src/types/index.ts`
- **No barrel exports** — import directly from files, not from index files

---

## Component Patterns

### Client Components

All page-level components and most UI components are client components:

```tsx
'use client'

import { useState } from 'react'

export default function MyComponent() {
  const [state, setState] = useState<string>('')

  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

**When to use:**
- Components that use React hooks (useState, useEffect, etc.)
- Components that handle user interactions (onClick, onChange, etc.)
- Components that use browser APIs (localStorage, MediaRecorder, etc.)

### Server Components

Use server components sparingly, only when you need to fetch data server-side before rendering:

```tsx
// No 'use client' directive

export default async function ServerComponent() {
  // Can await data here
  const data = await fetchSomeData()

  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

**When to use:**
- When you need to fetch data server-side before rendering
- When you want to reduce client bundle size
- For static content that doesn't need interactivity

**Note:** In Nexus, most components are client components because we rely on localStorage, user interactions, and client-side state.

---

## State Management

### Local State (useState)

Use `useState` for component-local state that doesn't need to be shared:

```tsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [data, setData] = useState<MyType[]>([])
```

**When to use:**
- UI state (modals open/closed, active tabs, loading states)
- Form inputs
- Temporary data that doesn't need persistence

### URL State (useSearchParams)

Use URL search params for state that should be shareable via URL:

```tsx
const searchParams = useSearchParams()
const analysisId = searchParams.get('id')
```

**When to use:**
- Loading saved analyses by ID (`/analyze?id=123`)
- Filters, sorts, or other query params
- Any state you want to persist across page reloads or be shareable

### localStorage

Use localStorage for persisting data across sessions:

```tsx
// Save
localStorage.setItem('analyses', JSON.stringify(analyses))

// Load
const saved = localStorage.getItem('analyses')
if (saved) {
  const parsed = JSON.parse(saved)
  setAnalyses(parsed)
}
```

**When to use:**
- Past analyses
- User preferences (future: theme, default settings)
- Draft content (future: auto-save JD input)

**Pattern:**
- Always wrap in try/catch (JSON.parse can throw)
- Always check if the key exists before parsing
- Use useEffect to load from localStorage on mount

---

## API Route Patterns

### Request/Response Pattern

```tsx
// app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { input } = body

    // 2. Validate input
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // 3. Call external API (Claude, Deepgram, etc.)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: 'Your prompt here'
        }
      ]
    })

    // 4. Extract and return result
    const content = response.content[0].text
    return NextResponse.json({ content })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Error Handling

- Always wrap in try/catch
- Log errors to console for debugging
- Return meaningful error messages to the client
- Use appropriate HTTP status codes (400, 500, etc.)

### Environment Variables

- All API keys go in `.env.local`
- Access via `process.env.MY_KEY`
- Never expose API keys to the client
- Never commit `.env.local` to git

---

## Data Fetching Patterns

### Fetching from API Routes

```tsx
const [loading, setLoading] = useState(false)
const [data, setData] = useState<MyType | null>(null)
const [error, setError] = useState<string | null>(null)

const fetchData = async () => {
  setLoading(true)
  setError(null)

  try {
    const response = await fetch('/api/my-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'value' })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch')
    }

    const result = await response.json()
    setData(result)

  } catch (err) {
    console.error('Error:', err)
    setError('An error occurred. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

### Parallel Requests

When multiple requests are independent, fetch them in parallel:

```tsx
const [resume, cover, strategy] = await Promise.all([
  fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ type: 'resume', ...data })
  }),
  fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ type: 'cover_letter', ...data })
  }),
  fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ type: 'strategy_brief', ...data })
  })
])
```

**When to use:**
- Multiple API calls that don't depend on each other
- Reduces total wait time (parallel > sequential)

---

## TypeScript Patterns

### Type Definitions

All shared types go in `src/types/index.ts`:

```tsx
export interface Analysis {
  id: string
  job_title: string
  company: string
  date: string
  jd_text: string
  jd_analysis: JDAnalysis
  matched_blocks: MatchedBlock[]
  resume?: string
  cover_letter?: string
  strategy_brief?: string
}

export interface JDAnalysis {
  role_title: string
  company?: string
  location?: string
  required_skills: string[]
  nice_to_have_skills: string[]
  themes: string[]
}

export interface MatchedBlock {
  position_id: string
  position_title: string
  company: string
  statements: string[]
  rationale: string
}
```

### Type Imports

Import types with `type` keyword for clarity:

```tsx
import type { Analysis, JDAnalysis } from '@/types'
```

### Props Interfaces

Define props interfaces inline or at the top of the file:

```tsx
interface MyComponentProps {
  title: string
  onSubmit: (value: string) => void
  loading?: boolean
}

export default function MyComponent({ title, onSubmit, loading = false }: MyComponentProps) {
  // ...
}
```

### Function Types

Use inline function types for callbacks:

```tsx
const handleSubmit = async (value: string): Promise<void> => {
  // ...
}
```

---

## Styling Patterns

### Tailwind Utilities

Always use Tailwind utility classes, never write custom CSS unless absolutely necessary:

```tsx
<button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
hover:bg-blue-700 transition-all">
  Click Me
</button>
```

### Conditional Classes

Use template literals for conditional classes:

```tsx
<div className={`p-4 rounded-lg ${
  isActive ? 'bg-blue-500 text-white' : 'bg-neutral-700 text-neutral-300'
}`}>
  Content
</div>
```

For complex conditions, use a helper function or library like `clsx`:

```tsx
import clsx from 'clsx'

<button className={clsx(
  'px-4 py-2 rounded-lg transition-all',
  isPrimary && 'bg-blue-600 hover:bg-blue-700 text-white',
  !isPrimary && 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
  Button
</button>
```

### Responsive Classes

Use Tailwind breakpoints for responsive design:

```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Column on mobile, row on tablet+ */}
</div>
```

---

## Claude API Integration

### Client Wrapper

All Claude API calls go through `src/lib/claude.ts`:

```tsx
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
```

### Prompt Management

All prompts go in `src/lib/prompts.ts`:

```tsx
export const analyzeJDPrompt = (jobDescription: string) => `
You are analyzing a job description. Extract the following information and return it as JSON:
- role_title: The job title
- company: The company name (if mentioned)
- required_skills: Array of required skills
- nice_to_have_skills: Array of nice-to-have skills
- themes: Array of key themes (e.g., "leadership", "data-driven", "customer-focused")

Job Description:
${jobDescription}

Return your response as valid JSON only, no additional text.
`
```

**Why centralize prompts:**
- Easier to iterate and improve prompts
- Version control for prompt changes
- Reusable across multiple API routes

### Structured Outputs

Where possible, request JSON responses and parse them:

```tsx
const response = await anthropic.messages.create({
  model: CLAUDE_MODEL,
  max_tokens: 4000,
  messages: [
    {
      role: 'user',
      content: myPrompt(input)
    }
  ]
})

const text = response.content[0].text
const parsed = JSON.parse(text) // Assumes Claude returns valid JSON
```

**Handle parsing errors:**
```tsx
try {
  const parsed = JSON.parse(text)
  return parsed
} catch (error) {
  console.error('Failed to parse JSON:', text)
  // Fallback: return raw text or throw error
}
```

---

## Voice Input Pattern (Deepgram)

### Client-Side Recording

Use the MediaRecorder API to capture audio:

```tsx
const [isRecording, setIsRecording] = useState(false)
const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => chunks.push(e.data)

    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' })
      await sendToTranscription(audioBlob)
    }

    recorder.start()
    setMediaRecorder(recorder)
    setIsRecording(true)
  } catch (error) {
    console.error('Error accessing microphone:', error)
  }
}

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop()
    setIsRecording(false)
  }
}
```

### Server-Side Transcription

Send audio to Deepgram via API route:

```tsx
// app/api/transcribe/route.ts
import { createClient } from '@deepgram/sdk'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      Buffer.from(await audioFile.arrayBuffer()),
      { model: 'nova-2', smart_format: true }
    )

    const transcript = result.results.channels[0].alternatives[0].transcript

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}
```

---

## Testing Strategy (Future)

### Unit Tests

Use Jest + React Testing Library for component tests:

```tsx
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

test('renders component', () => {
  render(<MyComponent title="Test" />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

### API Route Tests

Test API routes with Next.js test utilities:

```tsx
import { POST } from './route'

test('returns 400 for invalid input', async () => {
  const request = new Request('http://localhost/api/my-route', {
    method: 'POST',
    body: JSON.stringify({ invalid: 'data' })
  })

  const response = await POST(request)
  expect(response.status).toBe(400)
})
```

**Note:** Testing is not yet implemented in Nexus, but this is the recommended approach when added.

---

## Performance Best Practices

### 1. Avoid Unnecessary Re-renders

- Use `React.memo()` for expensive components
- Use `useMemo()` and `useCallback()` sparingly (only when profiling shows a need)
- Keep component state as local as possible

### 2. Lazy Load Heavy Components

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
})
```

### 3. Optimize Images

Use Next.js Image component:

```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority
/>
```

### 4. Minimize Bundle Size

- Import only what you need from libraries
- Use dynamic imports for rarely-used features
- Check bundle size with `npm run build` and optimize large dependencies

---

## Git Workflow

### Branch Strategy

- **Main branch**: Production-ready code
- **Feature branches**: `feat/feature-name`
- **Bug fixes**: `fix/bug-name`

### Commit Messages

Use conventional commits:

```
feat: Add voice input for repository builder
fix: Correct resume PDF spacing issue
docs: Update CLAUDE.md with new context files
refactor: Extract prompt templates to prompts.ts
```

### Pre-commit Checks

Before committing:
1. Run `npm run lint` to check for errors
2. Test the feature locally
3. Ensure no console errors in the browser

---

## Common Gotchas

### 1. localStorage in Next.js

`localStorage` is only available in the browser, not during SSR:

```tsx
// ❌ Wrong
const data = localStorage.getItem('key')

// ✅ Right
useEffect(() => {
  const data = localStorage.getItem('key')
  setData(data)
}, [])
```

### 2. API Keys in Client Components

Never use API keys in client components:

```tsx
// ❌ Wrong (exposes API key to client)
const anthropic = new Anthropic({ apiKey: 'sk-...' })

// ✅ Right (API key stays server-side)
// Call API route instead, which uses the API key server-side
await fetch('/api/my-route', { method: 'POST', body: ... })
```

### 3. JSON Parsing from Claude

Claude doesn't always return valid JSON, even when prompted to:

```tsx
// ❌ Fragile
const data = JSON.parse(response.content[0].text)

// ✅ Robust
try {
  const text = response.content[0].text.trim()
  // Remove markdown code fences if present
  const cleaned = text.replace(/^```json\n/, '').replace(/\n```$/, '')
  const data = JSON.parse(cleaned)
} catch (error) {
  console.error('Failed to parse JSON:', text)
  // Handle error
}
```

### 4. Race Conditions in State Updates

When updating state based on previous state, use the functional form:

```tsx
// ❌ Wrong (can cause race conditions)
setCount(count + 1)

// ✅ Right
setCount(prevCount => prevCount + 1)
```

---

## When in Doubt

1. **Check existing code first** — consistency is more important than perfection
2. **Keep it simple** — avoid premature optimization and over-engineering
3. **Test in the browser** — don't assume it works until you've tried it
4. **Ask Claude Code** — if you're unsure about a pattern, ask for guidance

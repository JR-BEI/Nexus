# Component Reference — Nexus

This document describes all reusable components in Nexus, their props, usage, and examples.

---

## Core Components

### Spinner

A loading spinner with three size variants.

**Location:** `src/components/Spinner.tsx`

**Props:**
```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'  // Default: 'md'
}
```

**Usage:**
```tsx
import Spinner from '@/components/Spinner'

<Spinner size="lg" />
```

**Sizes:**
- `sm`: 16px (for inline loading, buttons)
- `md`: 24px (default, for general use)
- `lg`: 32px (for full-page loading states)

**Appearance:**
- Neutral-600 border with blue-500 spinning top
- Inherits parent's flex/grid alignment

---

## Form Components

### JDInput

A textarea form for pasting job descriptions with character/word count and validation.

**Location:** `src/components/JDInput.tsx`

**Props:**
```tsx
interface JDInputProps {
  onAnalyze: (jobDescription: string) => void
  loading: boolean
}
```

**Features:**
- Auto-resizing textarea (h-96 fixed height)
- Character and word count display
- Warning for job descriptions over 10,000 characters
- Disabled state while loading
- Submit button with loading spinner

**Usage:**
```tsx
import JDInput from '@/components/JDInput'

<JDInput
  onAnalyze={handleAnalyze}
  loading={isLoading}
/>
```

**Validation:**
- Requires non-empty input to enable submit button
- Trims whitespace before submission

---

## Display Components

### AnalysisResults

Displays the job analysis results, match summary, and matched experience blocks.

**Location:** `src/components/AnalysisResults.tsx`

**Props:**
```tsx
interface AnalysisResultsProps {
  jdAnalysis: JDAnalysis
  matchedBlocks: MatchedBlock[]
  summary: string
  loading: boolean
}
```

**Sections:**
1. **Job Analysis**: Role, company, required skills, key themes
2. **Overall Fit**: AI-generated summary of match quality
3. **Matched Experience**: List of relevant impact statements from repository

**Features:**
- Loading state with spinner
- Color-coded tags (blue for required skills, neutral for themes)
- Relevance score badges (green) for each matched block
- Match reason explanations

**Usage:**
```tsx
import AnalysisResults from '@/components/AnalysisResults'

<AnalysisResults
  jdAnalysis={analysis}
  matchedBlocks={blocks}
  summary={matchSummary}
  loading={isLoading}
/>
```

---

### ResumeOutput

Displays the generated resume with copy-to-clipboard and PDF download.

**Location:** `src/components/ResumeOutput.tsx`

**Props:**
```tsx
interface ResumeOutputProps {
  content: string              // Markdown-formatted resume
  companyName?: string         // For PDF filename
  matchedBlocks: MatchedBlock[] // For PDF generation
}
```

**Features:**
- Markdown content display in a pre-formatted block
- Copy to clipboard button with success feedback
- PDF download button with loading state
- Auto-generated filename: `JR_Resume_CompanyName_YYYY-MM-DD.pdf`

**Usage:**
```tsx
import ResumeOutput from '@/components/ResumeOutput'

<ResumeOutput
  content={resumeMarkdown}
  companyName="Example Corp"
  matchedBlocks={matchedBlocks}
/>
```

**PDF Generation:**
- Uses `@react-pdf/renderer` for PDF creation
- Parses markdown content with `parseMarkdownResume()`
- Passes parsed data to `ResumePDF` component

---

### CoverLetterOutput

Displays the generated cover letter with copy-to-clipboard and PDF download.

**Location:** `src/components/CoverLetterOutput.tsx`

**Props:**
```tsx
interface CoverLetterOutputProps {
  content: string          // Plain text cover letter
  companyName?: string     // For PDF filename
}
```

**Features:**
- Plain text content display
- Copy to clipboard button
- PDF download button
- Auto-generated filename: `JR_CoverLetter_CompanyName_YYYY-MM-DD.pdf`

**Usage:**
```tsx
import CoverLetterOutput from '@/components/CoverLetterOutput'

<CoverLetterOutput
  content={coverLetterText}
  companyName="Example Corp"
/>
```

**PDF Generation:**
- Uses `@react-pdf/renderer`
- Passes text directly to `CoverLetterPDF` component

---

### StrategyBrief

Displays the interview strategy brief in a formatted, readable layout.

**Location:** `src/components/StrategyBrief.tsx`

**Props:**
```tsx
interface StrategyBriefProps {
  content: string  // Markdown-formatted strategy brief
}
```

**Features:**
- Markdown content display
- Copy to clipboard button
- No PDF download (strategy briefs are for reference only)

**Usage:**
```tsx
import StrategyBrief from '@/components/StrategyBrief'

<StrategyBrief content={strategyText} />
```

---

## PDF Components

### ResumePDF

Renders the resume as a PDF document using `@react-pdf/renderer`.

**Location:** `src/components/ResumePDF.tsx`

**Props:**
```tsx
interface ResumePDFProps {
  meta: Repository['meta']      // Name, contact info, education
  parsedResume: ParsedResume     // Sections parsed from markdown
  matchedBlocks: MatchedBlock[]  // Experience statements
  repository: Repository         // Full repository for date lookups
}
```

**Features:**
- Two-column header (name/contact on left, education on right)
- Professional typography (Helvetica family)
- Section headers: EXPERIENCE, EDUCATION (uppercase, letterspaced)
- Company names bold and prominent
- Bullet points with proper spacing
- Page margins: 0.85 inches all sides

**Usage:**
```tsx
import ResumePDF from '@/components/ResumePDF'
import { PDFDownloadLink } from '@react-pdf/renderer'

<PDFDownloadLink
  document={<ResumePDF {...props} />}
  fileName="resume.pdf"
>
  Download PDF
</PDFDownloadLink>
```

**Typography:**
- Name: 18pt bold
- Contact: 9pt, single line
- Section headers: 10pt, bold, uppercase
- Company names: 10.5pt, bold (prominent)
- Job titles: 10pt, regular
- Bullets: 9.5pt, 1.35 line height

---

### CoverLetterPDF

Renders the cover letter as a PDF document.

**Location:** `src/components/CoverLetterPDF.tsx`

**Props:**
```tsx
interface CoverLetterPDFProps {
  meta: Repository['meta']      // Name, contact info
  coverLetterText: string        // Plain text content
  companyName?: string           // Optional, for header
}
```

**Features:**
- Letterhead with name and contact info
- Professional formatting (1-inch margins)
- Proper line spacing (1.5)
- Date auto-generated
- Clean, minimal design

**Usage:**
```tsx
import CoverLetterPDF from '@/components/CoverLetterPDF'
import { PDFDownloadLink } from '@react-pdf/renderer'

<PDFDownloadLink
  document={<CoverLetterPDF {...props} />}
  fileName="cover-letter.pdf"
>
  Download PDF
</PDFDownloadLink>
```

---

## Page Components

### Home (`src/app/page.tsx`)

The dashboard/landing page showing past analyses and a "New Analysis" button.

**Features:**
- Centered layout with max-width
- Large "New Analysis" CTA button
- List of past analyses from localStorage
- View and delete actions for each analysis
- Empty state when no analyses exist

**State:**
- Loads analyses from localStorage on mount
- Updates localStorage when analyses are deleted

---

### Analyze Page (`src/app/analyze/page.tsx`)

The main workflow page with three steps: Input → Analysis → Outputs.

**Features:**
- Step-by-step progress indicator (1. Input → 2. Analysis → 3. Outputs)
- Loads saved analysis from URL param (`?id=123`)
- Generates all outputs in parallel for speed
- Saves completed analysis to localStorage
- Tabbed output view (Resume | Cover Letter | Strategy Brief)

**State:**
- `step`: Current workflow step
- `jobDescription`: Raw JD text
- `jdAnalysis`: Parsed JD analysis
- `matchedBlocks`: Matched impact statements
- `resume`, `coverLetter`, `strategyBrief`: Generated outputs

**URL Parameters:**
- `id`: Analysis ID to load from localStorage

---

## Future Components (Not Yet Implemented)

### VoiceRecorder

For the `/build` page — records audio and sends to Deepgram for transcription.

**Planned Props:**
```tsx
interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  loading?: boolean
}
```

**Planned Features:**
- Microphone button (large, centered)
- Recording indicator (pulsing animation)
- Real-time waveform visualization
- Stop button
- Transcript display area

---

### ExperiencePreview

For the `/build` page — displays extracted position data for review before adding to repository.

**Planned Props:**
```tsx
interface ExperiencePreviewProps {
  position: Position
  onEdit: (field: string, value: any) => void
  onConfirm: () => void
  onCancel: () => void
}
```

**Planned Features:**
- Structured display of position fields
- Inline editing for each field
- Tag editor for impact statements
- Confirm/Cancel actions

---

## Component Guidelines

### When to Create a New Component

Create a new component when:
1. **Reusable**: It's used in multiple places
2. **Complex**: It has significant internal logic or state
3. **Self-contained**: It has a clear, single responsibility
4. **Testable**: It would benefit from isolated testing

### When NOT to Create a Component

Avoid creating a component when:
1. **One-off**: Only used once and unlikely to be reused
2. **Simple**: Just a few lines of JSX with no logic
3. **Tightly coupled**: Depends heavily on parent component's state
4. **Premature abstraction**: No clear reuse case yet

### Component Structure

Follow this structure for all components:

```tsx
'use client'  // If it uses hooks or browser APIs

import { useState } from 'react'
import type { MyType } from '@/types'

interface MyComponentProps {
  prop1: string
  prop2?: number  // Optional props at the end
  onAction: (value: string) => void
}

export default function MyComponent({
  prop1,
  prop2 = 0,  // Default values
  onAction
}: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState('')

  // 2. Derived values
  const computed = state.toUpperCase()

  // 3. Event handlers
  const handleClick = () => {
    onAction(state)
  }

  // 4. Early returns for loading/empty states
  if (!prop1) return null

  // 5. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Prop Naming Conventions

- **Handlers**: `onAction`, `onSubmit`, `onChange` (not `handleAction`)
- **Booleans**: `isActive`, `hasError`, `shouldShow` (descriptive prefixes)
- **Data**: `data`, `items`, `content` (not `theData` or `myData`)
- **IDs**: `userId`, `analysisId` (not `id` if ambiguous)

### Component File Organization

```
src/components/
├── JDInput.tsx           # Form components
├── AnalysisResults.tsx   # Display components
├── ResumeOutput.tsx      # Output components
├── ResumePDF.tsx         # PDF components
├── Spinner.tsx           # Utility components
└── ...
```

**Rules:**
- One component per file
- File name matches component name (PascalCase)
- No barrel exports (no index.ts files)
- Import directly from the file

---

## Styling Patterns

### Layout Components

Use semantic HTML and Tailwind utilities for layout:

```tsx
{/* Container */}
<div className="max-w-4xl mx-auto p-8">
  {/* Content */}
</div>

{/* Card */}
<div className="p-6 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
  {/* Content */}
</div>

{/* Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Items */}
</div>

{/* Flex */}
<div className="flex items-center justify-between gap-4">
  {/* Items */}
</div>
```

### Interactive Components

All interactive elements need hover, focus, and disabled states:

```tsx
{/* Button */}
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg
hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500
transition-all">
  Button
</button>

{/* Input */}
<input className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700
rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
focus:outline-none" />
```

---

## Accessibility Checklist

All components must:
- [ ] Use semantic HTML (`<button>` not `<div onClick>`)
- [ ] Have visible focus states
- [ ] Include ARIA labels for icon-only buttons
- [ ] Support keyboard navigation
- [ ] Meet color contrast requirements (WCAG AA)
- [ ] Show loading states when data is fetching
- [ ] Handle errors gracefully with user-facing messages

---

## Testing (Future)

When adding tests, follow this pattern:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders with props', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('calls onAction when clicked', () => {
    const mockAction = jest.fn()
    render(<MyComponent onAction={mockAction} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockAction).toHaveBeenCalled()
  })
})
```

---

## When in Doubt

1. **Check existing components** — follow established patterns
2. **Keep it simple** — avoid premature abstraction
3. **Test in the browser** — don't assume it works
4. **Ask for feedback** — code review catches issues early

# Nexus - Project Documentation

**A lightweight AI-powered resume generation tool built with Next.js, TypeScript, and Claude API**

*Formerly known as ResumeArsenal*

---

## 🎯 Project Overview

Nexus takes a job description, matches it against a personal resume repository of categorized impact statements, and generates a tailored resume, cover letter, and interview strategy brief using Claude's API.

### Key Features
- ✅ Paste a job description for analysis
- 🎯 AI-powered matching against tagged resume repository
- 📄 Tailored resume generation
- ✉️ Custom cover letter generation
- 🎙️ Interview strategy brief with STAR-format answers
- 💾 Past analyses saved in localStorage
- 🔒 API key stays server-side via Next.js API routes

---

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### AI
- **Model**: Claude Sonnet via Anthropic SDK
- **Integration**: Server-side API routes (API key never exposed to client)

### Data
- **Repository**: Local JSON file (`src/data/repository.json`)
- **Past Analyses**: localStorage (no database needed)

### Deployment
- **Platform**: Vercel

---

## 📁 Project Structure

```
nexus/
├── context/                     # Design system documentation
│   ├── design-principles.md
│   ├── style-guide.md
│   ├── patterns.md
│   └── components.md
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home / dashboard
│   │   ├── analyze/
│   │   │   └── page.tsx            # Main workflow page
│   │   └── api/
│   │       ├── analyze-jd/
│   │       │   └── route.ts        # JD analysis endpoint
│   │       ├── match/
│   │       │   └── route.ts        # Repository matching endpoint
│   │       └── generate/
│   │           └── route.ts        # Resume/cover/strategy generation
│   │
│   ├── components/
│   │   ├── JDInput.tsx             # Job description input form
│   │   ├── AnalysisResults.tsx     # JD breakdown + matched blocks
│   │   ├── ResumeOutput.tsx        # Tailored resume display
│   │   ├── CoverLetterOutput.tsx   # Cover letter display
│   │   └── StrategyBrief.tsx       # Interview prep display
│   │
│   ├── data/
│   │   └── repository.json        # Resume repository (structured JSON)
│   │
│   ├── lib/
│   │   ├── claude.ts              # Claude API client wrapper
│   │   └── prompts.ts             # All prompt templates
│   │
│   └── types/
│       └── index.ts               # TypeScript types
│
├── public/
├── resume_arsenal_spec.md          # Full app blueprint / spec
├── CLAUDE.md                       # This file
├── tailwind.config.ts
├── next.config.js
├── package.json
├── tsconfig.json
└── .env.local                      # ANTHROPIC_API_KEY (never commit)
```

---

## 📐 Context Files

The `/context/` folder contains the design system and development guidelines:

- **[design-principles.md](context/design-principles.md)** — Core design philosophy and anti-patterns to avoid
- **[style-guide.md](context/style-guide.md)** — Color palette, typography, spacing, component styles
- **[patterns.md](context/patterns.md)** — Code patterns, architecture, and best practices
- **[components.md](context/components.md)** — Component reference and usage examples

**When to reference these files:**
- Before starting a new feature — understand the design principles
- When styling components — follow the style guide
- When uncertain about patterns — check patterns.md first
- When using existing components — read components.md for props and usage

These files are the source of truth for design and code consistency. Always prefer following existing patterns over creating new ones.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- Anthropic API key

### Installation

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

---

## 🧩 Core Concepts

### Application Flow

```
User pastes Job Description
        │
        ▼
  API: /analyze-jd
  (Claude extracts requirements, skills, themes)
        │
        ▼
  API: /match
  (Claude matches JD against repository.json)
        │
        ▼
  API: /generate
  (Claude generates resume, cover letter, strategy brief)
        │
        ▼
  UI: Tabbed output display
  (Resume | Cover Letter | Strategy Brief)
```

### Data Model — repository.json

The repository is a structured JSON file containing all career data. This is the source of truth for all generation.

```typescript
interface Repository {
  meta: {
    name: string
    location: string
    email: string
    phone: string
    linkedin: string
    education: Array<{
      degree: string
      school: string
      location: string
      year: number
    }>
  }
  positions: Position[]
}

interface Position {
  id: string
  title: string
  company: string
  location: string
  start_date: string          // "YYYY-MM" format
  end_date: string | null     // null = current role
  context: string
  categories: Array<{
    name: string
    blocks: string[]
  }>
  impact_statements: Array<{
    id: string
    text: string
    tags: string[]
  }>
  tags: string[]
}
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analyze-jd` | POST | Extract requirements from job description |
| `/api/match` | POST | Match JD requirements against repository |
| `/api/generate` | POST | Generate resume, cover letter, or strategy brief |

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Dashboard with "New Analysis" + past analyses |
| `/analyze` | Analyze | Main step-by-step workflow |

---

## 🏗️ Architecture

### AI Integration Pattern

All Claude API calls go through Next.js API routes to keep the API key server-side. The client never calls the Anthropic API directly.

```
Client Component
      ↓ fetch()
Next.js API Route (/api/*)
      ↓ Anthropic SDK
Claude API
      ↓
Structured JSON response
      ↓
Client renders output
```

### Prompt Templates

All prompts live in `src/lib/prompts.ts`. There are 5 main prompts:

1. **analyzeJD** — extracts role requirements, skills, themes from job description
2. **matchRepository** — selects best impact statements from repository for the JD
3. **generateResume** — creates tailored resume from matched blocks
4. **generateCoverLetter** — writes cover letter connecting experience to role
5. **generateStrategyBrief** — creates interview prep with STAR-format answers

### State Management

- **Server state**: API route responses
- **Client state**: React useState for workflow steps, loading, outputs
- **Persistence**: localStorage for saving past analyses

---

## 🎨 Design Guidelines

- **Keep it minimal** — this is a tool, not a showpiece
- **Use Tailwind utility classes** — no custom CSS unless necessary
- **Dark-friendly** — use Tailwind's neutral palette
- **Responsive** — should work on desktop and tablet
- **Loading states** — always show loading indicators during API calls
- **Copy to clipboard** — every output should have a copy button

---

## 📌 Key Constraints

1. **No auth** — this is a personal tool, single user
2. **No database** — repository is a local JSON file, past analyses use localStorage
3. **API key server-side only** — all Claude calls go through API routes
4. **Claude Sonnet** — use `claude-sonnet-4-20250514` for speed and cost
5. **Structured JSON responses** — all API routes return JSON, prompts should request JSON output where applicable
6. **Repository is read-only in MVP** — edits happen manually in the JSON file
7. **No PDF export in MVP** — markdown output with copy-to-clipboard

---

## 🛡️ Error Handling

- Wrap all API calls in try/catch
- Show user-friendly error messages in the UI
- Log errors to console for debugging
- Handle Claude API rate limits gracefully
- Validate JD input is not empty before submitting

---

## 🛣️ Roadmap (Post-MVP)

- [ ] URL scraping — paste LinkedIn URL, auto-extract JD
- [ ] PDF export — downloadable resume PDFs
- [ ] Repository editor — UI to add/edit/delete impact statements
- [ ] Application tracker — log jobs, status, notes
- [ ] Template switcher — different resume formats
- [ ] Analytics — which impact statements get used most

---

## 📖 Reference

- **Full App Spec**: See `resume_arsenal_spec.md` in project root
- **Repository Data**: See `src/data/repository.json`
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Anthropic SDK Docs](https://docs.anthropic.com)

---

**Last Updated**: February 2026

**Version**: 0.1.0 (MVP)

**Claude Code Compatible**: ✅ Yes
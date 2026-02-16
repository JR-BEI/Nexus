# Nexus

A lightweight AI-powered resume generation tool built with Next.js, TypeScript, and Claude API.

*Formerly known as ResumeArsenal*

## Overview

Nexus takes a job description, matches it against your personal resume repository of categorized impact statements, and generates:
- A tailored resume
- A custom cover letter
- An interview strategy brief with STAR-format answers

## Features

- **Smart JD Analysis**: Claude extracts key requirements, skills, and themes from job descriptions
- **Intelligent Matching**: Automatically selects the most relevant impact statements from your career repository
- **Triple Output**: Generates resume, cover letter, and interview prep in one workflow
- **PDF Export**: Download world-class, ATS-friendly PDFs for resume and cover letter
- **Voice Repository Builder**: Record your experience by voice and have AI structure it into your repository
- **Past Analyses**: Saves all analyses to localStorage for easy reference
- **Copy to Clipboard**: Every output includes a copy button for quick use

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Claude Sonnet 4 via Anthropic SDK
- **Voice**: Deepgram for transcription
- **PDF**: @react-pdf/renderer
- **Data**: Local JSON repository

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Anthropic API key (get one at https://console.anthropic.com/)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Add your API keys to `.env.local`:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### 1. Input Job Description

Paste the full job description text into the input field.

### 2. Analysis & Matching

The app:
- Extracts role requirements, skills, and themes using Claude
- Matches them against your repository.json
- Ranks the most relevant impact statements

### 3. Generate Outputs

Creates three tailored documents:
- **Resume**: Formatted with only the most relevant experiences
- **Cover Letter**: Connects your background to the specific role
- **Strategy Brief**: Interview prep with likely questions and STAR answers

### 4. Save & Review

All analyses are automatically saved to localStorage. View past analyses from the home page.

## Project Structure

```
nexus/
├── context/                         # Design system documentation
│   ├── design-principles.md
│   ├── style-guide.md
│   ├── patterns.md
│   └── components.md
│
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home dashboard
│   │   ├── analyze/page.tsx         # Main workflow page
│   │   ├── build/page.tsx           # Voice repository builder
│   │   └── api/
│   │       ├── analyze-jd/route.ts  # JD analysis endpoint
│   │       ├── match/route.ts       # Repository matching
│   │       ├── generate/route.ts    # Output generation
│   │       ├── transcribe/route.ts  # Voice transcription
│   │       └── extract-experience/  # Experience extraction
│   │
│   ├── components/
│   │   ├── JDInput.tsx              # Job description input
│   │   ├── AnalysisResults.tsx      # Analysis display
│   │   ├── ResumeOutput.tsx         # Resume display with PDF export
│   │   ├── CoverLetterOutput.tsx    # Cover letter display with PDF
│   │   ├── StrategyBrief.tsx        # Interview prep display
│   │   ├── VoiceRecorder.tsx        # Voice recording component
│   │   ├── ResumePDF.tsx            # Resume PDF renderer
│   │   └── CoverLetterPDF.tsx       # Cover letter PDF renderer
│   │
│   ├── lib/
│   │   ├── claude.ts                # Claude API client
│   │   └── prompts.ts               # Prompt templates
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   │
│   └── data/
│       └── repository.json          # Your resume repository
│
├── CLAUDE.md                        # Project documentation
├── resume_arsenal_spec.md           # Full app specification
└── .env.local                       # Environment variables (not committed)
```

## Customizing Your Repository

Your career data lives in `src/data/repository.json`. The structure includes:

- **meta**: Personal info, contact details, education
- **positions**: Array of roles with:
  - Basic info (title, company, dates)
  - Categories (organized blocks of experience)
  - Impact statements (individual achievements with tags)
  - Tags (for matching)

To add new experiences, edit the JSON file following the existing structure.

## API Routes

All API calls go through Next.js API routes to keep your keys server-side:

- `POST /api/analyze-jd` - Analyzes job description
- `POST /api/match` - Matches JD against repository
- `POST /api/generate` - Generates resume/cover/strategy
- `POST /api/transcribe` - Transcribes voice recordings via Deepgram
- `POST /api/extract-experience` - Extracts structured position data from transcripts

## Model Configuration

The app uses Claude Sonnet 4 (`claude-sonnet-4-20250514`) for:
- Fast response times
- Cost-effective operation
- High-quality outputs

To change the model, edit `src/lib/claude.ts`.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Deployment

Deploy to Vercel with one click:

1. Push to GitHub
2. Import to Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy

## Future Enhancements

Potential additions for v2:

- [ ] URL scraping for job descriptions
- [x] PDF export (completed)
- [x] Voice repository builder (completed)
- [ ] In-app JSON repository editor
- [ ] Application tracker
- [ ] Multiple resume templates
- [ ] Usage analytics

## Security Notes

- **API Key**: Always server-side, never exposed to client
- **Data**: No external storage - repository is local, analyses in localStorage
- **No Auth**: This is a single-user tool for personal use

## License

Private project for personal use.

## Questions?

See `CLAUDE.md` and `resume_arsenal_spec.md` for detailed documentation.

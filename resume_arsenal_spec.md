# ResumeArsenal — App Spec (MVP)

## Overview

A lightweight Next.js app that takes a job description, matches it against a personal resume repository, and generates a tailored resume, cover letter, and interview strategy brief using Claude's API.

---

## MVP Scope (Day 1 Build)

### What it does:
1. **Paste a job description** → raw text or URL
2. **Analyze the JD** → Claude extracts key requirements, skills, themes
3. **Match against repository** → pulls the most relevant impact statements and category blocks
4. **Generate three outputs:**
   - Tailored resume (markdown → downloadable)
   - Cover letter
   - Interview strategy brief (likely questions, STAR-format answer suggestions, positioning advice)

### What it does NOT do (yet):
- Application tracking / job board
- Multiple user profiles
- Resume template customization
- PDF export (can add later)
- Auth (it's just for you)

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js (App Router) | Modern, fast, good portfolio piece |
| Styling | Tailwind CSS | Quick, clean, no fuss |
| AI | Claude API (Sonnet) | Fast, cheap, smart enough for this |
| Data | Local JSON file | No database needed for MVP — your repository lives as a JSON file |
| Deployment | Vercel | Free tier, instant deploys, pairs with Next.js |

---

## Data Model

### repository.json

The resume repository converted from markdown to structured JSON. This is the core data the app matches against.

```json
{
  "meta": {
    "name": "John Ross",
    "location": "Portland, Maine",
    "email": "AIGuy207@gmail.com",
    "phone": "207.329.3854",
    "linkedin": "LinkedIn.com/in/AIGuy207",
    "education": [
      {
        "degree": "M.S., Business Analytics",
        "school": "University of Southern Maine",
        "year": 2019
      },
      {
        "degree": "B.S., Business Administration",
        "school": "University of Southern Maine",
        "year": 2015
      }
    ]
  },
  "positions": [
    {
      "id": "unum-disability-specialist",
      "title": "Disability Specialist / Lead Disability Specialist",
      "company": "Unum",
      "location": "Portland, Maine",
      "start_date": "2015-03",
      "end_date": "2018-05",
      "context": "First insurance role. Promoted to Lead within 18 months based on performance.",
      "categories": [
        {
          "name": "Claims Management & Operational Execution",
          "blocks": [
            "Managed a caseload of 180–200+ short-term disability claims simultaneously — well above standard volume",
            "Facilitated clinical review sessions 2x/week, driving alignment between clinicians, vocational reps, managers, and examiners"
          ]
        }
      ],
      "impact_statements": [
        {
          "id": "ds-1",
          "text": "Managed 180–200+ concurrent STD claims in a high-volume environment, maintaining accuracy and compliance standards",
          "tags": ["claims-management", "STD", "high-volume", "operational-excellence"]
        }
      ],
      "tags": ["claims-management", "STD", "disability-insurance", "client-relationships", "mentorship"]
    }
  ]
}
```

*Note: Full repository.json will be generated from the markdown we already built — this is just the schema.*

---

## Pages / Routes

### `/` — Home / Dashboard
- Simple landing with a "New Analysis" button
- Maybe a list of past analyses (stored in localStorage for MVP)

### `/analyze` — Main Workflow
- **Step 1: Input** — Textarea to paste job description (or URL — stretch goal)
- **Step 2: Analysis** — Shows extracted JD requirements + matched repository blocks (Claude does this)
- **Step 3: Outputs** — Three tabs:
  - **Resume** — Tailored resume in markdown, copy-to-clipboard button
  - **Cover Letter** — Generated cover letter, copy-to-clipboard
  - **Strategy Brief** — Interview prep, likely questions, positioning advice

### `/repository` — View/Edit Repository (stretch goal)
- View all positions, categories, impact statements
- Add/edit/delete blocks
- Nice to have but not Day 1

---

## Claude API Integration

### Call 1: JD Analysis
**Input:** Raw job description text
**Prompt:** Extract the following from this job description:
- Role title and level
- Company and industry
- Required skills and experience (hard requirements)
- Preferred/nice-to-have skills
- Key themes (e.g., leadership, technical depth, client-facing)
- Cultural signals (startup vs enterprise, fast-paced, collaborative, etc.)

**Output:** Structured JSON

### Call 2: Repository Matching
**Input:** JD analysis JSON + full repository.json
**Prompt:** Given this job analysis and this candidate's repository, select the most relevant impact statements and category blocks. For each selection, explain why it matches. Prioritize:
- Direct skill/experience matches
- Transferable experience that maps to requirements
- Statements with quantifiable outcomes
- Statements that address the role's key themes

**Output:** Ranked list of matched blocks with reasoning

### Call 3: Resume Generation
**Input:** Matched blocks + JD analysis + candidate meta
**Prompt:** Generate a tailored resume using ONLY the provided impact statements. Format as a clean, professional resume. Prioritize the most relevant statements for each position. Keep to 1-2 pages worth of content. Do not invent or embellish — only use what's provided.

**Output:** Resume in markdown

### Call 4: Cover Letter Generation
**Input:** Matched blocks + JD analysis + candidate meta
**Prompt:** Write a compelling cover letter that connects the candidate's experience to this specific role. Use a confident, professional tone. Reference specific achievements from the repository that directly address the job's requirements. Keep it to ~400 words.

**Output:** Cover letter text

### Call 5: Interview Strategy Brief
**Input:** Matched blocks + JD analysis + full repository
**Prompt:** Generate an interview preparation brief:
- 3-5 likely interview questions based on the JD
- For each question, suggest a STAR-format answer using specific examples from the repository
- Key positioning advice (what to emphasize, what gaps to address proactively)
- Questions the candidate should ask the interviewer

**Output:** Strategy brief in markdown

---

## File Structure

```
resume-arsenal/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # Home/dashboard
│   ├── analyze/
│   │   └── page.tsx              # Main workflow
│   └── api/
│       ├── analyze-jd/
│       │   └── route.ts          # JD analysis endpoint
│       ├── match/
│       │   └── route.ts          # Repository matching endpoint
│       └── generate/
│           └── route.ts          # Resume/cover/strategy generation
├── components/
│   ├── JDInput.tsx               # Job description input form
│   ├── AnalysisResults.tsx       # Shows JD breakdown + matches
│   ├── ResumeOutput.tsx          # Tailored resume display
│   ├── CoverLetterOutput.tsx     # Cover letter display
│   └── StrategyBrief.tsx         # Interview prep display
├── data/
│   └── repository.json           # Your resume repository
├── lib/
│   ├── claude.ts                 # Claude API client
│   └── prompts.ts                # All prompt templates
├── public/
├── tailwind.config.ts
├── next.config.js
├── package.json
└── .env.local                    # ANTHROPIC_API_KEY
```

---

## MVP Build Order (suggested sequence for Claude Code)

1. **Scaffold** — `npx create-next-app` with Tailwind, App Router
2. **Data** — Convert repository markdown → `repository.json`
3. **API routes** — Build the 3 API endpoints (analyze, match, generate)
4. **Prompts** — Write and test the prompt templates in `lib/prompts.ts`
5. **UI** — Build the `/analyze` page with the step-by-step workflow
6. **Polish** — Copy buttons, loading states, tab navigation for outputs
7. **Deploy** — Push to Vercel

---

## Future Add-ons (Post Day 1)

- **URL scraping** — paste a LinkedIn URL, auto-extract the JD
- **PDF export** — generate downloadable resume PDFs
- **Repository editor** — UI to add/edit/delete impact statements
- **Application tracker** — log jobs you've applied to, status, notes
- **Template switcher** — different resume formats/styles
- **Side-by-side diff** — compare generated resume vs original
- **Analytics** — which impact statements get used most, skill gap analysis
- **Multi-profile** — different "personas" for different career directions

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Notes

- No auth needed — this is a personal tool
- localStorage for saving past analyses in MVP
- All AI calls go through Next.js API routes (keeps API key server-side)
- Repository updates are manual JSON edits for now — editor UI comes later
- Keep the UI clean and minimal — this is a tool, not a showpiece
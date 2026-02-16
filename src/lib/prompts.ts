import type { JDAnalysis, MatchedBlock, Repository } from '@/types'

export function analyzeJDPrompt(jobDescription: string): string {
  return `Analyze the following job description and extract structured information.

Job Description:
${jobDescription}

Please extract and return a JSON object with the following structure:
{
  "role_title": "the job title",
  "role_level": "entry/mid/senior/director/executive",
  "company": "company name if mentioned",
  "industry": "industry if mentioned",
  "required_skills": ["list of hard requirements and must-have skills"],
  "preferred_skills": ["list of nice-to-have or preferred skills"],
  "key_themes": ["list of key themes like 'leadership', 'technical depth', 'client-facing', etc."],
  "cultural_signals": ["signals about company culture like 'startup', 'fast-paced', 'collaborative', etc."]
}

Return ONLY the JSON object, no additional text.`
}

export function matchRepositoryPrompt(
  jdAnalysis: JDAnalysis,
  repository: Repository
): string {
  return `You are a resume optimization expert. Given a job analysis and a candidate's career repository, select the most relevant impact statements and experiences.

Job Analysis:
${JSON.stringify(jdAnalysis, null, 2)}

Candidate Repository:
${JSON.stringify(repository, null, 2)}

Your task:
1. Review each position and impact statement in the repository
2. Select the statements that best match the job requirements
3. For each selected statement, explain WHY it's relevant
4. Prioritize:
   - Direct skill/experience matches
   - Quantifiable outcomes
   - Statements that address key themes
   - Transferable experience

Return a JSON object with this structure:
{
  "matched_blocks": [
    {
      "position_id": "position id from repository",
      "position_title": "position title",
      "company": "company name",
      "statement_id": "impact statement id",
      "statement_text": "the full impact statement text",
      "match_reason": "clear explanation of why this matches the job",
      "relevance_score": 0-100,
      "tags": ["relevant tags from the statement"]
    }
  ],
  "summary": "1-2 paragraph summary of the candidate's overall fit for this role"
}

Select 10-15 of the BEST matches. Quality over quantity.
Return ONLY the JSON object, no additional text.`
}

export function generateResumePrompt(
  jdAnalysis: JDAnalysis,
  matchedBlocks: MatchedBlock[],
  repository: Repository
): string {
  return `You are a professional resume writer. Generate a tailored resume using ONLY the provided information.

Job Analysis:
${JSON.stringify(jdAnalysis, null, 2)}

Candidate Meta:
${JSON.stringify(repository.meta, null, 2)}

Matched Impact Statements (use these and only these):
${JSON.stringify(matchedBlocks, null, 2)}

Requirements:
1. Format as a clean, professional resume in markdown
2. Use ONLY the provided impact statements - do not invent or embellish
3. Structure by position (most recent first)
4. Prioritize the most relevant statements for each position
5. Keep to 1-2 pages worth of content
6. Include: header with contact info, education, and work experience
7. Do NOT include a summary/objective section
8. Do not use em dashes (—) anywhere in the output. Use commas, semicolons, periods, or rewrite the sentence instead. The tone should feel human-written, not AI-generated.

Format:
- Use ## for section headers (e.g., ## Experience, ## Education)
- Use ### for position titles
- Use bullet points (-) for impact statements
- Bold company names and dates

Return the resume content in markdown format.`
}

export function generateCoverLetterPrompt(
  jdAnalysis: JDAnalysis,
  matchedBlocks: MatchedBlock[],
  repository: Repository
): string {
  return `You are a professional cover letter writer. Write a compelling cover letter that connects the candidate's experience to this specific role.

Job Analysis:
${JSON.stringify(jdAnalysis, null, 2)}

Candidate Information:
Name: ${repository.meta.name}
Location: ${repository.meta.location}

Matched Impact Statements (reference these):
${JSON.stringify(matchedBlocks, null, 2)}

Requirements:
1. Use a confident, professional tone
2. Reference 2-3 specific achievements that directly address the job requirements
3. Explain WHY the candidate is uniquely positioned for this role
4. Keep to ~400 words (3-4 paragraphs)
5. Structure: Opening (express interest), Body (2-3 key matches), Closing (call to action)
6. Do NOT use generic phrases like "I am writing to express my interest"
7. Start strong with a compelling opening that demonstrates understanding of the role
8. Do not use em dashes (—) anywhere in the output. Use commas, semicolons, periods, or rewrite the sentence instead. The tone should feel human-written, not AI-generated.

Do NOT include:
- Address block or date
- "Sincerely" or signature block
- Just the body of the letter

Return the cover letter text in markdown format.`
}

export function generateStrategyBriefPrompt(
  jdAnalysis: JDAnalysis,
  matchedBlocks: MatchedBlock[],
  repository: Repository
): string {
  return `You are an interview coach. Create a comprehensive interview preparation brief for this candidate.

Job Analysis:
${JSON.stringify(jdAnalysis, null, 2)}

Candidate's Full Repository:
${JSON.stringify(repository, null, 2)}

Matched Impact Statements:
${JSON.stringify(matchedBlocks, null, 2)}

Create an interview strategy brief with the following sections:

## Key Positioning Points
2-3 bullet points on what to emphasize about this candidacy

## Likely Interview Questions
Generate 5-7 likely interview questions based on the job requirements

For each question, provide:
- **Question:** [the question]
- **Recommended Approach:** Brief guidance on how to answer
- **Example STAR Response:** A specific example from the repository formatted as:
  - **Situation:** [context]
  - **Task:** [challenge/goal]
  - **Action:** [what they did]
  - **Result:** [outcome]

## Potential Gaps/Challenges
1-2 areas where the candidate might be questioned or have gaps relative to the job requirements, with suggested approaches to address them

## Questions to Ask the Interviewer
4-5 thoughtful questions the candidate should ask, tailored to this specific role and company

Return the strategy brief in markdown format with clear section headers.`
}

export function extractExperiencePrompt(transcript: string): string {
  return `You are extracting structured work experience data from a spoken transcript. The speaker is describing a position they held. Extract the following and return as JSON matching this exact schema:

{
  "id": "short-kebab-case-id",
  "title": "Job Title",
  "company": "Company Name",
  "location": "City, State",
  "start_date": "YYYY-MM",
  "end_date": "YYYY-MM or null if current",
  "context": "Brief context about the role",
  "categories": [
    {
      "name": "Category Name",
      "blocks": ["Detailed description of what they did"]
    }
  ],
  "impact_statements": [
    {
      "id": "short-id",
      "text": "Concise, action-oriented achievement statement",
      "tags": ["relevant", "tags"]
    }
  ],
  "tags": ["position-level", "tags"]
}

Rules:
- Do NOT use em dashes anywhere in the output
- Impact statements should be concise (1-2 sentences), start with action verbs, and include quantifiable outcomes where the speaker mentioned them
- Do not invent or embellish anything not stated by the speaker
- If the speaker was vague about dates, use your best estimate and flag it in the context
- Categorize blocks using themes like: "Leadership", "Technical Delivery", "Client Management", "Product Development", "Process Improvement", "Domain Expertise", etc.
- Generate relevant tags for keyword matching (skills, technologies, domains, etc.)
- Generate a short unique ID for the position (e.g., "acme-product-manager") and for each impact statement (e.g., "pm-1", "pm-2")

Transcript:
${transcript}

Return ONLY the JSON object, no additional text.`
}

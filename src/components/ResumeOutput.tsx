'use client'

import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ResumePDF from './ResumePDF'
import { parseMarkdownResume } from '@/lib/parseResume'
import repositoryData from '@/data/repository.json'
import type { Repository, MatchedBlock } from '@/types'

interface ResumeOutputProps {
  content: string
  companyName?: string
  matchedBlocks: MatchedBlock[]
}

export default function ResumeOutput({
  content,
  companyName,
  matchedBlocks
}: ResumeOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse the markdown resume for PDF generation
  const parsedResume = parseMarkdownResume(content)
  const repository = repositoryData as Repository

  // Generate filename: JR_Resume_CompanyName_YYYY-MM-DD.pdf
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sanitizedCompany = companyName
    ? companyName.replace(/[^a-zA-Z0-9]/g, '_')
    : 'Company'
  const fileName = `JR_Resume_${sanitizedCompany}_${today}.pdf`

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-2 pb-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
        <PDFDownloadLink
          document={
            <ResumePDF
              meta={repository.meta}
              parsedResume={parsedResume}
              matchedBlocks={matchedBlocks}
              repository={repository}
            />
          }
          fileName={fileName}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all font-medium hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {({ loading }) =>
            loading ? 'Preparing PDF...' : '↓ Download as PDF'
          }
        </PDFDownloadLink>
      </div>
      <div className="p-8 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-neutral-100 leading-relaxed text-[15px]">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Check, Download } from 'lucide-react'
import ResumePDF from './ResumePDF'
import { Button } from '@/components/ui/button'
import { parseMarkdownResume } from '@/lib/parseResume'
import repositoryData from '@/data/repository.json'
import type { Repository, MatchedBlock } from '@/types'

interface ResumeOutputProps {
  content: string
  companyName?: string
  jobTitle?: string
  matchedBlocks: MatchedBlock[]
}

export default function ResumeOutput({
  content,
  companyName,
  jobTitle,
  matchedBlocks,
}: ResumeOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Resume copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const parsedResume = parseMarkdownResume(content)
  const repository = repositoryData as Repository

  const today = new Date().toISOString().split('T')[0]
  const filenamePart = companyName
    ? companyName.replace(/[^a-zA-Z0-9]/g, '_')
    : jobTitle
      ? jobTitle.replace(/[^a-zA-Z0-9]/g, '_')
      : ''
  const fileName = filenamePart
    ? `JR_Resume_${filenamePart}_${today}.pdf`
    : `JR_Resume_${today}.pdf`

  return (
    <article className="document-card">
      <div className="document-actions">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            'Copy to Clipboard'
          )}
        </Button>
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
        >
          {({ loading }) => (
            <Button size="sm" asChild>
              <span>
                {loading ? (
                  'Preparing PDF…'
                ) : (
                  <>
                    <Download className="size-3.5" /> Download as PDF
                  </>
                )}
              </span>
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      <div className="document-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </article>
  )
}

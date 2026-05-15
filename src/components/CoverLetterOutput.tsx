'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Check, Download } from 'lucide-react'
import CoverLetterPDF from './CoverLetterPDF'
import { Button } from '@/components/ui/button'
import repositoryData from '@/data/repository.json'
import type { Repository } from '@/types'

interface CoverLetterOutputProps {
  content: string
  companyName?: string
}

export default function CoverLetterOutput({
  content,
  companyName,
}: CoverLetterOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Cover letter copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const repository = repositoryData as Repository
  const today = new Date().toISOString().split('T')[0]
  const sanitizedCompany = companyName
    ? companyName.replace(/[^a-zA-Z0-9]/g, '_')
    : 'Company'
  const fileName = `JR_CoverLetter_${sanitizedCompany}_${today}.pdf`

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
            <CoverLetterPDF
              meta={repository.meta}
              coverLetterText={content}
              companyName={companyName}
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

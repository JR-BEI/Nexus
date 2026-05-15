'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StrategyBriefProps {
  content: string
}

export default function StrategyBrief({ content }: StrategyBriefProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Strategy brief copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

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
      </div>
      <div className="document-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </article>
  )
}

'use client'

import { useState } from 'react'

interface StrategyBriefProps {
  content: string
}

export default function StrategyBrief({ content }: StrategyBriefProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-2 pb-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
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

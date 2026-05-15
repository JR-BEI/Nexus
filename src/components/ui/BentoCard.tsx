'use client'

import { useRef, type ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  subtitle?: string
  onClick?: () => void
  className?: string
  gradient?: string  // tailwind gradient utility classes for the title bar
  featured?: boolean
}

export default function BentoCard({
  icon,
  title,
  subtitle,
  onClick,
  className = '',
  gradient = 'from-blue-500/10 to-purple-500/10',
  featured = false,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`bento-spotlight moving-border group text-left rounded-2xl border border-neutral-800/80 bg-neutral-900/60 hover:border-neutral-700 backdrop-blur-sm overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${className}`}
    >
      {/* Subtle gradient wash */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 pointer-events-none`} />

      <div className={`relative ${featured ? 'p-7' : 'p-5'} h-full flex flex-col justify-between min-h-[140px]`}>
        <div>
          <div className={`${featured ? 'text-4xl mb-3' : 'text-2xl mb-2'} transition-transform group-hover:scale-110 inline-block`}>
            {icon}
          </div>
          <div className={`font-semibold text-neutral-100 ${featured ? 'text-2xl' : 'text-base'}`}>
            {title}
          </div>
          {subtitle && (
            <p className={`text-neutral-400 ${featured ? 'text-sm mt-2' : 'text-xs mt-1'} leading-relaxed`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center text-xs text-neutral-500 group-hover:text-blue-300 mt-3 transition-colors">
          <span>Open</span>
          <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </button>
  )
}

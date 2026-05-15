'use client'

import { useEffect, useState } from 'react'

const KEY = 'nexus.hotkeyHintDismissed'

export function HotkeyHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(KEY) === 'true') return
    const showTimer = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (!show) return
    const dismiss = () => {
      setShow(false)
      try {
        window.localStorage.setItem(KEY, 'true')
      } catch {
        // ignore
      }
    }
    const t = setTimeout(dismiss, 8000)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [show])

  if (!show) return null

  const isMac =
    typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  const symbol = isMac ? '⌘' : 'Ctrl'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-elevated-2)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] shadow-[0_8px_24px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-300">
      Tip: press{' '}
      <kbd className="px-1.5 py-0.5 mx-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-mono text-xs">
        {symbol}K
      </kbd>{' '}
      to search and navigate anywhere
    </div>
  )
}

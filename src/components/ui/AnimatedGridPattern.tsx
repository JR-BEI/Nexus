'use client'

import { useEffect, useState } from 'react'

interface Props {
  cellSize?: number       // px
  numSquares?: number     // count of animated cells
  maxOpacity?: number     // peak alpha for each cell
  className?: string
}

interface Cell {
  x: number
  y: number
  delay: number
  duration: number
  peak: number
}

export default function AnimatedGridPattern({
  cellSize = 48,
  numSquares = 36,
  maxOpacity = 0.16,
  className = '',
}: Props) {
  const [cells, setCells] = useState<Cell[]>([])

  useEffect(() => {
    // Generate randomized cells on the client only (avoids SSR hydration mismatch)
    const cols = Math.ceil((typeof window !== 'undefined' ? window.innerWidth : 1280) / cellSize) + 4
    const rows = Math.ceil((typeof window !== 'undefined' ? window.innerHeight : 800) / cellSize) + 4
    const next: Cell[] = []
    for (let i = 0; i < numSquares; i++) {
      next.push({
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 4,
        peak: maxOpacity * (0.5 + Math.random() * 0.5),
      })
    }
    setCells(next)
  }, [cellSize, numSquares, maxOpacity])

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        // base grid lines
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: `${cellSize}px ${cellSize}px`,
        maskImage:
          'radial-gradient(ellipse at center, black 0%, black 50%, transparent 90%)',
        WebkitMaskImage:
          'radial-gradient(ellipse at center, black 0%, black 50%, transparent 90%)',
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="grid-cell absolute bg-blue-400/40"
          style={
            {
              left: c.x * cellSize,
              top: c.y * cellSize,
              width: cellSize - 1,
              height: cellSize - 1,
              '--delay': `${c.delay}s`,
              '--dur': `${c.duration}s`,
              '--peak': c.peak,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

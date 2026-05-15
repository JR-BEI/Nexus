import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and joins with hyphens', () => {
    expect(slugify('Executive Recruiters')).toBe('executive-recruiters')
  })

  it('strips punctuation', () => {
    expect(slugify('1. Boards & Conferences')).toBe('1-boards-conferences')
  })

  it('collapses repeated whitespace and hyphens', () => {
    expect(slugify('  Insurance —  focused   firms  ')).toBe('insurance-focused-firms')
  })

  it('is idempotent: slugify(slugify(x)) === slugify(x)', () => {
    const x = 'Tech / Insurtech Executive Search'
    expect(slugify(slugify(x))).toBe(slugify(x))
  })
})

import { describe, expect, it } from 'vitest'
import { fitTier, careersHref } from './companies'

describe('fitTier', () => {
  it.each([
    [10, 'high'],
    [9, 'high'],
    [8, 'good'],
    [7, 'good'],
    [6, 'fair'],
    [5, 'fair'],
    [4, 'low'],
    [0, 'low'],
  ] as const)('maps score %s to %s', (score, tier) => {
    expect(fitTier(score)).toBe(tier)
  })

  it('falls back to "low" for null and undefined', () => {
    expect(fitTier(null)).toBe('low')
    expect(fitTier(undefined)).toBe('low')
  })
})

describe('careersHref', () => {
  it('returns absolute URLs untouched', () => {
    expect(careersHref('https://example.com/careers')).toBe(
      'https://example.com/careers'
    )
    expect(careersHref('http://example.com')).toBe('http://example.com')
  })

  it('prefixes bare domains with https://', () => {
    expect(careersHref('example.com/jobs')).toBe('https://example.com/jobs')
  })

  it('rejects placeholder strings used in the dataset', () => {
    expect(careersHref('search Google')).toBeNull()
    expect(careersHref('verify on LinkedIn')).toBeNull()
    expect(careersHref('via recruiter')).toBeNull()
  })

  it('rejects empty and whitespace-only values', () => {
    expect(careersHref('')).toBeNull()
    expect(careersHref(undefined)).toBeNull()
  })

  it('rejects free-text without a domain', () => {
    expect(careersHref('see hiring manager')).toBeNull()
  })
})

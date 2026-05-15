/**
 * Fit-score tier mapping for the Target Companies page.
 *
 * Tiers control the visual treatment of the score badge (see
 * .fit-score-* classes in globals.css and docs/07-target-companies.md).
 */
export type FitTier = 'high' | 'good' | 'fair' | 'low'

export function fitTier(score: number | null | undefined): FitTier {
  if (score == null) return 'low'
  if (score >= 9) return 'high'
  if (score >= 7) return 'good'
  if (score >= 5) return 'fair'
  return 'low'
}

/**
 * Normalize a careers URL field into a usable href or null.
 * Some entries contain placeholder strings like "search" or "verify"
 * that should not render as links.
 */
export function careersHref(url: string | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^(search|via|verify)/i.test(trimmed)) return null
  if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`
  return null
}

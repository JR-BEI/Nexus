export type PaletteResultType =
  | 'analysis'
  | 'application'
  | 'contact'
  | 'company'
  | 'strategy'
  | 'repository'
  | 'action'
  | 'recent'

export interface PaletteResult {
  id: string
  type: PaletteResultType
  group: string
  icon: string
  title: string
  subtitle?: string
  href?: string
  shortcut?: string
  /** Free-text aliases used when ranking. */
  keywords?: string[]
  /** Set on action results. Falls back to href navigation otherwise. */
  execute?: () => void
  score?: number
}

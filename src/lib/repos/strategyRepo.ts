import type { StrategyContact } from '@/types/nexus'
import { createRepo } from './baseRepo'

// Stores user state for strategy entries (curated list lives in code; doc 09).
// IDs of curated entries are stable strings (e.g. "rec_jacobson_group") so user
// state attaches to a specific curated row by ID. customAdded entries get
// generated IDs via newStrategyId().
export const strategyRepo = createRepo<StrategyContact>('nexus.strategy.')

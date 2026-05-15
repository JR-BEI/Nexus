import type { RepositoryEntry } from '@/types/nexus'
import { createRepo } from './baseRepo'

export const repositoryRepo = createRepo<RepositoryEntry>('nexus.repository.')

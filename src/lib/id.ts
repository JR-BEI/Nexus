// Sortable, prefixed IDs. Time component encodes Date.now() in base36 so IDs
// are roughly chronologically sortable as strings — handy for "most recent"
// queries without a separate index.

export function generateId(prefix: string): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 10)
  return `${prefix}_${time}${rand}`
}

export const newRepositoryId = () => generateId('rep')
export const newAnalysisId = () => generateId('ana')
export const newApplicationId = () => generateId('app')
export const newContactId = () => generateId('con')
export const newAppointmentId = () => generateId('apt')
export const newEventId = () => generateId('evt')
export const newVersionId = () => generateId('ver')
export const newCompanyId = () => generateId('tc')
export const newStrategyId = () => generateId('rec')
export const newImpactId = () => generateId('imp')

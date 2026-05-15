// Cross-entity helpers. Lives outside any single repo because each function
// touches multiple repos.

import type { Analysis, TrackerApplication } from '@/types/nexus'
import { analysisRepo } from './repos/analysisRepo'
import { applicationRepo } from './repos/applicationRepo'

/** Application that was tracked from a given analysis, if any. */
export async function getApplicationForAnalysis(
  analysisId: string
): Promise<TrackerApplication | null> {
  return applicationRepo.findByAnalysis(analysisId)
}

/** Analysis that powered a given application, if any. */
export async function getAnalysisForApplication(
  appId: string
): Promise<Analysis | null> {
  const app = await applicationRepo.get(appId)
  if (!app?.linkedAnalysisId) return null
  return analysisRepo.get(app.linkedAnalysisId)
}

/** All analyses for a target company (matched by company name). */
export async function getAnalysesForCompany(
  companyName: string
): Promise<Analysis[]> {
  return analysisRepo.findByCompany(companyName)
}

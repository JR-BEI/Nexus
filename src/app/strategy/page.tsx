import fs from 'node:fs/promises'
import path from 'node:path'
import StrategyView from './StrategyView'

export const dynamic = 'force-static'

export default async function StrategyPage() {
  const filePath = path.join(process.cwd(), 'docs', 'job_search_landscape.md')
  const markdown = await fs.readFile(filePath, 'utf8')
  return <StrategyView markdown={markdown} />
}

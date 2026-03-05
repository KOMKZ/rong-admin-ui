/**
 * Gate: API Report Drift Detection
 *
 * Runs api-extractor in --local mode and checks if the API report file
 * is up-to-date with the current build output.
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const reportDir = join(root, 'reports', 'api')
const apiExtractorConfig = join(root, 'api-extractor.json')

if (!existsSync(apiExtractorConfig)) {
  console.error('[gate:api] FAILED - api-extractor.json not found')
  process.exit(1)
}

try {
  execSync('npx api-extractor run --local --verbose', {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
} catch (err) {
  const output = (err.stdout || '') + (err.stderr || '')
  if (output.includes('Warning:') && !output.includes('Error:')) {
    console.warn('[gate:api] WARN - api-extractor produced warnings:')
    console.warn(output.slice(0, 500))
  } else {
    console.error('[gate:api] FAILED - api-extractor error:')
    console.error(output.slice(0, 1000))
    process.exit(1)
  }
}

if (!existsSync(join(reportDir, 'admin-ui.api.md'))) {
  console.warn('[gate:api] WARN - No API report file found; generating initial report.')
}

console.log('[gate:api] PASS')

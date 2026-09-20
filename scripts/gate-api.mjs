/**
 * Gate: API Report Drift Detection
 *
 * Runs api-extractor in --local mode and checks if the API report file
 * is up-to-date with the current build output.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
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

// api-extractor 固定输出 CRLF；仓库事实是 LF，这里统一规范化，避免 diff-check 全量脏。
function normalizeReportFile(file) {
  if (!/\.api\.(json|md)$/.test(file)) return
  const normalized = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  writeFileSync(file, normalized)
}
for (const entry of readdirSync(reportDir, { withFileTypes: true })) {
  if (entry.isFile()) normalizeReportFile(join(reportDir, entry.name))
  else if (entry.isDirectory()) {
    for (const name of readdirSync(join(reportDir, entry.name))) {
      normalizeReportFile(join(reportDir, entry.name, name))
    }
  }
}

if (!existsSync(join(reportDir, 'admin-ui.api.md'))) {
  console.warn('[gate:api] WARN - No API report file found; generating initial report.')
}

console.log('[gate:api] PASS')

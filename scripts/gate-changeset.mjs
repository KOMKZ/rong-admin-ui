/**
 * Gate: Changeset Presence
 *
 * Ensures at least one changeset file exists when public API files have been modified.
 * In development, this is a soft check that prints a warning.
 * In CI, missing changesets cause a hard failure.
 */
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const changesetDir = join(root, '.changeset')
const isCI = !!process.env.CI

if (!existsSync(changesetDir)) {
  console.error('[gate:changeset] FAILED - .changeset directory not found. Run: npx changeset init')
  process.exit(1)
}

const changesetFiles = readdirSync(changesetDir).filter(
  (f) => f.endsWith('.md') && f !== 'README.md',
)

if (changesetFiles.length === 0) {
  const msg = 'No changeset found. If you changed the public API, run: npx changeset'
  if (isCI) {
    console.error(`[gate:changeset] FAILED - ${msg}`)
    process.exit(1)
  } else {
    console.warn(`[gate:changeset] WARN - ${msg}`)
  }
}

console.log(`[gate:changeset] PASS (${changesetFiles.length} changeset(s) found)`)

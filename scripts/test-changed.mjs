import { existsSync, readdirSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

const root = process.cwd()
const baseRef = process.env.BASE_REF || 'main'

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function listFilesRecursive(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(abs))
    } else {
      out.push(abs)
    }
  }
  return out
}

function normalize(path) {
  return path.replaceAll('\\', '/')
}

const changed = new Set()

for (const cmd of [
  `git diff --name-only --diff-filter=ACMRTUXB ${baseRef}...HEAD`,
  'git diff --name-only --diff-filter=ACMRTUXB',
  'git diff --name-only --cached --diff-filter=ACMRTUXB',
]) {
  const text = run(cmd)
  if (!text) continue
  for (const file of text.split('\n').filter(Boolean)) changed.add(normalize(file))
}

const changedSource = [...changed].filter((f) => /^src\/.+\.(ts|vue)$/.test(f) || /^tests\/.+\.test\.ts$/.test(f))

if (changedSource.length === 0) {
  console.log('[test:changed] no changed source files, running smoke unit set')
  const smoke = spawnSync('npx', ['vitest', 'run', 'tests/integration/core-pipeline.test.ts'], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })
  process.exit(smoke.status ?? 1)
}

const allTests = listFilesRecursive(join(root, 'tests'))
  .map(normalize)
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => f.replace(`${normalize(root)}/`, ''))

const selected = new Set()

for (const file of changedSource) {
  if (file.startsWith('tests/') && file.endsWith('.test.ts')) {
    selected.add(file)
    continue
  }

  const stem = basename(file, extname(file)).toLowerCase()
  const segmentMatch = file.match(/^src\/components\/([^/]+)/)
  const segment = segmentMatch ? segmentMatch[1].toLowerCase() : null

  for (const testFile of allTests) {
    const lower = testFile.toLowerCase()
    if (lower.includes(stem)) selected.add(testFile)
    if (segment && lower.includes(`/components/${segment}`)) selected.add(testFile)
  }
}

const testArgs = [...selected]

if (testArgs.length === 0) {
  console.log('[test:changed] no direct test mapping found, running full suite')
  const full = spawnSync('npx', ['vitest', 'run'], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })
  process.exit(full.status ?? 1)
}

console.log(`[test:changed] running ${testArgs.length} mapped tests`)
const proc = spawnSync('npx', ['vitest', 'run', ...testArgs], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
})

process.exit(proc.status ?? 1)

import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

const [iterationId, dateArg] = process.argv.slice(2)

if (!iterationId) {
  console.error('Usage: npm run knowledge:new -- <iteration-id> [YYYY-MM-DD]')
  process.exit(1)
}

const date = dateArg ?? new Date().toISOString().slice(0, 10)
const month = date.slice(0, 7)
const isPrefixed = /^\d{4}-\d{2}-/.test(iterationId)
const fileName = isPrefixed ? `${iterationId}.md` : `${month}-${iterationId}.md`

const templatePath = path.join(
  repoRoot,
  '.cursor/skills/rong-admin-ui-memory/templates/ITERATION-KNOWLEDGE.md',
)
const snapshotDir = path.join(repoRoot, 'docs/admin-ui-framework/knowledge/iterations')
const snapshotPath = path.join(snapshotDir, fileName)
const ledgerPath = path.join(repoRoot, 'docs/admin-ui-framework/knowledge/L4-iteration-ledger.md')
const indexPath = path.join(repoRoot, 'docs/admin-ui-framework/knowledge/INDEX.md')

if (existsSync(snapshotPath)) {
  console.error(`Snapshot already exists: ${snapshotPath}`)
  process.exit(1)
}

mkdirSync(snapshotDir, { recursive: true })

let branch = 'unknown'
try {
  branch = execSync('git branch --show-current', {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim()
} catch {
  // keep fallback
}

const template = readFileSync(templatePath, 'utf8')
const hydrated = template
  .replace('- iteration_id:', `- iteration_id: ${iterationId}`)
  .replace('- date:', `- date: ${date}`)
  .replace('- branch:', `- branch: ${branch}`)

writeFileSync(snapshotPath, hydrated, 'utf8')

const snapshotRef = `docs/admin-ui-framework/knowledge/iterations/${fileName}`

const ledger = readFileSync(ledgerPath, 'utf8')
const row = `| ${iterationId} | ${month} | TODO | pending | \`${snapshotRef}\` |\n`
if (!ledger.includes(`| ${iterationId} |`)) {
  const updatedLedger = ledger.replace('\n## Rule\n', `\n${row}\n## Rule\n`)
  writeFileSync(ledgerPath, updatedLedger, 'utf8')
}

const index = readFileSync(indexPath, 'utf8')
const updatedIndex = index
  .replace(/- latest_iteration: `.*`/, `- latest_iteration: \`${iterationId}\``)
  .replace(/- latest_snapshot: `.*`/, `- latest_snapshot: \`${snapshotRef}\``)
writeFileSync(indexPath, updatedIndex, 'utf8')

console.log(`Created snapshot: ${snapshotRef}`)
console.log('Updated: L4-iteration-ledger.md, INDEX.md')

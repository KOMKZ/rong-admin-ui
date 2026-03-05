/**
 * Gate: Release Readiness
 *
 * Unified pre-release check: contract + api + changeset
 */
import { execSync } from 'node:child_process'

const root = process.cwd()
const gates = [
  { name: 'contract', cmd: 'node scripts/gate-contract-parity.mjs' },
  { name: 'api', cmd: 'node scripts/gate-api.mjs' },
  { name: 'changeset', cmd: 'node scripts/gate-changeset.mjs' },
]

const failures = []

for (const gate of gates) {
  try {
    const output = execSync(gate.cmd, { cwd: root, stdio: 'pipe', encoding: 'utf-8' })
    console.log(output.trim())
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '')
    console.error(output.trim())
    failures.push(gate.name)
  }
}

if (failures.length > 0) {
  console.error(`\n[gate:release] FAILED - gates failed: ${failures.join(', ')}`)
  process.exit(1)
}

console.log('\n[gate:release] PASS - all release gates passed')

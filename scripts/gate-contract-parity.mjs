import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function read(file) {
  return readFileSync(join(root, file), 'utf8')
}

const componentsIndexPath = 'src/components/index.ts'
const viteConfigPath = 'vite.config.ts'
const rootIndexPath = 'src/index.ts'

assert(existsSync(join(root, componentsIndexPath)), `missing ${componentsIndexPath}`)
assert(existsSync(join(root, viteConfigPath)), `missing ${viteConfigPath}`)
assert(existsSync(join(root, rootIndexPath)), `missing ${rootIndexPath}`)

if (failures.length === 0) {
  const componentsIndex = read(componentsIndexPath)
  const viteConfig = read(viteConfigPath)
  const rootIndex = read(rootIndexPath)

  const exportMatches = [...componentsIndex.matchAll(/export \* from '\.\/(.+)'/g)]
  const exportTargets = exportMatches.map((m) => m[1])

  assert(exportTargets.length > 0, 'src/components/index.ts has no component exports')

  for (const name of exportTargets) {
    const dir = join(root, 'src/components', name)
    assert(existsSync(dir), `component directory missing: src/components/${name}`)
    assert(existsSync(join(dir, 'index.ts')), `component entry missing: src/components/${name}/index.ts`)

    const hasVue = readdirSync(dir).some((f) => f.endsWith('.vue'))
    if (hasVue) {
      assert(existsSync(join(dir, 'types.ts')), `component types missing: src/components/${name}/types.ts`)
    }

    const viteKey = `components/${name}/index`
    assert(viteConfig.includes(`'${viteKey}'`) || viteConfig.includes(`"${viteKey}"`), `vite lib entry missing: ${viteKey}`)
  }

  assert(rootIndex.includes("export * from './components'"), "src/index.ts must export './components'")
  assert(rootIndex.includes("export * from './app-preset'"), "src/index.ts must export './app-preset'")
}

if (failures.length > 0) {
  console.error('[gate:contract] FAILED')
  for (const item of failures) {
    console.error(`- ${item}`)
  }
  process.exit(1)
}

console.log('[gate:contract] PASS')

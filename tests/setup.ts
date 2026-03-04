import { afterEach } from 'vitest'

const ALLOWED_WARN_PATTERNS = [
  /injection .* not found/,
  /provide\(\) can only be used inside setup/,
  /Property .* was accessed during render but is not defined/,
]

const originalWarn = console.warn
const originalError = console.error

afterEach(() => {
  console.warn = originalWarn
  console.error = originalError
})

console.warn = (...args: unknown[]) => {
  const msg = args.map(String).join(' ')
  const isAllowed = ALLOWED_WARN_PATTERNS.some((p) => p.test(msg))
  if (!isAllowed) {
    originalWarn(...args)
    throw new Error(`[test-guard] Unexpected console.warn: ${msg}`)
  }
}

console.error = (...args: unknown[]) => {
  const msg = args.map(String).join(' ')
  originalError(...args)
  throw new Error(`[test-guard] Unexpected console.error: ${msg}`)
}

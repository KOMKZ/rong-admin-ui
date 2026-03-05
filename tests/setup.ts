import { afterEach } from 'vitest'

// BroadcastChannel synchronous mock — always override to ensure deterministic cross-tab tests
{
  const channels = new Map<string, Set<{ _closed: boolean; onmessage: ((event: MessageEvent) => void) | null }>>()

  class BroadcastChannelMock {
    name: string
    onmessage: ((event: MessageEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent) => void) | null = null
    _closed = false

    constructor(name: string) {
      this.name = name
      if (!channels.has(name)) channels.set(name, new Set())
      channels.get(name)!.add(this)
    }

    postMessage(data: unknown): void {
      if (this._closed) return
      const peers = channels.get(this.name)
      if (!peers) return
      for (const peer of peers) {
        if (peer === (this as unknown)) continue
        if (peer._closed) continue
        peer.onmessage?.({ data } as MessageEvent)
      }
    }

    close(): void {
      this._closed = true
      channels.get(this.name)?.delete(this)
    }

    addEventListener(): void { /* noop */ }
    removeEventListener(): void { /* noop */ }
    dispatchEvent(): boolean { return false }
  }

  globalThis.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel
}

// Precisely scoped Naive UI injections that fire in unit tests without NConfigProvider/NForm wrapper.
// Each entry must name a specific injection key — no wildcards.
const ALLOWED_NAIVE_INJECTIONS = [
  'n-config-provider',
  'n-form',
  'n-form-item',
  'n-popover-body',
]

const ALLOWED_WARN_PATTERNS = ALLOWED_NAIVE_INJECTIONS.map(
  (key) => new RegExp(`injection "${key}" not found`),
)

let allowedWarnCount = 0

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
  allowedWarnCount++
}

console.error = (...args: unknown[]) => {
  const msg = args.map(String).join(' ')
  originalError(...args)
  throw new Error(`[test-guard] Unexpected console.error: ${msg}`)
}

// expose count for audit (optional: import from test via globalThis)
;(globalThis as Record<string, unknown>).__allowedWarnCount = () => allowedWarnCount

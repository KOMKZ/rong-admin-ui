import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTokenManager } from '@/app-auth/token-manager'
import type { AuthConfig, TokenStorage } from '@/app-auth/types'

function createMockStorage(): TokenStorage {
  const store = new Map<string, string>()
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => store.set(key, value),
    remove: (key: string) => {
      store.delete(key)
    },
  }
}

describe('cross-tab sync via BroadcastChannel', () => {
  let storageA: TokenStorage
  let storageB: TokenStorage

  beforeEach(() => {
    storageA = createMockStorage()
    storageB = createMockStorage()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should sync logout across tabs', () => {
    const onTokenExpired = vi.fn()

    const configA: AuthConfig = {
      storage: storageA,
      enableCrossTabSync: true,
    }
    const configB: AuthConfig = {
      storage: storageB,
      enableCrossTabSync: true,
      onTokenExpired,
    }

    const managerA = createTokenManager(configA)
    const managerB = createTokenManager(configB)

    managerA.init()
    managerB.init()

    managerA.onLoginSuccess({ accessToken: 'token-a' })
    managerB.onLoginSuccess({ accessToken: 'token-b' })

    managerA.onLogout()

    expect(onTokenExpired).toHaveBeenCalledTimes(1)
    expect(managerB.isAuthenticated()).toBe(false)

    managerA.destroy()
    managerB.destroy()
  })

  it('should sync login across tabs and start auto-refresh on receiver', async () => {
    const refreshApi = {
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'refreshed',
        refreshToken: 'r',
        expiresIn: 3600,
      }),
    }

    const configA: AuthConfig = {
      storage: storageA,
      enableCrossTabSync: true,
    }
    const configB: AuthConfig = {
      storage: storageB,
      enableCrossTabSync: true,
      refreshApi,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
    }

    const managerA = createTokenManager(configA)
    const managerB = createTokenManager(configB)

    managerA.init()
    managerB.init()

    storageB.set('rong_access_token', 'token-b')
    storageB.set('rong_refresh_token', 'refresh-b')
    storageB.set('rong_expires_at', String(Date.now() + 60000))

    managerA.onLoginSuccess({ accessToken: 'token-a' })

    await vi.advanceTimersByTimeAsync(6000)

    expect(refreshApi.refresh).toHaveBeenCalled()

    managerA.destroy()
    managerB.destroy()
  })

  it('should not receive messages after destroy (channel closed)', () => {
    const onTokenExpired = vi.fn()

    const configA: AuthConfig = {
      storage: storageA,
      enableCrossTabSync: true,
    }
    const configB: AuthConfig = {
      storage: storageB,
      enableCrossTabSync: true,
      onTokenExpired,
    }

    const managerA = createTokenManager(configA)
    const managerB = createTokenManager(configB)

    managerA.init()
    managerB.init()

    managerB.onLoginSuccess({ accessToken: 'b-token' })
    managerB.destroy()

    managerA.onLogout()

    expect(onTokenExpired).not.toHaveBeenCalled()

    managerA.destroy()
  })

  it('should handle token_refreshed sync event', async () => {
    const refreshApiA = {
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new-a',
        refreshToken: 'new-r-a',
        expiresIn: 3600,
      }),
    }
    const refreshApiB = {
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new-b',
        refreshToken: 'new-r-b',
        expiresIn: 3600,
      }),
    }

    const configA: AuthConfig = {
      storage: storageA,
      enableCrossTabSync: true,
      refreshApi: refreshApiA,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
    }
    const configB: AuthConfig = {
      storage: storageB,
      enableCrossTabSync: true,
      refreshApi: refreshApiB,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
    }

    const managerA = createTokenManager(configA)
    const managerB = createTokenManager(configB)

    managerA.init()
    managerB.init()

    storageA.set('rong_access_token', 'a-token')
    storageA.set('rong_refresh_token', 'a-refresh')
    storageA.set('rong_expires_at', String(Date.now() + 60000))

    storageB.set('rong_access_token', 'b-token')
    storageB.set('rong_refresh_token', 'b-refresh')
    storageB.set('rong_expires_at', String(Date.now() + 60000))

    managerA.onLoginSuccess({
      accessToken: 'a-token',
      refreshToken: 'a-refresh',
      expiresIn: 300,
    })

    await vi.advanceTimersByTimeAsync(6000)

    expect(refreshApiB.refresh).toHaveBeenCalled()

    managerA.destroy()
    managerB.destroy()
  })
})

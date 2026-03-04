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

describe('createTokenManager', () => {
  let storage: TokenStorage

  beforeEach(() => {
    storage = createMockStorage()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should report not authenticated initially', () => {
    const manager = createTokenManager({ storage })
    expect(manager.isAuthenticated()).toBe(false)
    expect(manager.getToken()).toBeNull()
  })

  it('should store tokens on login success', () => {
    const manager = createTokenManager({ storage })
    manager.onLoginSuccess({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiresIn: 3600,
    })

    expect(manager.isAuthenticated()).toBe(true)
    expect(manager.getToken()).toBe('access-123')
  })

  it('should clear tokens on logout', () => {
    const manager = createTokenManager({ storage })
    manager.onLoginSuccess({ accessToken: 'token' })
    manager.onLogout()

    expect(manager.isAuthenticated()).toBe(false)
    expect(manager.getToken()).toBeNull()
  })

  it('should auto-refresh token when threshold is reached', async () => {
    const refreshApi = {
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      }),
    }

    const config: AuthConfig = {
      storage,
      refreshApi,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
    }

    const manager = createTokenManager(config)
    manager.onLoginSuccess({
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresIn: 300,
    })

    await vi.advanceTimersByTimeAsync(6000)

    expect(refreshApi.refresh).toHaveBeenCalledWith('old-refresh')
    manager.destroy()
  })

  it('should call onRefreshFailed when refresh fails', async () => {
    const onRefreshFailed = vi.fn()
    const refreshApi = {
      refresh: vi.fn().mockRejectedValue(new Error('refresh failed')),
    }

    const config: AuthConfig = {
      storage,
      refreshApi,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
      onRefreshFailed,
    }

    const manager = createTokenManager(config)
    manager.onLoginSuccess({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 300,
    })

    await vi.advanceTimersByTimeAsync(6000)

    expect(onRefreshFailed).toHaveBeenCalled()
    manager.destroy()
  })

  it('should be idempotent: repeated onLoginSuccess should not stack timers', async () => {
    const refreshApi = {
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new',
        refreshToken: 'new-r',
        expiresIn: 3600,
      }),
    }

    const config: AuthConfig = {
      storage,
      refreshApi,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
    }

    const manager = createTokenManager(config)
    manager.onLoginSuccess({ accessToken: 'a1', refreshToken: 'r1', expiresIn: 300 })
    manager.onLoginSuccess({ accessToken: 'a2', refreshToken: 'r2', expiresIn: 300 })
    manager.onLoginSuccess({ accessToken: 'a3', refreshToken: 'r3', expiresIn: 300 })

    await vi.advanceTimersByTimeAsync(6000)

    expect(refreshApi.refresh).toHaveBeenCalledTimes(1)
    manager.destroy()
  })

  it('should be idempotent: repeated init should not stack timers', async () => {
    const refreshApi = {
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'new',
        refreshToken: 'new-r',
        expiresIn: 3600,
      }),
    }

    const config: AuthConfig = {
      storage,
      refreshApi,
      refreshThresholdMs: 10 * 60 * 1000,
      refreshIntervalMs: 5000,
    }

    storage.set('rong_access_token', 'token')
    storage.set('rong_refresh_token', 'refresh')
    storage.set('rong_expires_at', String(Date.now() + 60000))

    const manager = createTokenManager(config)
    manager.init()
    manager.init()
    manager.init()

    await vi.advanceTimersByTimeAsync(6000)

    expect(refreshApi.refresh).toHaveBeenCalledTimes(1)
    manager.destroy()
  })

  it('should clean up on destroy and allow re-init', () => {
    const config: AuthConfig = {
      storage,
      refreshApi: {
        refresh: vi.fn().mockResolvedValue({ accessToken: 'x', expiresIn: 3600 }),
      },
      refreshIntervalMs: 5000,
    }

    const manager = createTokenManager(config)
    manager.onLoginSuccess({ accessToken: 'token', refreshToken: 'r', expiresIn: 300 })
    manager.destroy()

    // destroy stops timers but does not clear storage
    // logout explicitly clears storage
    manager.onLogout()
    expect(manager.isAuthenticated()).toBe(false)

    storage.set('rong_access_token', 'new-token')
    manager.init()
    expect(manager.isAuthenticated()).toBe(true)
    manager.destroy()
  })
})

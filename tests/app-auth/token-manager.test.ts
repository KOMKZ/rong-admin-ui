import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTokenManager } from '@/app-auth/token-manager'
import type { AuthConfig, TokenStorage } from '@/app-auth/types'

function createMockStorage(): TokenStorage {
  const store = new Map<string, string>()
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => store.set(key, value),
    remove: (key: string) => store.delete(key),
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
})

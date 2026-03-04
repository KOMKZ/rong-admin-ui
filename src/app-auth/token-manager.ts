import type {
  AuthConfig,
  AuthState,
  AuthStorageKeys,
  TokenManagerInstance,
  TokenPair,
} from './types'

const DEFAULT_STORAGE_KEYS: AuthStorageKeys = {
  accessToken: 'rong_access_token',
  refreshToken: 'rong_refresh_token',
  expiresAt: 'rong_expires_at',
}

const DEFAULT_REFRESH_THRESHOLD_MS = 5 * 60 * 1000
const DEFAULT_REFRESH_INTERVAL_MS = 60 * 1000
const CROSS_TAB_CHANNEL = 'rong_auth_sync'

type SyncAction = 'logout' | 'login' | 'token_refreshed'

export function createTokenManager(config: AuthConfig): TokenManagerInstance {
  const keys = { ...DEFAULT_STORAGE_KEYS, ...config.storageKeys }
  const storage = config.storage

  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let broadcastChannel: BroadcastChannel | null = null
  let isRefreshing = false
  let initialized = false

  function getState(): AuthState {
    const token = storage.get(keys.accessToken)
    const expiresAtStr = storage.get(keys.expiresAt)
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null

    return {
      isAuthenticated: !!token,
      isRefreshing,
      accessToken: token,
      expiresAt,
    }
  }

  function getToken(): string | null {
    return storage.get(keys.accessToken)
  }

  function isAuthenticated(): boolean {
    return !!getToken()
  }

  function saveTokenPair(pair: TokenPair): void {
    storage.set(keys.accessToken, pair.accessToken)
    if (pair.refreshToken) {
      storage.set(keys.refreshToken, pair.refreshToken)
    }
    if (pair.expiresIn) {
      const expiresAt = Date.now() + pair.expiresIn * 1000
      storage.set(keys.expiresAt, String(expiresAt))
    }
  }

  function clearTokens(): void {
    storage.remove(keys.accessToken)
    storage.remove(keys.refreshToken)
    storage.remove(keys.expiresAt)
  }

  function shouldRefresh(): boolean {
    const state = getState()
    if (!state.accessToken || !state.expiresAt) return false
    const threshold = config.refreshThresholdMs ?? DEFAULT_REFRESH_THRESHOLD_MS
    return state.expiresAt - Date.now() < threshold
  }

  async function attemptRefresh(): Promise<void> {
    if (isRefreshing || !config.refreshApi) return

    const refreshToken = storage.get(keys.refreshToken)
    if (!refreshToken) return

    if (!shouldRefresh()) return

    isRefreshing = true
    try {
      const newPair = await config.refreshApi.refresh(refreshToken)
      saveTokenPair(newPair)
      broadcastSync('token_refreshed')
    } catch (err) {
      config.onRefreshFailed?.(err instanceof Error ? err : new Error(String(err)))
    } finally {
      isRefreshing = false
    }
  }

  function startAutoRefresh(): void {
    stopAutoRefresh()
    const interval = config.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS
    refreshTimer = setInterval(() => {
      void attemptRefresh()
    }, interval)
  }

  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  function broadcastSync(action: SyncAction): void {
    broadcastChannel?.postMessage({ action })
  }

  function handleSyncMessage(action: SyncAction): void {
    switch (action) {
      case 'logout':
        clearTokens()
        stopAutoRefresh()
        config.onTokenExpired?.()
        break
      case 'login':
      case 'token_refreshed':
        if (config.refreshApi && !refreshTimer) {
          startAutoRefresh()
        }
        break
    }
  }

  function setupCrossTabSync(): void {
    if (!config.enableCrossTabSync || typeof BroadcastChannel === 'undefined') return

    teardownCrossTabSync()
    broadcastChannel = new BroadcastChannel(CROSS_TAB_CHANNEL)
    broadcastChannel.onmessage = (event: MessageEvent<{ action: SyncAction }>) => {
      handleSyncMessage(event.data.action)
    }
  }

  function teardownCrossTabSync(): void {
    if (broadcastChannel) {
      broadcastChannel.close()
      broadcastChannel = null
    }
  }

  function init(): void {
    if (initialized) return
    initialized = true

    if (isAuthenticated() && config.refreshApi) {
      startAutoRefresh()
    }
    setupCrossTabSync()
  }

  function destroy(): void {
    stopAutoRefresh()
    teardownCrossTabSync()
    initialized = false
  }

  function onLoginSuccess(tokenPair: TokenPair): void {
    saveTokenPair(tokenPair)
    if (config.refreshApi) {
      startAutoRefresh()
    }
    broadcastSync('login')
  }

  function onLogout(): void {
    clearTokens()
    stopAutoRefresh()
    broadcastSync('logout')
  }

  return {
    init,
    destroy,
    getToken,
    isAuthenticated,
    onLoginSuccess,
    onLogout,
  }
}

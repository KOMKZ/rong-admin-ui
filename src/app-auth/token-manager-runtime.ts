import type { AuthConfig, AuthState, AuthStorageKeys, TokenManagerInstance, TokenPair } from './types'

export const DEFAULT_STORAGE_KEYS: AuthStorageKeys = {
  accessToken: 'rong_access_token',
  refreshToken: 'rong_refresh_token',
  expiresAt: 'rong_expires_at',
  refreshAt: 'rong_refresh_at',
}

const DEFAULT_REFRESH_THRESHOLD_MS = 5 * 60 * 1000
const DEFAULT_REFRESH_INTERVAL_MS = 60 * 1000
const CROSS_TAB_CHANNEL = 'rong_auth_sync'

type SyncAction = 'logout' | 'login' | 'token_refreshed'

export class TokenManagerRuntime implements TokenManagerInstance {
  private readonly config: AuthConfig
  private readonly keys: AuthStorageKeys
  private refreshTimer: ReturnType<typeof setInterval> | null = null
  private broadcastChannel: BroadcastChannel | null = null
  private isRefreshing = false
  private initialized = false
  private refreshPromise: Promise<boolean> | null = null

  constructor(config: AuthConfig) {
    this.config = config
    this.keys = { ...DEFAULT_STORAGE_KEYS, ...config.storageKeys }
  }

  init(): void {
    if (this.initialized) return
    this.initialized = true

    if (this.isAuthenticated() && this.config.refreshApi) {
      this.startAutoRefresh()
    }
    this.setupCrossTabSync()
  }

  destroy(): void {
    this.stopAutoRefresh()
    this.teardownCrossTabSync()
    this.initialized = false
  }

  getToken(): string | null {
    return this.config.storage.get(this.keys.accessToken)
  }

  getRefreshToken(): string | null {
    return this.config.storage.get(this.keys.refreshToken)
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false
    const expiresAtStr = this.config.storage.get(this.keys.expiresAt)
    if (!expiresAtStr) return true

    const expiresAt = parseInt(expiresAtStr, 10)
    return isNaN(expiresAt) || Date.now() < expiresAt
  }

  async refreshNow(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise
    if (!this.config.refreshApi) return false

    const refreshToken = this.config.storage.get(this.keys.refreshToken)
    if (!refreshToken) return false

    this.refreshPromise = this.executeRefresh(refreshToken)
    return this.refreshPromise
  }

  onLoginSuccess(tokenPair: TokenPair): void {
    this.saveTokenPair(tokenPair)
    if (this.config.refreshApi) {
      this.startAutoRefresh()
    }
    this.broadcastSync('login')
  }

  onLogout(): void {
    this.clearTokens()
    this.stopAutoRefresh()
    this.broadcastSync('logout')
  }

  private getState(): AuthState {
    const token = this.config.storage.get(this.keys.accessToken)
    const expiresAtStr = this.config.storage.get(this.keys.expiresAt)
    const refreshAtStr = this.config.storage.get(this.keys.refreshAt)

    return {
      isAuthenticated: !!token,
      isRefreshing: this.isRefreshing,
      accessToken: token,
      expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
      refreshAt: refreshAtStr ? parseInt(refreshAtStr, 10) : null,
    }
  }

  private saveTokenPair(pair: TokenPair): void {
    this.config.storage.set(this.keys.accessToken, pair.accessToken)
    if (pair.refreshToken) {
      this.config.storage.set(this.keys.refreshToken, pair.refreshToken)
    }
    if (pair.expiresIn) {
      this.config.storage.set(this.keys.expiresAt, String(Date.now() + pair.expiresIn * 1000))
    }
    if (pair.refreshAfterSeconds) {
      this.config.storage.set(
        this.keys.refreshAt,
        String(Date.now() + pair.refreshAfterSeconds * 1000),
      )
    } else {
      this.config.storage.remove(this.keys.refreshAt)
    }
  }

  private clearTokens(): void {
    this.config.storage.remove(this.keys.accessToken)
    this.config.storage.remove(this.keys.refreshToken)
    this.config.storage.remove(this.keys.expiresAt)
    this.config.storage.remove(this.keys.refreshAt)
  }

  private shouldRefresh(): boolean {
    const state = this.getState()
    if (!state.accessToken || !state.expiresAt) return false
    if (state.refreshAt && Date.now() >= state.refreshAt) return true
    const threshold = this.config.refreshThresholdMs ?? DEFAULT_REFRESH_THRESHOLD_MS
    return state.expiresAt - Date.now() < threshold
  }

  private async executeRefresh(refreshToken: string): Promise<boolean> {
    this.isRefreshing = true
    try {
      const newPair = await this.config.refreshApi!.refresh(refreshToken)
      this.saveTokenPair(newPair)
      this.broadcastSync('token_refreshed')
      return true
    } catch (err) {
      this.clearTokens()
      this.stopAutoRefresh()
      this.broadcastSync('logout')
      this.config.onRefreshFailed?.(err instanceof Error ? err : new Error(String(err)))
      return false
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async attemptRefresh(): Promise<void> {
    if (!this.shouldRefresh()) return
    await this.refreshNow()
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh()
    const interval = this.config.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS
    this.refreshTimer = setInterval(() => {
      void this.attemptRefresh()
    }, interval)
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private broadcastSync(action: SyncAction): void {
    this.broadcastChannel?.postMessage({ action })
  }

  private handleSyncMessage(action: SyncAction): void {
    switch (action) {
      case 'logout':
        this.clearTokens()
        this.stopAutoRefresh()
        this.config.onTokenExpired?.()
        break
      case 'login':
      case 'token_refreshed':
        if (this.config.refreshApi && !this.refreshTimer) {
          this.startAutoRefresh()
        }
        break
    }
  }

  private setupCrossTabSync(): void {
    if (!this.config.enableCrossTabSync || typeof BroadcastChannel === 'undefined') return

    this.teardownCrossTabSync()
    this.broadcastChannel = new BroadcastChannel(CROSS_TAB_CHANNEL)
    this.broadcastChannel.onmessage = (event: MessageEvent<{ action: SyncAction }>) => {
      this.handleSyncMessage(event.data.action)
    }
  }

  private teardownCrossTabSync(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
  }
}

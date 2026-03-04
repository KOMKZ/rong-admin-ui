export interface TokenPair {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
}

export interface TokenStorage {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
  remove: (key: string) => void
}

export interface TokenRefreshApi {
  refresh: (refreshToken: string) => Promise<TokenPair>
}

export interface AuthConfig {
  storage: TokenStorage
  storageKeys?: AuthStorageKeys
  refreshApi?: TokenRefreshApi
  refreshThresholdMs?: number
  refreshIntervalMs?: number
  enableCrossTabSync?: boolean
  onTokenExpired?: () => void
  onRefreshFailed?: (error: Error) => void
}

export interface AuthStorageKeys {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  isRefreshing: boolean
  accessToken: string | null
  expiresAt: number | null
}

export interface TokenManagerInstance {
  init: () => void
  destroy: () => void
  getToken: () => string | null
  isAuthenticated: () => boolean
  onLoginSuccess: (tokenPair: TokenPair) => void
  onLogout: () => void
}

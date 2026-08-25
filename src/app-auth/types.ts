export interface TokenPair {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  refreshAfterSeconds?: number
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
  storageKeys?: Partial<AuthStorageKeys>
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
  refreshAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  isRefreshing: boolean
  accessToken: string | null
  expiresAt: number | null
  refreshAt: number | null
}

export interface TokenManagerInstance {
  init: () => void
  destroy: () => void
  getToken: () => string | null
  getRefreshToken: () => string | null
  isAuthenticated: () => boolean
  refreshNow: () => Promise<boolean>
  onLoginSuccess: (tokenPair: TokenPair) => void
  onLogout: () => void
}

import type { AuthConfig, TokenManagerInstance } from './types'
import { TokenManagerRuntime } from './token-manager-runtime'

export function createTokenManager(config: AuthConfig): TokenManagerInstance {
  return new TokenManagerRuntime(config)
}

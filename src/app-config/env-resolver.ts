import type { RuntimeConfig, AppEnv } from './types'

const ENV_PREFIX = 'VITE_RA_'

interface EnvRecord {
  [key: string]: string | undefined
}

/**
 * Resolve VITE_RA_* environment variables into a partial RuntimeConfig.
 * Mapping:
 *   VITE_RA_API_BASE_URL → apiBaseURL
 *   VITE_RA_UPLOAD_URL   → uploadURL
 *   VITE_RA_WS_URL       → wsURL
 *   VITE_RA_ENV           → env
 *   VITE_RA_DEBUG         → debug
 */
export function resolveEnvConfig(env?: EnvRecord): Partial<RuntimeConfig> {
  const source: EnvRecord =
    env ??
    (typeof import.meta !== 'undefined' ? ((import.meta as { env?: EnvRecord }).env ?? {}) : {})
  const result: Partial<RuntimeConfig> = {}

  const apiBaseURL = source[`${ENV_PREFIX}API_BASE_URL`]
  if (apiBaseURL) result.apiBaseURL = apiBaseURL

  const uploadURL = source[`${ENV_PREFIX}UPLOAD_URL`]
  if (uploadURL) result.uploadURL = uploadURL

  const wsURL = source[`${ENV_PREFIX}WS_URL`]
  if (wsURL) result.wsURL = wsURL

  const appEnv = source[`${ENV_PREFIX}ENV`]
  if (appEnv && ['development', 'staging', 'production'].includes(appEnv)) {
    result.env = appEnv as AppEnv
  }

  const debug = source[`${ENV_PREFIX}DEBUG`]
  if (debug !== undefined) {
    result.debug = debug === 'true' || debug === '1'
  }

  return result
}

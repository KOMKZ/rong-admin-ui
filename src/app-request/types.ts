export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestErrorKind = 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELLED'

export interface RequestConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
  withCredentials?: boolean
}

export interface RequestOptions {
  url: string
  method?: HttpMethod
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
  skipAuthRefresh?: boolean
  authRetry?: boolean
  skipCSRF?: boolean
  csrfRetry?: boolean
  humanVerifyScene?: string
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp?: number
}

export interface RequestInterceptor {
  onRequest?: (options: RequestOptions) => RequestOptions | Promise<RequestOptions>
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>
  onError?: (error: RequestError) => void | Promise<void>
}

export interface RequestError {
  kind: RequestErrorKind
  code: string | number
  message: string
  status?: number
  /** Parsed JSON body from non-ok HTTP responses (best-effort) */
  responseBody?: unknown
  originalError?: Error
}

export type ErrorStrategy = 'toast' | 'throw' | 'silent' | 'custom'

export interface ErrorStrategyConfig {
  default: ErrorStrategy
  codeMapping?: Record<number, ErrorStrategy>
  onCustom?: (error: RequestError) => void
}

export interface TokenProvider {
  getToken: () => string | null
  getTokenType?: () => string
  refreshToken?: () => Promise<boolean>
}

export interface CSRFProvider {
  headerName?: string
  getToken: () => Promise<string | null>
  refreshToken?: () => Promise<string | null>
}

export interface HttpClient {
  request: <T = unknown>(options: RequestOptions) => Promise<ApiResponse<T>>
  get: <T = unknown>(url: string, params?: Record<string, unknown>) => Promise<ApiResponse<T>>
  post: <T = unknown>(
    url: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'url' | 'method' | 'data'>,
  ) => Promise<ApiResponse<T>>
  put: <T = unknown>(url: string, data?: unknown) => Promise<ApiResponse<T>>
  patch: <T = unknown>(url: string, data?: unknown) => Promise<ApiResponse<T>>
  delete: <T = unknown>(url: string, params?: Record<string, unknown>) => Promise<ApiResponse<T>>
}

export interface HttpClientConfig {
  requestConfig: RequestConfig
  tokenProvider?: TokenProvider
  csrfProvider?: CSRFProvider
  interceptors?: RequestInterceptor[]
  errorStrategy?: ErrorStrategyConfig
}

import type {
  ApiResponse,
  ErrorStrategy,
  HttpClient,
  HttpClientConfig,
  RequestError,
  RequestErrorKind,
  RequestOptions,
} from './types'

function buildUrl(baseURL: string, url: string, params?: Record<string, unknown>): string {
  const fullUrl = url.startsWith('http')
    ? url
    : `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`

  if (!params || Object.keys(params).length === 0) return fullUrl

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }
  const queryString = searchParams.toString()
  return queryString ? `${fullUrl}?${queryString}` : fullUrl
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

function buildHeaders(config: HttpClientConfig, options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    ...config.requestConfig.headers,
    ...options.headers,
  }

  if (!isFormData(options.data) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (config.tokenProvider) {
    const token = config.tokenProvider.getToken()
    if (token) {
      const tokenType = config.tokenProvider.getTokenType?.() ?? 'Bearer'
      headers['Authorization'] = `${tokenType} ${token}`
    }
  }

  return headers
}

async function applyRequestInterceptors(
  config: HttpClientConfig,
  options: RequestOptions,
): Promise<RequestOptions> {
  let result = options
  if (config.interceptors) {
    for (const interceptor of config.interceptors) {
      if (interceptor.onRequest) {
        result = await interceptor.onRequest(result)
      }
    }
  }
  return result
}

async function applyResponseInterceptors<T>(
  config: HttpClientConfig,
  response: ApiResponse<T>,
): Promise<ApiResponse<T>> {
  let result = response
  if (config.interceptors) {
    for (const interceptor of config.interceptors) {
      if (interceptor.onResponse) {
        result = await interceptor.onResponse(result)
      }
    }
  }
  return result
}

async function handleError(config: HttpClientConfig, error: RequestError): Promise<never> {
  if (config.interceptors) {
    for (const interceptor of config.interceptors) {
      if (interceptor.onError) {
        await interceptor.onError(error)
      }
    }
  }
  applyErrorStrategy(config, error)
  throw error
}

function mergeSignals(timeoutSignal: AbortSignal, externalSignal?: AbortSignal): AbortSignal {
  if (!externalSignal) return timeoutSignal
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([timeoutSignal, externalSignal])
  }
  const controller = new AbortController()
  const onAbort = (): void => controller.abort()
  timeoutSignal.addEventListener('abort', onAbort, { once: true })
  externalSignal.addEventListener('abort', onAbort, { once: true })
  return controller.signal
}

function classifyAbortError(
  timeoutController: AbortController,
  externalSignal?: AbortSignal,
): RequestErrorKind {
  if (timeoutController.signal.aborted) return 'TIMEOUT'
  if (externalSignal?.aborted) return 'CANCELLED'
  return 'CANCELLED'
}

function getHeader(response: Response, name: string): string {
  return response.headers?.get?.(name) ?? ''
}

function hasEmptyBody(response: Response): boolean {
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return true
  }
  return getHeader(response, 'content-length') === '0'
}

function buildFallbackResponse<T>(response: Response, data?: unknown): ApiResponse<T> {
  return {
    code: response.status,
    message: response.statusText || 'OK',
    data: (data as T) ?? (undefined as T),
  }
}

async function parseErrorBody(response: Response): Promise<unknown> {
  const contentType = getHeader(response, 'content-type')

  if (!contentType || contentType.includes('json')) {
    try {
      return await response.json()
    } catch {
      /* fallback to text */
    }
  }

  if (typeof response.text === 'function') {
    try {
      const text = await response.text()
      return text || undefined
    } catch {
      /* ignore text parse errors */
    }
  }

  return undefined
}

async function parseSuccessBody<T>(response: Response): Promise<ApiResponse<T>> {
  if (hasEmptyBody(response)) {
    return buildFallbackResponse<T>(response)
  }

  const contentType = getHeader(response, 'content-type')
  const shouldTryJson = !contentType || contentType.includes('json')

  if (shouldTryJson) {
    try {
      return (await response.json()) as ApiResponse<T>
    } catch {
      /* fallback to text */
    }
  }

  if (typeof response.text === 'function') {
    const text = await response.text()
    if (!text.trim()) {
      return buildFallbackResponse<T>(response)
    }
    try {
      return JSON.parse(text) as ApiResponse<T>
    } catch {
      return buildFallbackResponse<T>(response, text)
    }
  }

  return buildFallbackResponse<T>(response)
}

function resolveErrorStrategy(config: HttpClientConfig, error: RequestError): ErrorStrategy {
  if (!config.errorStrategy) return 'throw'
  if (typeof error.code === 'number' && config.errorStrategy.codeMapping?.[error.code]) {
    return config.errorStrategy.codeMapping[error.code]
  }
  return config.errorStrategy.default
}

function applyErrorStrategy(config: HttpClientConfig, error: RequestError): void {
  const strategy = resolveErrorStrategy(config, error)

  if (strategy === 'toast') {
    console.error(`[app-request] ${error.message}`, error)
    return
  }

  if (strategy === 'custom') {
    config.errorStrategy?.onCustom?.(error)
  }
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  async function request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
    const processedOptions = await applyRequestInterceptors(config, options)
    const method = processedOptions.method ?? 'GET'
    const url = buildUrl(
      config.requestConfig.baseURL,
      processedOptions.url,
      processedOptions.params,
    )
    const headers = buildHeaders(config, processedOptions)

    const timeoutController = new AbortController()
    const timeout = processedOptions.timeout ?? config.requestConfig.timeout ?? 30000
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

    const signal = mergeSignals(timeoutController.signal, processedOptions.signal)

    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: config.requestConfig.withCredentials ? 'include' : 'same-origin',
      signal,
    }

    if (processedOptions.data && method !== 'GET') {
      fetchOptions.body = isFormData(processedOptions.data)
        ? processedOptions.data
        : JSON.stringify(processedOptions.data)
    }

    try {
      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const responseBody = await parseErrorBody(response)
        const error: RequestError = {
          kind: 'HTTP_ERROR',
          code: response.status,
          message: response.statusText,
          status: response.status,
          responseBody,
        }
        return handleError(config, error)
      }

      const parsedResponse = await parseSuccessBody<T>(response)
      return applyResponseInterceptors(config, parsedResponse)
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof DOMException && err.name === 'AbortError') {
        const kind = classifyAbortError(timeoutController, processedOptions.signal)
        const error: RequestError = {
          kind,
          code: kind,
          message:
            kind === 'TIMEOUT' ? `Request timed out after ${timeout}ms` : 'Request cancelled',
          originalError: err,
        }
        return handleError(config, error)
      }

      const error: RequestError = {
        kind: 'NETWORK_ERROR',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
        originalError: err instanceof Error ? err : undefined,
      }
      return handleError(config, error)
    }
  }

  return {
    request,
    get: <T = unknown>(url: string, params?: Record<string, unknown>) =>
      request<T>({ url, method: 'GET', params }),
    post: <T = unknown>(url: string, data?: unknown) => request<T>({ url, method: 'POST', data }),
    put: <T = unknown>(url: string, data?: unknown) => request<T>({ url, method: 'PUT', data }),
    patch: <T = unknown>(url: string, data?: unknown) => request<T>({ url, method: 'PATCH', data }),
    delete: <T = unknown>(url: string, params?: Record<string, unknown>) =>
      request<T>({ url, method: 'DELETE', params }),
  }
}

import type {
  ApiResponse,
  HttpClient,
  HttpClientConfig,
  RequestError,
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
  return `${fullUrl}?${searchParams.toString()}`
}

function buildHeaders(config: HttpClientConfig, options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.requestConfig.headers,
    ...options.headers,
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
  throw error
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

    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: config.requestConfig.withCredentials ? 'include' : 'same-origin',
      signal: processedOptions.signal,
    }

    if (processedOptions.data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(processedOptions.data)
    }

    const controller = new AbortController()
    const timeout = processedOptions.timeout ?? config.requestConfig.timeout ?? 30000
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    if (!fetchOptions.signal) {
      fetchOptions.signal = controller.signal
    }

    try {
      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const error: RequestError = {
          code: response.status,
          message: response.statusText,
          status: response.status,
        }
        return handleError(config, error)
      }

      const json = (await response.json()) as ApiResponse<T>
      return applyResponseInterceptors(config, json)
    } catch (err) {
      clearTimeout(timeoutId)
      const error: RequestError = {
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

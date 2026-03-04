import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createHttpClient } from '@/app-request/http-client'
import type { HttpClientConfig, ApiResponse } from '@/app-request/types'

describe('createHttpClient', () => {
  const mockResponse: ApiResponse<{ id: number }> = {
    code: 200,
    message: 'ok',
    data: { id: 1 },
  }

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should make GET requests', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    const result = await client.get<{ id: number }>('/users')

    expect(result.code).toBe(200)
    expect(result.data.id).toBe(1)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/users',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('should inject authorization header', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
      tokenProvider: {
        getToken: () => 'test-token',
        getTokenType: () => 'Bearer',
      },
    }
    const client = createHttpClient(config)
    await client.get('/users')

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })

  it('should handle POST with body', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    await client.post('/users', { name: 'test' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    )
  })

  it('should call error interceptor on network error with kind=NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failed')))

    const onError = vi.fn()
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
      interceptors: [{ onError }],
    }
    const client = createHttpClient(config)

    await expect(client.get('/users')).rejects.toMatchObject({
      kind: 'NETWORK_ERROR',
      code: 'NETWORK_ERROR',
      message: 'Network failed',
    })
    expect(onError).toHaveBeenCalled()
  })

  it('should return HTTP_ERROR with status for 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }),
    )

    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)

    await expect(client.get('/secure')).rejects.toMatchObject({
      kind: 'HTTP_ERROR',
      code: 401,
      status: 401,
      message: 'Unauthorized',
    })
  })

  it('should return HTTP_ERROR with status for 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' }),
    )

    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)

    await expect(client.get('/admin')).rejects.toMatchObject({
      kind: 'HTTP_ERROR',
      code: 403,
      status: 403,
    })
  })

  it('should return HTTP_ERROR with status for 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)

    await expect(client.get('/crash')).rejects.toMatchObject({
      kind: 'HTTP_ERROR',
      code: 500,
      status: 500,
    })
  })

  it('should return TIMEOUT error when request times out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        return new Promise((_resolve, reject) => {
          opts.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
      }),
    )

    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com', timeout: 50 },
    }
    const client = createHttpClient(config)

    await expect(client.get('/slow')).rejects.toMatchObject({
      kind: 'TIMEOUT',
      code: 'TIMEOUT',
    })
  })

  it('should return CANCELLED error when external signal aborts', async () => {
    const controller = new AbortController()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        return new Promise((_resolve, reject) => {
          if (opts.signal?.aborted) {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
            return
          }
          opts.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
      }),
    )

    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)

    // Abort before the request resolves
    setTimeout(() => controller.abort(), 10)

    await expect(
      client.request({ url: '/data', signal: controller.signal }),
    ).rejects.toMatchObject({
      kind: 'CANCELLED',
      code: 'CANCELLED',
    })
  })

  it('should support PUT, PATCH, DELETE methods', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)

    await client.put('/users/1', { name: 'updated' })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/users/1',
      expect.objectContaining({ method: 'PUT' }),
    )

    await client.patch('/users/1', { name: 'patched' })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/users/1',
      expect.objectContaining({ method: 'PATCH' }),
    )

    await client.delete('/users/1')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/users/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('should apply request and response interceptors', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
      interceptors: [
        {
          onRequest: (opts) => ({ ...opts, headers: { ...opts.headers, 'X-Custom': 'yes' } }),
          onResponse: (res) => ({ ...res, data: { ...res.data, intercepted: true } }),
        },
      ],
    }
    const client = createHttpClient(config)
    const result = await client.get('/test')

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Custom': 'yes' }),
      }),
    )
    expect((result.data as Record<string, unknown>).intercepted).toBe(true)
  })

  it('should append query params for GET', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    await client.get('/search', { q: 'test', page: 1 })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/search?q=test&page=1',
      expect.anything(),
    )
  })

  it('should handle absolute URLs', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    await client.get('https://other.com/data')

    expect(fetch).toHaveBeenCalledWith('https://other.com/data', expect.anything())
  })
})

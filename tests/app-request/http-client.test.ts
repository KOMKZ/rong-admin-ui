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

  it('should refresh token and retry once on 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized' })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ code: 200, message: 'ok', data: { id: 2 } }),
      })
    vi.stubGlobal('fetch', fetchMock)

    let token = 'old-token'
    const refreshToken = vi.fn().mockImplementation(async () => {
      token = 'new-token'
      return true
    })
    const client = createHttpClient({
      requestConfig: { baseURL: 'https://api.test.com' },
      tokenProvider: {
        getToken: () => token,
        refreshToken,
      },
    })

    const result = await client.get<{ id: number }>('/secure')

    expect(result.data.id).toBe(2)
    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer old-token')
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer new-token')
  })

  it('should share refresh promise across concurrent 401 retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized' })
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized' })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 200, message: 'ok', data: { id: 3 } }),
      })
    vi.stubGlobal('fetch', fetchMock)

    let token = 'old-token'
    const refreshToken = vi.fn().mockImplementation(() => {
      return Promise.resolve().then(() => {
        token = 'new-token'
        return true
      })
    })
    const client = createHttpClient({
      requestConfig: { baseURL: 'https://api.test.com' },
      tokenProvider: {
        getToken: () => token,
        refreshToken,
      },
    })

    await Promise.all([client.get('/secure-a'), client.get('/secure-b')])

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-token')
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer new-token')
  })

  it('should not retry 401 when auth refresh is skipped', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }),
    )

    const refreshToken = vi.fn().mockResolvedValue(true)
    const client = createHttpClient({
      requestConfig: { baseURL: 'https://api.test.com' },
      tokenProvider: {
        getToken: () => 'token',
        refreshToken,
      },
    })

    await expect(client.request({ url: '/secure', skipAuthRefresh: true })).rejects.toMatchObject({
      status: 401,
    })
    expect(refreshToken).not.toHaveBeenCalled()
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

    await expect(client.request({ url: '/data', signal: controller.signal })).rejects.toMatchObject(
      {
        kind: 'CANCELLED',
        code: 'CANCELLED',
      },
    )
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

  it('should not append trailing ? when query params are empty', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    await client.get('/search', { q: undefined, page: null })

    expect(fetch).toHaveBeenCalledWith('https://api.test.com/search', expect.anything())
  })

  it('should handle 204 success response without parsing JSON', async () => {
    const jsonSpy = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, statusText: 'No Content', json: jsonSpy }),
    )

    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    const result = await client.get('/empty')

    expect(result.code).toBe(204)
    expect(result.data).toBeUndefined()
    expect(jsonSpy).not.toHaveBeenCalled()
  })

  it('should execute custom error strategy callback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' }),
    )

    const onCustom = vi.fn()
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
      errorStrategy: {
        default: 'custom',
        onCustom,
      },
    }
    const client = createHttpClient(config)

    await expect(client.get('/health')).rejects.toMatchObject({
      kind: 'HTTP_ERROR',
      status: 503,
    })
    expect(onCustom).toHaveBeenCalled()
  })

  it('should handle absolute URLs', async () => {
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
    }
    const client = createHttpClient(config)
    await client.get('https://other.com/data')

    expect(fetch).toHaveBeenCalledWith('https://other.com/data', expect.anything())
  })

  describe('FormData support', () => {
    it('should send FormData body without JSON.stringify', async () => {
      const config: HttpClientConfig = {
        requestConfig: { baseURL: 'https://api.test.com' },
      }
      const client = createHttpClient(config)
      const formData = new FormData()
      formData.append('file', new Blob(['content'], { type: 'image/jpeg' }), 'photo.jpg')
      formData.append('type', 'avatar')

      await client.request({
        url: '/files/upload',
        method: 'POST',
        data: formData,
      })

      const [, fetchOpts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchOpts.body).toBe(formData)
      expect(fetchOpts.body).toBeInstanceOf(FormData)
    })

    it('should NOT set Content-Type header for FormData (let browser set boundary)', async () => {
      const config: HttpClientConfig = {
        requestConfig: { baseURL: 'https://api.test.com' },
      }
      const client = createHttpClient(config)
      const formData = new FormData()
      formData.append('file', new Blob(['x']), 'test.txt')

      await client.request({
        url: '/upload',
        method: 'POST',
        data: formData,
      })

      const [, fetchOpts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchOpts.headers['Content-Type']).toBeUndefined()
    })

    it('should still set Content-Type: application/json for plain object POST', async () => {
      const config: HttpClientConfig = {
        requestConfig: { baseURL: 'https://api.test.com' },
      }
      const client = createHttpClient(config)
      await client.post('/users', { name: 'Alice' })

      const [, fetchOpts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchOpts.headers['Content-Type']).toBe('application/json')
      expect(fetchOpts.body).toBe(JSON.stringify({ name: 'Alice' }))
    })

    it('should inject auth header with FormData', async () => {
      const config: HttpClientConfig = {
        requestConfig: { baseURL: 'https://api.test.com' },
        tokenProvider: { getToken: () => 'my-token' },
      }
      const client = createHttpClient(config)
      const formData = new FormData()
      formData.append('file', new Blob(['data']), 'file.png')

      await client.request({
        url: '/upload',
        method: 'POST',
        data: formData,
      })

      const [, fetchOpts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(fetchOpts.headers['Authorization']).toBe('Bearer my-token')
      expect(fetchOpts.headers['Content-Type']).toBeUndefined()
    })
  })
})

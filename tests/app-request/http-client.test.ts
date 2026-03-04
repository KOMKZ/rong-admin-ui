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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))
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

  it('should call error interceptor on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failed')))

    const onError = vi.fn()
    const config: HttpClientConfig = {
      requestConfig: { baseURL: 'https://api.test.com' },
      interceptors: [{ onError }],
    }
    const client = createHttpClient(config)

    await expect(client.get('/users')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Network failed',
    })
    expect(onError).toHaveBeenCalled()
  })
})

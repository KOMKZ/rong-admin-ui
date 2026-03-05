import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { createRongAdminApp } from '../../src/app-preset'
import type { TokenStorage } from '../../src/app-auth/types'

const TestRoot = defineComponent({ render: () => h('div', 'app') })

const mockStorage: TokenStorage = {
  get: vi.fn(() => null),
  set: vi.fn(),
  remove: vi.fn(),
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('createRongAdminApp', () => {
  it('should return all service instances', () => {
    const app = createRongAdminApp({
      rootComponent: TestRoot,
      auth: { storage: mockStorage },
    })

    expect(app.tokenManager).toBeDefined()
    expect(app.tokenManager.getToken).toBeTypeOf('function')
    expect(app.permissionService).toBeDefined()
    expect(app.permissionService.hasPermission).toBeTypeOf('function')
    expect(app.httpClient).toBeDefined()
    expect(app.httpClient.get).toBeTypeOf('function')
    expect(app.bootstrap).toBeTypeOf('function')
    expect(app.destroy).toBeTypeOf('function')
  })

  it('should bootstrap and destroy without error', async () => {
    document.body.innerHTML = '<div id="test-app"></div>'
    const onReady = vi.fn()

    const app = createRongAdminApp({
      rootComponent: TestRoot,
      rootContainer: '#test-app',
      auth: { storage: mockStorage },
      onReady,
    })

    const ctx = await app.bootstrap()
    expect(ctx.isReady).toBe(true)
    expect(onReady).toHaveBeenCalledOnce()

    app.destroy()
  })

  it('should use default storage when auth.storage not provided', () => {
    const app = createRongAdminApp({ rootComponent: TestRoot })
    expect(app.tokenManager).toBeDefined()
    expect(app.tokenManager.getToken()).toBeNull()
  })

  it('should apply config to preset', async () => {
    document.body.innerHTML = '<div id="cfg-app"></div>'

    const app = createRongAdminApp({
      rootComponent: TestRoot,
      rootContainer: '#cfg-app',
      auth: { storage: mockStorage },
      config: {
        project: { title: 'Test Admin' },
        runtime: { apiBaseURL: '/test-api', env: 'staging', debug: false },
        website: { title: 'Test Site', logo: '' },
      },
    })

    const ctx = await app.bootstrap()
    expect(ctx.isReady).toBe(true)
    app.destroy()
  })

  it('should wire httpClient with tokenManager token provider', () => {
    const app = createRongAdminApp({
      rootComponent: TestRoot,
      auth: { storage: mockStorage },
      request: { baseURL: '/custom-api', timeout: 5000 },
    })

    expect(app.httpClient).toBeDefined()
    app.destroy()
  })

  it('should include permission directive via plugin manager', async () => {
    document.body.innerHTML = '<div id="perm-app"></div>'

    const app = createRongAdminApp({
      rootComponent: TestRoot,
      rootContainer: '#perm-app',
      auth: { storage: mockStorage },
    })

    const ctx = await app.bootstrap()
    expect(ctx.app.directive('permission')).toBeDefined()
    app.destroy()
  })
})

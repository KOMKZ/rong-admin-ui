import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createAdminRouterPipeline } from '../../src/app-router/router-pipeline'
import type { TokenManagerInstance } from '../../src/app-auth/types'
import type { PermissionServiceInstance } from '../../src/app-permission/permission-service'

const FakePage = defineComponent({ render: () => h('div', 'page') })
const LoginPage = defineComponent({ render: () => h('div', 'login') })

function createMockTokenManager(token: string | null = null): TokenManagerInstance {
  let currentToken = token
  return {
    init: vi.fn(),
    destroy: vi.fn(),
    getToken: () => currentToken,
    isAuthenticated: () => currentToken !== null,
    onLoginSuccess: vi.fn((pair) => { currentToken = pair.accessToken }),
    onLogout: vi.fn(() => { currentToken = null }),
  }
}

function createMockPermissionService(perms: string[] = []): PermissionServiceInstance {
  const permSet = new Set(perms)
  return {
    setPermissions: vi.fn(),
    hasPermission: (p: string) => permSet.has(p),
    hasAnyPermission: (actions: string[]) => actions.some((a) => permSet.has(a)),
    hasAllPermissions: (actions: string[]) => actions.every((a) => permSet.has(a)),
    setSuperAdmin: vi.fn(),
    isSuperAdmin: () => false,
    clear: vi.fn(),
    allActions: { value: permSet } as unknown as PermissionServiceInstance['allActions'],
  }
}

describe('createAdminRouterPipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a router with static routes', () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
      ],
      tokenManager: createMockTokenManager('valid-token'),
      permissionService: createMockPermissionService(),
    })

    expect(pipeline.router).toBeDefined()
    expect(pipeline.isDynamicLoaded()).toBe(false)
  })

  it('redirects unauthenticated user to login', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
        { path: '/dashboard', component: FakePage },
      ],
      whiteList: ['/login'],
      loginPath: '/login',
      tokenManager: createMockTokenManager(null),
      permissionService: createMockPermissionService(),
    })

    await pipeline.router.push('/dashboard')
    await pipeline.router.isReady()
    expect(pipeline.router.currentRoute.value.path).toBe('/login')
  })

  it('allows whitelisted routes without auth', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/login', component: LoginPage },
        { path: '/public', component: FakePage },
      ],
      whiteList: ['/login', '/public'],
      tokenManager: createMockTokenManager(null),
      permissionService: createMockPermissionService(),
    })

    await pipeline.router.push('/public')
    await pipeline.router.isReady()
    expect(pipeline.router.currentRoute.value.path).toBe('/public')
  })

  it('redirects authenticated user from login to home', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
      ],
      whiteList: ['/login'],
      loginPath: '/login',
      homePath: '/',
      tokenManager: createMockTokenManager('valid-token'),
      permissionService: createMockPermissionService(),
    })

    await pipeline.router.push('/login')
    await pipeline.router.isReady()
    expect(pipeline.router.currentRoute.value.path).toBe('/')
  })

  it('blocks route when permission is missing', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
        { path: '/admin', component: FakePage, meta: { permissions: ['admin:access'] } },
        { path: '/403', component: FakePage },
      ],
      whiteList: ['/login', '/403'],
      loginPath: '/login',
      forbiddenPath: '/403',
      tokenManager: createMockTokenManager('valid-token'),
      permissionService: createMockPermissionService([]),
    })

    await pipeline.router.push('/admin')
    await pipeline.router.isReady()
    expect(pipeline.router.currentRoute.value.path).toBe('/403')
  })

  it('allows route when permission is present', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
        { path: '/admin', component: FakePage, meta: { permissions: ['admin:access'] } },
      ],
      whiteList: ['/login'],
      tokenManager: createMockTokenManager('valid-token'),
      permissionService: createMockPermissionService(['admin:access']),
    })

    await pipeline.router.push('/admin')
    await pipeline.router.isReady()
    expect(pipeline.router.currentRoute.value.path).toBe('/admin')
  })

  it('loads dynamic routes from menuLoader', async () => {
    const menuLoader = vi.fn().mockResolvedValue([])

    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
      ],
      whiteList: ['/login'],
      tokenManager: createMockTokenManager('valid-token'),
      permissionService: createMockPermissionService(),
      menuLoader,
    })

    await pipeline.loadDynamicRoutes()
    expect(menuLoader).toHaveBeenCalledOnce()
    expect(pipeline.isDynamicLoaded()).toBe(true)
  })

  it('resetRoutes clears dynamic state', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [{ path: '/', component: FakePage }],
      tokenManager: createMockTokenManager('token'),
      permissionService: createMockPermissionService(),
      menuLoader: vi.fn().mockResolvedValue([]),
    })

    await pipeline.loadDynamicRoutes()
    expect(pipeline.isDynamicLoaded()).toBe(true)

    pipeline.resetRoutes()
    expect(pipeline.isDynamicLoaded()).toBe(false)
  })

  it('calls hook.beforeAuth and respects redirect', async () => {
    const pipeline = createAdminRouterPipeline({
      history: createMemoryHistory(),
      staticRoutes: [
        { path: '/', component: FakePage },
        { path: '/login', component: LoginPage },
        { path: '/dashboard', component: FakePage },
        { path: '/maintenance', component: FakePage },
      ],
      whiteList: ['/login', '/maintenance'],
      tokenManager: createMockTokenManager('valid-token'),
      permissionService: createMockPermissionService(),
      hooks: {
        beforeAuth: (to) => {
          if (to === '/dashboard') return '/maintenance'
          return undefined
        },
      },
    })

    await pipeline.router.push('/dashboard')
    await pipeline.router.isReady()
    expect(pipeline.router.currentRoute.value.path).toBe('/maintenance')
  })
})

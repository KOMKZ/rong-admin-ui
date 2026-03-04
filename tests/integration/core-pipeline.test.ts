import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { bootstrapApp } from '@/app-core/bootstrap'
import { createErrorHandler } from '@/app-core/error-boundary'
import { createPermissionService } from '@/app-permission/permission-service'
import { createPermissionDirective } from '@/app-permission/permission-directive'
import { createRouteGenerator } from '@/app-router/route-generator'
import { loadRouteModules } from '@/app-router/route-loader'
import { createTokenManager } from '@/app-auth/token-manager'
import { createAppConfig } from '@/app-config/config-provider'
import type { AppPlugin } from '@/app-core/types'
import type { TokenStorage } from '@/app-auth/types'

const TestApp = defineComponent({
  name: 'IntegrationApp',
  render() {
    return h('div', { id: 'integration-app' }, 'Integration')
  },
})

const Layout = defineComponent({ render: () => h('div', 'layout') })
const ParentLayout = defineComponent({ render: () => h('div', 'parent') })
const NotFound = defineComponent({ render: () => h('div', '404') })
const DashboardView = defineComponent({ render: () => h('div', 'dashboard') })

function createMockStorage(): TokenStorage {
  const store = new Map<string, string>()
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => store.set(key, value),
    remove: (key) => {
      store.delete(key)
    },
  }
}

describe('Core Pipeline Integration', () => {
  it('should bootstrap app with config, auth, permission, and route generation', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const storage = createMockStorage()
    const permissionService = createPermissionService()
    const tokenManager = createTokenManager({
      storage,
      refreshApi: {
        refresh: vi.fn().mockResolvedValue({
          accessToken: 'new-token',
          expiresIn: 3600,
        }),
      },
      refreshIntervalMs: 60000,
    })

    const configPlugin: AppPlugin = {
      name: 'config',
      install: () => {
        createAppConfig({
          project: {
            title: 'Test Admin',
            logo: '',
            navMode: 'vertical',
            permissionMode: 'backend',
            showBreadcrumb: true,
            showTabs: true,
            showFooter: true,
            pageAnimate: true,
            pageAnimateType: 'fade',
            headerFixed: true,
            sidebarCollapsed: false,
            lockScreenTimeout: 0,
          },
          runtime: {
            apiBaseURL: '/api',
            env: 'development',
            debug: true,
          },
        })
      },
      order: 1,
    }

    const permissionPlugin: AppPlugin = {
      name: 'permission',
      install: (app) => {
        const directive = createPermissionDirective(permissionService)
        app.directive('permission', directive)
      },
      order: 2,
    }

    tokenManager.onLoginSuccess({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      expiresIn: 3600,
    })
    tokenManager.init()

    permissionService.setPermissions([
      { action: 'dashboard:view', scope: 'route' },
      { action: 'user:read', scope: 'element' },
    ])

    const generateRoutes = createRouteGenerator({
      layoutComponent: Layout,
      parentLayoutComponent: ParentLayout,
      viewModules: {
        '/views/dashboard/index.vue': () => Promise.resolve(DashboardView),
      },
      notFoundComponent: NotFound,
    })

    const dynamicRoutes = generateRoutes([
      {
        id: 1,
        parentId: null,
        name: 'Dashboard',
        path: '/dashboard',
        children: [
          {
            id: 2,
            parentId: 1,
            name: 'Home',
            path: '/dashboard/home',
            component: 'dashboard',
          },
        ],
      },
    ])

    const staticModules = loadRouteModules({
      'about.ts': {
        default: {
          name: 'about',
          path: '/about',
          component: defineComponent({ render: () => h('div') }),
          meta: { title: 'About' },
        },
      },
    })

    const errorHandler = createErrorHandler()

    const ctx = await bootstrapApp({
      rootComponent: TestApp,
      rootContainer: container,
      plugins: [configPlugin, permissionPlugin],
      onError: errorHandler,
    })

    expect(ctx.isReady).toBe(true)
    expect(tokenManager.isAuthenticated()).toBe(true)
    expect(tokenManager.getToken()).toBe('test-token')
    expect(permissionService.hasPermission('dashboard:view')).toBe(true)
    expect(permissionService.hasPermission('admin:delete')).toBe(false)
    expect(dynamicRoutes).toHaveLength(1)
    expect(dynamicRoutes[0].children).toHaveLength(1)
    expect(staticModules).toHaveLength(1)

    tokenManager.destroy()
    ctx.destroy()
    document.body.removeChild(container)
  })

  it('should handle full logout flow: clear auth → clear permissions → destroy', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const storage = createMockStorage()
    const permissionService = createPermissionService()
    const tokenManager = createTokenManager({ storage })

    tokenManager.onLoginSuccess({ accessToken: 'token' })
    permissionService.setPermissions([{ action: 'read', scope: 'element' }])

    expect(tokenManager.isAuthenticated()).toBe(true)
    expect(permissionService.hasPermission('read')).toBe(true)

    tokenManager.onLogout()
    permissionService.clear()

    expect(tokenManager.isAuthenticated()).toBe(false)
    expect(permissionService.hasPermission('read')).toBe(false)

    const ctx = await bootstrapApp({
      rootComponent: TestApp,
      rootContainer: container,
    })

    ctx.destroy()
    document.body.removeChild(container)
  })
})

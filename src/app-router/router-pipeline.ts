import {
  createRouter,
  createWebHistory,
  type Router,
  type RouteRecordRaw,
  type RouteLocationNormalized,
} from 'vue-router'
import type { TokenManagerInstance } from '../app-auth/types'
import type { PermissionServiceInstance } from '../app-permission/permission-service'
import type { RouterGuardHooks, MenuDataItem, RouteGeneratorOptions } from './types'
import { createRouteGenerator } from './route-generator'

export interface RouterPipelineOptions {
  history?: ReturnType<typeof createWebHistory>
  staticRoutes?: RouteRecordRaw[]
  /** Routes that skip auth check */
  whiteList?: string[]
  loginPath?: string
  homePath?: string
  forbiddenPath?: string
  tokenManager: TokenManagerInstance
  permissionService: PermissionServiceInstance
  /** If provided, enables dynamic route loading from backend menus */
  menuLoader?: () => Promise<MenuDataItem[]>
  routeGeneratorOptions?: RouteGeneratorOptions
  hooks?: RouterGuardHooks
}

export interface RouterPipelineInstance {
  router: Router
  loadDynamicRoutes: () => Promise<void>
  resetRoutes: () => void
  isDynamicLoaded: () => boolean
}

export function createAdminRouterPipeline(options: RouterPipelineOptions): RouterPipelineInstance {
  const {
    staticRoutes = [],
    whiteList = [],
    loginPath = '/login',
    homePath = '/',
    forbiddenPath = '/403',
    tokenManager,
    permissionService,
    hooks,
  } = options

  const router = createRouter({
    history: options.history ?? createWebHistory(),
    routes: [...staticRoutes],
    scrollBehavior: () => ({ left: 0, top: 0 }),
  })

  let dynamicLoaded = false
  const dynamicRouteNames: string[] = []

  function generateFromMenus(menus: MenuDataItem[]): RouteRecordRaw[] {
    if (!options.routeGeneratorOptions) return []
    const generator = createRouteGenerator(options.routeGeneratorOptions)
    return generator(menus)
  }

  function addDynamicRoutes(routes: RouteRecordRaw[]): void {
    for (const route of routes) {
      router.addRoute(route)
      if (route.name) {
        dynamicRouteNames.push(route.name as string)
      }
    }
  }

  function resetRoutes(): void {
    for (const name of dynamicRouteNames) {
      if (router.hasRoute(name)) {
        router.removeRoute(name)
      }
    }
    dynamicRouteNames.length = 0
    dynamicLoaded = false
  }

  async function loadDynamicRoutes(): Promise<void> {
    if (dynamicLoaded || !options.menuLoader) return
    const menus = await options.menuLoader()
    const routes = generateFromMenus(menus)
    addDynamicRoutes(routes)
    dynamicLoaded = true
  }

  function isWhiteListed(path: string): boolean {
    return whiteList.some((p) => path === p || path.startsWith(`${p}/`))
  }

  function hasPermission(to: RouteLocationNormalized): boolean {
    const requiredPermissions = to.meta?.permissions as string[] | undefined
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    return requiredPermissions.some((p) => permissionService.hasPermission(p))
  }

  router.beforeEach(async (to, from) => {
    const toPath = to.path
    const fromPath = from.path

    const token = tokenManager.getToken()

    // Authenticated user navigating to login → redirect to home
    if (toPath === loginPath && token) {
      return homePath
    }

    if (hooks?.beforeAuth) {
      const result = hooks.beforeAuth(toPath, fromPath)
      if (result === false) return false
      if (typeof result === 'string') return result
    }

    if (isWhiteListed(toPath)) return true

    if (!token) {
      return `${loginPath}?redirect=${encodeURIComponent(toPath)}`
    }

    if (!dynamicLoaded && options.menuLoader) {
      try {
        await loadDynamicRoutes()
        return { ...to, replace: true }
      } catch {
        tokenManager.onLogout()
        return loginPath
      }
    }

    if (!hasPermission(to)) {
      if (hooks?.onAuthFail) {
        return hooks.onAuthFail(toPath)
      }
      return forbiddenPath
    }

    return true
  })

  router.afterEach((to) => {
    hooks?.afterAuth?.(to.path)
  })

  return {
    router,
    loadDynamicRoutes,
    resetRoutes,
    isDynamicLoaded: () => dynamicLoaded,
  }
}

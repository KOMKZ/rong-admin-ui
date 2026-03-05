import type { App } from 'vue'
import type { AppPlugin, AppContext } from '../app-core/types'
import type { TokenStorage } from '../app-auth/types'
import { bootstrapApp, createErrorHandler } from '../app-core'
import { createTokenManager } from '../app-auth'
import { createPermissionService } from '../app-permission'
import { createPermissionDirective } from '../app-permission'
import { createPluginManager } from '../app-plugin'
import { createHttpClient } from '../app-request'
import { installAppConfig } from '../app-config'
import { createThemeProvider } from '../theme'
import { createAdminRouterPipeline } from '../app-router/router-pipeline'
import type { RouterPipelineInstance } from '../app-router/router-pipeline'
import type { AppConfigInput } from '../app-config'
import type { RongAdminPresetOptions, RongAdminAppInstance } from './types'

const defaultStorage: TokenStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* storage unavailable */
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage unavailable */
    }
  },
}

/**
 * One-shot factory: creates all services, wires dependencies,
 * and returns a bootstrap handle plus the service instances
 * for external use (e.g. exporting to story pages).
 */
export function createRongAdminApp(options: RongAdminPresetOptions): RongAdminAppInstance {
  const tokenManager = createTokenManager({
    storage: options.auth?.storage ?? defaultStorage,
    enableCrossTabSync: options.auth?.enableCrossTabSync ?? true,
    refreshApi: options.auth?.refreshApi,
    refreshThresholdMs: options.auth?.refreshThresholdMs,
    onTokenExpired: options.auth?.onTokenExpired,
  })

  const permissionService = createPermissionService()

  const themeProvider = createThemeProvider({
    defaultPreset: options.theme?.defaultPreset,
    defaultMode: options.theme?.defaultMode,
    storageKey: options.theme?.storageKey,
    storage: options.theme?.storage,
  })

  let routerPipeline: RouterPipelineInstance | null = null
  if (options.router) {
    routerPipeline = createAdminRouterPipeline({
      staticRoutes: options.router.staticRoutes,
      whiteList: options.router.whiteList,
      loginPath: options.router.loginPath,
      homePath: options.router.homePath,
      tokenManager,
      permissionService,
      menuLoader: options.router.menuLoader,
      routeGeneratorOptions: options.router.routeGeneratorOptions,
      hooks: options.router.hooks,
    })
  }

  const httpClient = createHttpClient({
    requestConfig: {
      baseURL: options.request?.baseURL ?? '/api',
      timeout: options.request?.timeout ?? 15000,
      headers: options.request?.headers,
    },
    tokenProvider: { getToken: () => tokenManager.getToken() },
    interceptors: options.request?.interceptors,
    errorStrategy: options.request?.errorStrategy,
  })

  const configPlugin: AppPlugin = {
    name: 'rong-admin-config',
    install: (app: App) => {
      installAppConfig(app, {
        project: options.config?.project,
        runtime: options.config?.runtime,
        website: options.config?.website,
      } as Partial<AppConfigInput>)
    },
    order: 0,
  }

  const routerPlugin: AppPlugin | null = routerPipeline
    ? {
        name: 'rong-admin-router',
        install: (app: App) => {
          app.use(routerPipeline!.router)
        },
        order: 5,
      }
    : null

  const pluginManager = createPluginManager({
    directives: [{ name: 'permission', directive: createPermissionDirective(permissionService) }],
  })

  let appCtx: AppContext | null = null

  async function bootstrap(): Promise<AppContext> {
    const errorHandler = options.onError ?? createErrorHandler()

    const allPlugins: AppPlugin[] = [configPlugin, pluginManager]
    if (routerPlugin) allPlugins.push(routerPlugin)
    allPlugins.push(...(options.plugins ?? []))

    appCtx = await bootstrapApp({
      rootComponent: options.rootComponent,
      rootContainer: options.rootContainer ?? '#app',
      plugins: allPlugins,
      onError: errorHandler,
      onReady: async () => {
        tokenManager.init()
        await options.onReady?.()
      },
    })

    return appCtx
  }

  function destroy(): void {
    if (routerPipeline) {
      routerPipeline.resetRoutes()
    }
    themeProvider.destroy()
    tokenManager.destroy()
    appCtx?.destroy()
    appCtx = null
  }

  return {
    tokenManager,
    permissionService,
    httpClient,
    themeProvider,
    routerPipeline,
    bootstrap,
    destroy,
  }
}

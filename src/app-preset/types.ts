import type { Component } from 'vue'
import type { AppPlugin, AppErrorHandler, AppContext } from '../app-core/types'
import type { TokenStorage, TokenRefreshApi, TokenManagerInstance } from '../app-auth/types'
import type { RequestInterceptor, ErrorStrategyConfig, HttpClient } from '../app-request/types'
import type { ProjectConfig, RuntimeConfig, WebsiteConfig } from '../app-config/types'
import type { PermissionServiceInstance } from '../app-permission/permission-service'
import type { ThemePresetName, ThemeMode, ThemeProviderInstance, ThemeProviderOptions } from '../theme/types'
import type { RouterPipelineOptions, RouterPipelineInstance } from '../app-router/router-pipeline'
import type { RouteRecordRaw } from 'vue-router'

export interface RongAdminPresetOptions {
  rootComponent: Component
  rootContainer?: string

  auth?: {
    storage?: TokenStorage
    enableCrossTabSync?: boolean
    refreshApi?: TokenRefreshApi
    refreshThresholdMs?: number
    onTokenExpired?: () => void
  }

  request?: {
    baseURL?: string
    timeout?: number
    headers?: Record<string, string>
    interceptors?: RequestInterceptor[]
    errorStrategy?: ErrorStrategyConfig
  }

  config?: {
    project?: Partial<ProjectConfig>
    runtime?: Partial<RuntimeConfig>
    website?: Partial<WebsiteConfig>
  }

  theme?: {
    defaultPreset?: ThemePresetName
    defaultMode?: ThemeMode
    storageKey?: string
    storage?: ThemeProviderOptions['storage']
  }

  router?: {
    staticRoutes?: RouteRecordRaw[]
    whiteList?: string[]
    loginPath?: string
    homePath?: string
    menuLoader?: RouterPipelineOptions['menuLoader']
    routeGeneratorOptions?: RouterPipelineOptions['routeGeneratorOptions']
    hooks?: RouterPipelineOptions['hooks']
  }

  plugins?: AppPlugin[]

  onReady?: () => void | Promise<void>
  onError?: AppErrorHandler
}

export interface RongAdminAppInstance {
  tokenManager: TokenManagerInstance
  permissionService: PermissionServiceInstance
  httpClient: HttpClient
  themeProvider: ThemeProviderInstance
  routerPipeline: RouterPipelineInstance | null
  bootstrap: () => Promise<AppContext>
  destroy: () => void
}

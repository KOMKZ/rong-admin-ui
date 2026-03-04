import type { App, Component } from 'vue'

/**
 * Application bootstrap configuration.
 * Defines the minimal contract for initializing an admin application.
 */
export interface AppBootstrapConfig {
  rootComponent: Component
  rootContainer: string | Element
  plugins?: AppPlugin[]
  onError?: AppErrorHandler
  onReady?: () => void | Promise<void>
}

export interface AppPlugin {
  name: string
  install: (app: App, options?: Record<string, unknown>) => void | Promise<void>
  order?: number
}

export interface AppErrorHandler {
  onVueError: (err: Error, instance: string | null, info: string) => void
  onUnhandledRejection?: (event: PromiseRejectionEvent) => void
  onGlobalError?: (event: ErrorEvent) => void
}

export interface AppContext {
  app: App
  isReady: boolean
  destroy: () => void
}

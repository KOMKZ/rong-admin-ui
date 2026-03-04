import { createApp } from 'vue'
import type { AppBootstrapConfig, AppContext, AppPlugin } from './types'

function sortPlugins(plugins: AppPlugin[]): AppPlugin[] {
  return [...plugins].sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

async function installPlugins(
  app: ReturnType<typeof createApp>,
  plugins: AppPlugin[],
): Promise<void> {
  const sorted = sortPlugins(plugins)
  for (const plugin of sorted) {
    await plugin.install(app)
  }
}

export async function bootstrapApp(config: AppBootstrapConfig): Promise<AppContext> {
  const app = createApp(config.rootComponent)
  const cleanupFns: Array<() => void> = []

  if (config.onError) {
    const handler = config.onError

    app.config.errorHandler = (err, instance, info) => {
      const componentName = instance?.$options?.name ?? null
      handler.onVueError(err instanceof Error ? err : new Error(String(err)), componentName, info)
    }

    if (handler.onUnhandledRejection) {
      const listener = handler.onUnhandledRejection
      window.addEventListener('unhandledrejection', listener)
      cleanupFns.push(() => window.removeEventListener('unhandledrejection', listener))
    }

    if (handler.onGlobalError) {
      const listener = handler.onGlobalError
      window.addEventListener('error', listener)
      cleanupFns.push(() => window.removeEventListener('error', listener))
    }
  }

  if (config.plugins?.length) {
    await installPlugins(app, config.plugins)
  }

  if (config.onReady) {
    await config.onReady()
  }

  app.mount(config.rootContainer)

  let destroyed = false

  return {
    app,
    isReady: true,
    destroy(): void {
      if (destroyed) return
      destroyed = true
      for (const fn of cleanupFns) {
        fn()
      }
      cleanupFns.length = 0
      app.config.errorHandler = undefined
      app.unmount()
    },
  }
}

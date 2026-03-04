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

function setupErrorHandling(app: ReturnType<typeof createApp>, config: AppBootstrapConfig): void {
  if (!config.onError) return

  const handler = config.onError

  app.config.errorHandler = (err, instance, info) => {
    const componentName = instance?.$options?.name ?? null
    handler.onVueError(err instanceof Error ? err : new Error(String(err)), componentName, info)
  }

  if (handler.onUnhandledRejection) {
    window.addEventListener('unhandledrejection', handler.onUnhandledRejection)
  }

  if (handler.onGlobalError) {
    window.addEventListener('error', handler.onGlobalError)
  }
}

export async function bootstrapApp(config: AppBootstrapConfig): Promise<AppContext> {
  const app = createApp(config.rootComponent)

  setupErrorHandling(app, config)

  if (config.plugins?.length) {
    await installPlugins(app, config.plugins)
  }

  if (config.onReady) {
    await config.onReady()
  }

  app.mount(config.rootContainer)

  return {
    app,
    isReady: true,
    destroy: () => app.unmount(),
  }
}

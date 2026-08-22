import type { App, ComponentPublicInstance } from 'vue'
import type { AppPlugin } from '../app-core'

export interface DevtoolsRouteContext {
  name?: string
  path?: string
  fullPath?: string
  title?: string
}

export interface DevtoolsPluginOptions {
  enabled?: boolean
  getRouteContext?: () => DevtoolsRouteContext | null | undefined
}

type ComponentTypeWithFile = {
  __file?: string
  name?: string
}

function normalizeFile(file?: string): string {
  if (!file) return ''
  const srcIndex = file.lastIndexOf('/src/')
  if (srcIndex >= 0) return file.slice(srcIndex + 1)
  return file.replace(/\\/g, '/')
}

function getComponentMeta(instance: ComponentPublicInstance): { file: string; component: string } {
  const type = instance.$.type as ComponentTypeWithFile
  return {
    file: normalizeFile(type.__file),
    component: type.name || instance.$options.name || '',
  }
}

function markComponentRoot(instance: ComponentPublicInstance): void {
  const el = instance.$el
  if (!(el instanceof HTMLElement)) return

  const meta = getComponentMeta(instance)
  if (meta.file) {
    el.dataset.annoteFile = meta.file
  }
  if (meta.component) {
    el.dataset.annoteComponent = meta.component
  }
}

function syncRouteContext(getRouteContext?: DevtoolsPluginOptions['getRouteContext']): void {
  const route = getRouteContext?.()
  if (!route) return

  const root = document.documentElement
  if (route.name) root.dataset.annoteRouteName = route.name
  if (route.path) root.dataset.annoteRoutePath = route.path
  if (route.fullPath) root.dataset.annoteRouteFullPath = route.fullPath
  if (route.title) root.dataset.annoteRouteTitle = route.title
}

export function createDevtoolsPlugin(options: DevtoolsPluginOptions = {}): AppPlugin {
  return {
    name: 'rong-admin-devtools',
    order: 95,
    install(app: App): void {
      if (!options.enabled) return

      document.documentElement.dataset.annoteEnabled = 'true'
      syncRouteContext(options.getRouteContext)

      app.mixin({
        mounted() {
          markComponentRoot(this)
          syncRouteContext(options.getRouteContext)
        },
        updated() {
          markComponentRoot(this)
          syncRouteContext(options.getRouteContext)
        },
      })
    },
  }
}

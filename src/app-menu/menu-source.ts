import { computed, readonly, ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { AppMenuItem, MenuSourceInstance, MenuSourceMode, MenuSourceOptions } from './types'

export function createMenuSource(options: MenuSourceOptions = {}): MenuSourceInstance {
  const mode = ref<MenuSourceMode>(options.mode ?? 'local')
  const localMenus = ref<AppMenuItem[]>(normalizeMenuTree(options.localMenus ?? []))
  const remoteMenus = ref<AppMenuItem[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)

  const menus = computed(() => (mode.value === 'remote' ? remoteMenus.value : localMenus.value))

  function setMode(nextMode: MenuSourceMode): void {
    mode.value = nextMode
  }

  function setLocalMenus(items: AppMenuItem[]): void {
    localMenus.value = normalizeMenuTree(items)
  }

  function setRemoteMenus(items: AppMenuItem[]): void {
    remoteMenus.value = normalizeMenuTree(items)
  }

  async function load(): Promise<AppMenuItem[]> {
    if (mode.value !== 'remote') return localMenus.value
    if (!options.loadRemoteMenus) return remoteMenus.value

    loading.value = true
    error.value = null
    try {
      const items = normalizeMenuTree(await options.loadRemoteMenus())
      remoteMenus.value = items
      return items
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    remoteMenus.value = []
    error.value = null
    loading.value = false
  }

  return {
    mode,
    menus,
    loading: readonly(loading),
    error: readonly(error),
    setMode,
    setLocalMenus,
    setRemoteMenus,
    load,
    reset,
  }
}

export function normalizeMenuTree(items: AppMenuItem[]): AppMenuItem[] {
  return items
    .filter((item) => !item.hidden)
    .map((item) => {
      const children = normalizeMenuTree(item.children ?? [])
      const normalized: AppMenuItem = {
        name: String(item.name || '').trim(),
        path: String(item.path || '').trim(),
        title: String(item.title || item.name || '').trim(),
      }
      if (item.icon) normalized.icon = String(item.icon).trim()
      if (item.meta) normalized.meta = { ...item.meta }
      if (children.length > 0) normalized.children = children
      return normalized
    })
    .filter((item) => item.name !== '' && item.path !== '' && item.title !== '')
}

export function routeRecordsToMenuTree(routes: RouteRecordRaw[]): AppMenuItem[] {
  return routeRecordsToMenuTreeWithBase(routes, '')
}

function routeRecordsToMenuTreeWithBase(routes: RouteRecordRaw[], basePath: string): AppMenuItem[] {
  return routes
    .filter((route) => !route.meta?.hidden && typeof route.name === 'string')
    .map((route) => {
      const path = joinRoutePath(basePath, route.path)
      const children = routeRecordsToMenuTreeWithBase(route.children ?? [], path)
      const item: AppMenuItem = {
        name: String(route.name),
        path,
        title: typeof route.meta?.title === 'string' ? route.meta.title : String(route.name),
      }
      if (typeof route.meta?.icon === 'string') item.icon = route.meta.icon
      if (route.meta) item.meta = { ...route.meta }
      if (children.length > 0) item.children = children
      return item
    })
}

function joinRoutePath(basePath: string, path: string): string {
  if (!path) return normalizePath(basePath)
  if (path.startsWith('/')) return normalizePath(path)
  const base = basePath === '/' ? '' : basePath
  return normalizePath(`${base}/${path}`)
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+/g, '/')
  if (normalized === '') return '/'
  if (normalized.startsWith('/')) return normalized
  return `/${normalized}`
}

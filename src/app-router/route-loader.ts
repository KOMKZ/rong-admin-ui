import type { RouteRecordRaw } from 'vue-router'
import type { RouteModuleConfig } from './types'

function normalizeRoute(mod: RouteModuleConfig): RouteRecordRaw {
  const meta = mod.meta ?? {}
  if (mod.redirect) {
    return {
      name: mod.name,
      path: mod.path,
      redirect: mod.redirect,
      meta,
      children: mod.children?.map(normalizeRoute),
    }
  }
  return {
    name: mod.name,
    path: mod.path,
    component:
      mod.component ?? (() => import('vue').then((m) => m.defineComponent({ render: () => null }))),
    meta,
    children: mod.children?.map(normalizeRoute),
  }
}

export function loadRouteModules(
  modules: Record<string, { default: RouteModuleConfig }>,
): RouteRecordRaw[] {
  const routeList: Array<{ route: RouteRecordRaw; order: number }> = []

  for (const [, mod] of Object.entries(modules)) {
    const config = mod.default
    if (!config?.name || !config?.path) continue
    routeList.push({
      route: normalizeRoute(config),
      order: config.order ?? 100,
    })
  }

  return routeList.sort((a, b) => a.order - b.order).map((item) => item.route)
}

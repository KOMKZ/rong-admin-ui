import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { MenuDataItem, RouteGeneratorOptions } from './types'

function findViewComponent(
  viewModules: Record<string, () => Promise<Component>>,
  componentPath: string,
): (() => Promise<Component>) | undefined {
  const normalizedPath = componentPath.startsWith('/') ? componentPath : `/${componentPath}`

  for (const [modulePath, loader] of Object.entries(viewModules)) {
    if (
      modulePath.endsWith(`${normalizedPath}.vue`) ||
      modulePath.endsWith(`${normalizedPath}/index.vue`)
    ) {
      return loader
    }
  }
  return undefined
}

function menuToRoute(
  menu: MenuDataItem,
  options: RouteGeneratorOptions,
  isTopLevel: boolean,
): RouteRecordRaw | null {
  const hasChildren = menu.children && menu.children.length > 0

  const route: RouteRecordRaw = {
    name: menu.name,
    path: menu.path,
    meta: {
      title: menu.name,
      icon: menu.icon,
      hidden: menu.hidden,
      orderNum: menu.orderNum,
      ...menu.meta,
    },
    children: [],
  }

  if (isTopLevel) {
    route.component = options.layoutComponent
    if (hasChildren) {
      route.redirect = menu.redirect ?? menu.children![0].path
    }
  } else if (menu.component) {
    const viewComponent = findViewComponent(options.viewModules, menu.component)
    if (viewComponent) {
      route.component = viewComponent
    }
  }

  if (hasChildren) {
    const childRoutes = menu
      .children!.map((child) => menuToRoute(child, options, false))
      .filter((r): r is RouteRecordRaw => r !== null)

    if (childRoutes.length > 0 && !isTopLevel) {
      route.component = options.parentLayoutComponent
    }
    route.children = childRoutes
  }

  return route
}

export function createRouteGenerator(options: RouteGeneratorOptions) {
  return function generateRoutesFromMenus(menus: MenuDataItem[]): RouteRecordRaw[] {
    return menus
      .map((menu) => menuToRoute(menu, options, true))
      .filter((r): r is RouteRecordRaw => r !== null)
  }
}

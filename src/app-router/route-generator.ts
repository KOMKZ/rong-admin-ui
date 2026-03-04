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
  const meta: Record<string, unknown> = {
    title: menu.name,
    icon: menu.icon,
    hidden: menu.hidden,
    orderNum: menu.orderNum,
    ...menu.meta,
  }

  if (isTopLevel && menu.redirect) {
    return {
      name: menu.name,
      path: menu.path,
      redirect: menu.redirect,
      component: options.layoutComponent,
      meta,
      children: hasChildren
        ? menu
            .children!.map((child) => menuToRoute(child, options, false))
            .filter((r): r is RouteRecordRaw => r !== null)
        : [],
    }
  }

  if (isTopLevel) {
    const children = hasChildren
      ? menu
          .children!.map((child) => menuToRoute(child, options, false))
          .filter((r): r is RouteRecordRaw => r !== null)
      : []

    const redirect = hasChildren ? menu.children![0].path : undefined

    if (redirect) {
      return {
        name: menu.name,
        path: menu.path,
        redirect,
        component: options.layoutComponent,
        meta,
        children,
      }
    }

    return {
      name: menu.name,
      path: menu.path,
      component: options.layoutComponent,
      meta,
      children,
    }
  }

  if (hasChildren) {
    const childRoutes = menu
      .children!.map((child) => menuToRoute(child, options, false))
      .filter((r): r is RouteRecordRaw => r !== null)

    return {
      name: menu.name,
      path: menu.path,
      component: options.parentLayoutComponent,
      meta,
      children: childRoutes,
    }
  }

  if (menu.component) {
    const viewComponent = findViewComponent(options.viewModules, menu.component)
    if (viewComponent) {
      return {
        name: menu.name,
        path: menu.path,
        component: viewComponent,
        meta,
      }
    }
  }

  return {
    name: menu.name,
    path: menu.path,
    component: options.notFoundComponent,
    meta,
  }
}

export function createRouteGenerator(options: RouteGeneratorOptions) {
  return function generateRoutesFromMenus(menus: MenuDataItem[]): RouteRecordRaw[] {
    return menus
      .map((menu) => menuToRoute(menu, options, true))
      .filter((r): r is RouteRecordRaw => r !== null)
  }
}

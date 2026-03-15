import { computed, type Ref } from 'vue'
import { useRoute } from 'vue-router'

export interface UIAuthPayload {
  visible_routes: string[]
  visible_menus: string[]
  element_permissions: Record<string, string[]>
  page_actions?: Record<string, string[]>
}

type MenuLike<T> = T & {
  name: string
  children?: T[]
}

export function canAccessRoute(uiAuth: UIAuthPayload | null, routePath: string): boolean {
  if (!uiAuth) return true

  const visibleRoutes = Array.isArray(uiAuth.visible_routes) ? uiAuth.visible_routes : []
  if (visibleRoutes.length === 0) return true

  const target = normalizePath(routePath)
  return visibleRoutes.some((route) => {
    const normalized = normalizePath(route)
    return target === normalized || target.startsWith(`${normalized}/`)
  })
}

export function hasElementPermission(
  uiAuth: UIAuthPayload | null,
  routePath: string,
  permissionCode: string,
): boolean {
  if (!uiAuth) return true

  const normalized = normalizePath(routePath)
  const routePermissions = uiAuth.element_permissions?.[normalized]
  if (!Array.isArray(routePermissions) || routePermissions.length === 0) {
    return true
  }

  return routePermissions.includes(permissionCode)
}

export function hasPageAction(uiAuth: UIAuthPayload | null, routePath: string, actionID: string): boolean {
  if (!uiAuth) return true

  const normalized = normalizePath(routePath)
  const actions = uiAuth.page_actions?.[normalized]
  if (!Array.isArray(actions) || actions.length === 0) {
    return true
  }

  return actions.includes(actionID)
}

export function filterMenusByVisibleNames<T>(menus: MenuLike<T>[], uiAuth: UIAuthPayload | null): MenuLike<T>[] {
  if (!uiAuth) return menus

  const visibleMenus = new Set((uiAuth.visible_menus ?? []).map((item) => String(item)))
  if (visibleMenus.size === 0) return menus

  function filter(items: MenuLike<T>[]): MenuLike<T>[] {
    const next: MenuLike<T>[] = []

    for (const item of items) {
      const children = item.children ? filter(item.children as MenuLike<T>[]) : undefined
      const isVisible = visibleMenus.has(item.name)
      if (!isVisible && (!children || children.length === 0)) {
        continue
      }

      const cloned: MenuLike<T> = { ...item }
      if (children) {
        cloned.children = children as T[]
      }
      next.push(cloned)
    }

    return next
  }

  return filter(menus)
}

export function useAuthorizedMenu<T>(
  rawMenus: Ref<MenuLike<T>[]>,
  uiAuth: Ref<UIAuthPayload | null>,
) {
  return computed(() => filterMenusByVisibleNames(rawMenus.value, uiAuth.value))
}

export function useElementAuth(uiAuth: Ref<UIAuthPayload | null>) {
  const route = useRoute()

  function canDo(permissionCode: string): boolean {
    return hasElementPermission(uiAuth.value, route.path, permissionCode)
  }

  return { canDo }
}

export function usePageActions(uiAuth: Ref<UIAuthPayload | null>) {
  const route = useRoute()

  const allowedActions = computed(() => {
    if (!uiAuth.value) return new Set<string>()
    const list = uiAuth.value.page_actions?.[normalizePath(route.path)] ?? []
    return new Set(list)
  })

  function isActionAllowed(actionID: string): boolean {
    return hasPageAction(uiAuth.value, route.path, actionID)
  }

  return {
    allowedActions,
    isActionAllowed,
  }
}

function normalizePath(path: string): string {
  if (!path) return '/'
  if (path === '/') return '/'
  return path.replace(/\/+$/, '') || '/'
}

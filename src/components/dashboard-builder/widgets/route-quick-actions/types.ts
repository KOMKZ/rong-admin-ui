import type { DashboardRouteOption } from '../../types'

export interface RouteQuickActionItem {
  id: string
  label: string
  route: string
}

export interface RouteQuickActionsWidgetConfig {
  title?: string
  description?: string
  actions: RouteQuickActionItem[]
}

export interface RouteQuickActionsEditorOptions {
  routeOptions: DashboardRouteOption[]
}

export function normalizeRouteQuickActionsConfig(value: unknown): RouteQuickActionsWidgetConfig {
  const data = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const actionsRaw = Array.isArray(data.actions) ? data.actions : []
  const actions = actionsRaw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const typed = item as Record<string, unknown>
      const label = typeof typed.label === 'string' ? typed.label.trim() : ''
      const route = typeof typed.route === 'string' ? typed.route.trim() : ''
      if (!label || !route) return null
      return {
        id: typeof typed.id === 'string' && typed.id ? typed.id : `action-${index + 1}`,
        label,
        route,
      }
    })
    .filter((item): item is RouteQuickActionItem => item !== null)

  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    actions,
  }
}

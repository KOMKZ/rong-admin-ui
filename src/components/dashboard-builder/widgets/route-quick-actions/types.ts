import type { DashboardRouteOption } from '../../types'

export interface RouteQuickActionItem {
  id: string
  label: string
  route: string
  openMode?: 'in_app' | 'new_tab'
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
  const actions: RouteQuickActionItem[] = []

  actionsRaw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const typed = item as Record<string, unknown>
    const label = typeof typed.label === 'string' ? typed.label.trim() : ''
    const route = typeof typed.route === 'string' ? typed.route.trim() : ''
    if (!label || !route) return

    const openMode: 'in_app' | 'new_tab' = typed.openMode === 'new_tab' ? 'new_tab' : 'in_app'
    actions.push({
      id: typeof typed.id === 'string' && typed.id ? typed.id : `action-${index + 1}`,
      label,
      route,
      openMode,
    })
  })

  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    actions,
  }
}

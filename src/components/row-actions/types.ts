import type { RouteLocationRaw } from 'vue-router'
import type { VNode } from 'vue'

/**
 * RowAction 是可判别联合：`kind` 是唯一事实源，禁止通过 to/href/onClick 的真假组合猜类型。
 * - command（缺省）：按钮语义，`onClick` 承担全部行为。
 * - route：应用内路由链接，渲染真实 anchor，普通左键 SPA 导航，修饰键/中键/右键交给浏览器。
 * - link：外部/既有 URL 链接，渲染真实 `<a href>`。
 * 同一 action 不允许同时携带导航与命令语义（`never` 字段在类型层互斥）。
 */
export type RowAction<T = object> = RowCommandAction<T> | RowRouteAction<T> | RowHrefAction<T>

export interface RowActionBase<T = object> {
  key: string
  label: string
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  icon?: string
  danger?: boolean
  disabled?: boolean | ((row: T) => boolean)
}

export interface RowCommandAction<T = object> extends RowActionBase<T> {
  kind?: 'command'
  onClick?: (row: T) => void
  to?: never
  href?: never
  target?: never
  rel?: never
}

export interface RowRouteAction<T = object> extends RowActionBase<T> {
  kind: 'route'
  to: RouteLocationRaw | ((row: T) => RouteLocationRaw)
  target?: '_self' | '_blank'
  onClick?: never
  href?: never
  rel?: never
}

export interface RowHrefAction<T = object> extends RowActionBase<T> {
  kind: 'link'
  href: string | ((row: T) => string)
  target?: '_self' | '_blank'
  rel?: string
  onClick?: never
  to?: never
}

export interface RowActionsProps<T = object> {
  row: T
  actions: RowAction<T>[]
  density?: 'default' | 'compact'
  maxInline?: number
  moreLabel?: string
  testIdPrefix?: string
}

export interface RowActionsEmits<T = object> {
  action: [key: string, row: T]
}

export interface RowActionsSlots<T = object> {
  action?: (params: { action: RowAction<T>; row: T }) => VNode
}

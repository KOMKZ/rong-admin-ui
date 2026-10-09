import type { RouteLocationRaw } from 'vue-router'

export type EmptyStateSize = 'small' | 'medium' | 'large'

export interface REmptyStateProps {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionType?: 'primary' | 'default'
  /** 提供时动作渲染为真实路由链接（不 emit action）；缺省保持命令按钮协议。 */
  actionTo?: RouteLocationRaw
  size?: EmptyStateSize
}

export interface REmptyStateEmits {
  (e: 'action'): void
}

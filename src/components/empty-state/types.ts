export type EmptyStateSize = 'small' | 'medium' | 'large'

export interface REmptyStateProps {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionType?: 'primary' | 'default'
  size?: EmptyStateSize
}

export interface REmptyStateEmits {
  (e: 'action'): void
}

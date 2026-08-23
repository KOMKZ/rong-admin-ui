import type { VNode } from 'vue'

export interface RowAction<T = object> {
  key: string
  label: string
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  icon?: string
  danger?: boolean
  disabled?: boolean | ((row: T) => boolean)
  onClick?: (row: T) => void
}

export interface RowActionsProps<T = object> {
  row: T
  actions: RowAction<T>[]
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

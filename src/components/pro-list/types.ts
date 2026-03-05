import type { VNode } from 'vue'

export type ProListViewMode = 'card' | 'list'

export interface ProListAction {
  key: string
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean | ((item: Record<string, unknown>) => boolean)
}

export interface ProListPagination {
  page: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

export interface ProListProps<T = Record<string, unknown>> {
  data: T[]
  loading?: boolean
  viewMode?: ProListViewMode
  pagination?: ProListPagination | false
  rowKey?: string | ((row: T) => string | number)
  selectable?: boolean
  checkedKeys?: (string | number)[]
  actions?: ProListAction[]
  emptyText?: string
  emptyIcon?: string
  grid?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  cardMinWidth?: number
}

export interface ProListEmits<T = Record<string, unknown>> {
  'update:viewMode': [mode: ProListViewMode]
  'update:page': [page: number]
  'update:pageSize': [size: number]
  'update:checkedKeys': [keys: (string | number)[]]
  action: [key: string, item: T]
  itemClick: [item: T]
}

export interface ProListSlots<T = Record<string, unknown>> {
  card?: (params: { item: T; index: number }) => VNode
  listItem?: (params: { item: T; index: number }) => VNode
  actions?: (params: { item: T }) => VNode
  header?: () => VNode
  empty?: () => VNode
  headerExtra?: () => VNode
}

export interface ProListExpose {
  clearSelection: () => void
  toggleViewMode: () => void
}

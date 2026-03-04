import type { Component, VNode } from 'vue'

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string
  title: string
  width?: number | string
  minWidth?: number
  fixed?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  ellipsis?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (row: T, index: number) => VNode | string
  sorter?: (a: T, b: T) => number
}

export interface DataTablePagination {
  page: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

export type DataTableRowKey = string | number

export interface DataTableSortState {
  columnKey: string
  order: 'ascend' | 'descend' | false
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  rowKey?: string | ((row: T) => DataTableRowKey)
  pagination?: DataTablePagination | false
  bordered?: boolean
  striped?: boolean
  singleLine?: boolean
  size?: 'small' | 'medium' | 'large'
  maxHeight?: number | string
  scrollX?: number | string
  checkedRowKeys?: DataTableRowKey[]
  defaultSort?: DataTableSortState
  emptyText?: string
}

export interface DataTableEmits<T = Record<string, unknown>> {
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
  'update:checkedRowKeys': [keys: DataTableRowKey[]]
  'update:sort': [sort: DataTableSortState]
  rowClick: [row: T, index: number]
}

export interface DataTableSlots<T = Record<string, unknown>> {
  empty?: () => VNode
  loading?: () => VNode
  headerCell?: (params: { column: DataTableColumn<T> }) => VNode
  bodyCell?: (params: { column: DataTableColumn<T>; row: T; index: number }) => VNode
  toolbar?: () => VNode
  summary?: () => VNode
}

export interface DataTableExpose {
  clearSelection: () => void
  clearSort: () => void
  scrollTo: (options: { top?: number; left?: number }) => void
}

export type DataTableAction = Component & {
  label: string
  icon?: string
  permission?: string
  danger?: boolean
  disabled?: boolean | ((row: Record<string, unknown>) => boolean)
  onClick: (row: Record<string, unknown>) => void
}

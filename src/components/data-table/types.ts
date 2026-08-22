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
  /** Whether column is visible in column config panel; defaults to true */
  defaultVisible?: boolean
  /** Whether column can be hidden via config panel; defaults to true */
  configurable?: boolean
  /** Filter options for server-side filtering */
  filterOptions?: DataTableFilterOption[]
  /** Current active filter values */
  filterValue?: unknown
}

export interface DataTableFilterOption {
  label: string
  value: string | number | boolean
}

export interface DataTableFilterState {
  columnKey: string
  value: unknown
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

/** Persisted column configuration for a single column */
export interface ColumnConfigItem {
  key: string
  visible: boolean
  order: number
}

/** Server-side request parameters emitted for remote data loading */
export interface ServerSideParams {
  sort?: DataTableSortState
  filters?: DataTableFilterState[]
  pagination?: { page: number; pageSize: number }
}

export type DataTableExportScope = 'all' | 'selected'

export interface DataTableExportPayload<T = Record<string, unknown>> {
  scope: DataTableExportScope
  rows: T[]
  selectedKeys: DataTableRowKey[]
  columns: DataTableColumn<T>[]
}

export interface DataTableBatchPayload<T = Record<string, unknown>> {
  selectedKeys: DataTableRowKey[]
  selectedRows: T[]
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
  selectable?: boolean
  checkedRowKeys?: DataTableRowKey[]
  defaultSort?: DataTableSortState
  emptyText?: string
  /** Whether table pagination/filtering/sorting works in remote mode */
  remote?: boolean
  /** Enable column visibility/order configuration panel */
  columnConfigurable?: boolean
  /** localStorage key for persisting column configuration */
  columnStorageKey?: string
  /** Enable built-in client-side export actions */
  exportable?: boolean
  /** Data source used by built-in export-all; defaults to current table data */
  exportData?: T[]
  /** Enable built-in selected row export action */
  exportSelected?: boolean
  /** Enable built-in batch delete action */
  batchDeletable?: boolean
  /** Filename used by the built-in CSV exporter */
  exportFileName?: string
  /** Optional export adapter; defaults to client-side CSV download */
  exportHandler?: (payload: DataTableExportPayload<T>) => void | Promise<void>
  /** Optional batch delete adapter; defaults to emitting only */
  batchDeleteHandler?: (payload: DataTableBatchPayload<T>) => void | Promise<void>
}

export interface DataTableEmits<T = Record<string, unknown>> {
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
  'update:checkedRowKeys': [keys: DataTableRowKey[]]
  'update:sort': [sort: DataTableSortState]
  'update:filters': [filters: DataTableFilterState[]]
  'server-params-change': [params: ServerSideParams]
  rowClick: [row: T, index: number]
  export: [payload: DataTableExportPayload<T>]
  batchDelete: [payload: DataTableBatchPayload<T>]
  batchAction: [key: string, selectedKeys: DataTableRowKey[], selectedRows: T[]]
}

export interface DataTableSlots<T = Record<string, unknown>> {
  empty?: () => VNode
  loading?: () => VNode
  headerCell?: (params: { column: DataTableColumn<T> }) => VNode
  bodyCell?: (params: { column: DataTableColumn<T>; row: T; index: number }) => VNode
  toolbar?: () => VNode
  summary?: () => VNode
  /** Shown when rows are selected, receives selected count */
  batchToolbar?: (params: { selectedCount: number; selectedKeys: DataTableRowKey[] }) => VNode
}

export interface DataTableExpose {
  clearSelection: () => void
  clearSort: () => void
  scrollTo: (options: { top?: number; left?: number }) => void
  /** Get current column configuration */
  getColumnConfig: () => ColumnConfigItem[]
  /** Set column configuration (triggers re-render and persistence) */
  setColumnConfig: (config: ColumnConfigItem[]) => void
  /** Reset column configuration to defaults */
  resetColumnConfig: () => void
}

export type DataTableAction = Component & {
  label: string
  icon?: string
  permission?: string
  danger?: boolean
  disabled?: boolean | ((row: Record<string, unknown>) => boolean)
  onClick: (row: Record<string, unknown>) => void
}

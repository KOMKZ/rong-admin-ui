export type DataGridColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'year'
  | 'select'
  | 'multiselect'
  | 'boolean'

export interface DataGridColumn {
  field: string
  headerName: string
  type?: DataGridColumnType
  width?: number
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
  options?: string[]
}

export interface DataGridLocale {
  noRowsToShow?: string
  loading?: string
  addRow?: string
  deleteRow?: string
  addColumn?: string
  deleteColumn?: string
  export?: string
  search?: string
  filter?: string
}

export interface RDataGridProps {
  columns: DataGridColumn[]
  rows: Record<string, unknown>[]
  height?: string | number
  readonly?: boolean
  hideToolbar?: boolean
  allowAddColumn?: boolean
  allowAddRow?: boolean
  allowDelete?: boolean
  allowExport?: boolean
  allowColumnDrag?: boolean
  allowRowDrag?: boolean
  storageKey?: string
  locale?: DataGridLocale
}

export interface RDataGridEmits {
  (e: 'update:rows', rows: Record<string, unknown>[]): void
  (e: 'update:columns', columns: DataGridColumn[]): void
  (e: 'cellChange', params: { rowIndex: number; field: string; value: unknown }): void
  (e: 'rowAdd', row: Record<string, unknown>): void
  (e: 'rowDelete', rows: Record<string, unknown>[]): void
  (e: 'columnAdd', column: DataGridColumn): void
  (e: 'columnDelete', column: DataGridColumn): void
  (e: 'save', data: { columns: DataGridColumn[]; rows: Record<string, unknown>[] }): void
}

export const DEFAULT_LOCALE: DataGridLocale = {
  noRowsToShow: '暂无数据',
  loading: '加载中...',
  addRow: '新增行',
  deleteRow: '删除',
  addColumn: '新增列',
  deleteColumn: '删除列',
  export: '导出 CSV',
  search: '搜索...',
  filter: '过滤',
}

import type { DataTableColumn, DataTableRowKey, DataTableSortState } from '../data-table/types'
import type { FormFieldSchema } from '../form-renderer/types'

export interface QueryTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[]
  querySchema?: FormFieldSchema[]
  fetchData: (params: QueryTableFetchParams) => Promise<QueryTableFetchResult<T>>
  rowKey?: string | ((row: T) => DataTableRowKey)
  selectable?: boolean
  defaultPageSize?: number
  pageSizes?: number[]
  autoLoad?: boolean
  bordered?: boolean
  striped?: boolean
}

export interface QueryTableFetchParams {
  page: number
  pageSize: number
  query: Record<string, unknown>
  sort?: DataTableSortState
}

export interface QueryTableFetchResult<T = Record<string, unknown>> {
  data: T[]
  total: number
}

export interface QueryTableExpose {
  reload: () => Promise<void>
  resetQuery: () => void
  getCheckedKeys: () => DataTableRowKey[]
  clearSelection: () => void
}

import type { VNode } from 'vue'
import type { FormFieldSchema } from '../form-renderer/types'

export interface FormTableColumn {
  key: string
  title: string
  width?: number | string
  schema: FormFieldSchema
}

export interface FormTableRow {
  _key: string
  [field: string]: unknown
}

export interface FormTableProps {
  columns: FormTableColumn[]
  modelValue: FormTableRow[]
  maxRows?: number
  minRows?: number
  addable?: boolean
  removable?: boolean
  sortable?: boolean
  addLabel?: string
  emptyText?: string
  rowKey?: string
  disabled?: boolean
  showIndex?: boolean
  size?: 'small' | 'medium' | 'large'
}

export interface FormTableEmits {
  'update:modelValue': [rows: FormTableRow[]]
  add: []
  remove: [index: number, row: FormTableRow]
  validate: [results: FormTableValidateResult[]]
}

export interface FormTableValidateResult {
  rowIndex: number
  field: string
  valid: boolean
  message?: string
}

export interface FormTableSlots {
  header?: () => VNode
  footer?: () => VNode
  actions?: (params: { row: FormTableRow; index: number }) => VNode
}

export interface FormTableExpose {
  validate: () => Promise<FormTableValidateResult[]>
  addRow: (defaults?: Record<string, unknown>) => void
  removeRow: (index: number) => void
  getRows: () => FormTableRow[]
  clearAll: () => void
  resetRow: (index: number) => void
}

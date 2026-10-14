import type { VNode } from 'vue'

/** 可编辑单元格类型（中立协议；不含任何业务字段）。 */
export type EditableCellType = 'text' | 'textarea' | 'select'

/** select 单元格候选项。 */
export interface EditableCellOption {
  label: string
  value: string | number
}

/** 列定义：表格工作台按列声明可编辑协议。 */
export interface EditableTableColumn {
  /** 行对象上的字段名。 */
  field: string
  title: string
  type?: EditableCellType
  width?: number
  minWidth?: number
  options?: EditableCellOption[]
  maxlength?: number
  placeholder?: string
  /** false = 只读列（如来源、更新时间）。 */
  editable?: boolean
}

/** 单元格级错误（映射回 rowKey+field）。 */
export interface CellError {
  rowKey: string
  field: string
  message: string
}

/** TSV 粘贴锚点：起始行索引 + 目标字段序列。 */
export interface TsvPasteAnchor {
  rowIndex: number
  fields: string[]
  maxRows?: number
}

/** TSV 粘贴结果：逐格更新与越界报告。 */
export interface TsvPasteResult {
  updates: { rowIndex: number; field: string; value: string }[]
  /** 越界行数（超出 anchor.maxRows 或可用行数的截断量；0 = 无截断）。 */
  overflowRows: number
  /** 被丢弃的多余列数（目标字段序列之外的列）。 */
  overflowCols: number
}

/** 行编辑状态暴露（脏行集合与还原）。 */
export interface EditableRowsExpose<T extends Record<string, unknown>> {
  rows: T[]
  dirtyRowKeys: string[]
  hasDirty: boolean
  isDirty: (key: string) => boolean
  setCellValue: (key: string, field: string, value: unknown) => void
  addBlankRow: (factory: () => T) => T
  duplicateRow: (key: string, override?: Partial<T>) => T | null
  removeRows: (keys: string[]) => void
  revertRow: (key: string) => void
  markClean: (keys?: string[]) => void
  setRows: (rows: T[]) => void
}

/** 单元格组件 props 协议。 */
export interface REditableCellProps {
  value: string
  type?: EditableCellType
  options?: EditableCellOption[]
  maxlength?: number
  placeholder?: string
  error?: string
  disabled?: boolean
}

/** 单元格组件事件协议。 */
export interface REditableCellEmits {
  commit: [value: string]
  cancel: []
}

/** 单元格组件插槽协议。 */
export interface REditableCellSlots {
  view?: (params: { value: string; error?: string }) => VNode
}

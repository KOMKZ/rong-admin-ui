/**
 * editable-table 公共导出（ticket 000608 P1-07）：
 * 表格工作台通用原语 —— 行编辑状态（脏行/复制/还原）、TSV 多行多列粘贴、
 * 单元格错误映射、可编辑单元格组件。中立协议，不含业务字段。
 * 消费方：hrise-admin-web 的文案库与创作路线工作台。
 */
export { default as REditableCell } from './REditableCell.vue'
export { useEditableRows } from './editable_row_state'
export { parseTsvMatrix, buildTsvPastePlan } from './tsv_clipboard'
export { useCellErrorMap } from './cell_error_map'
export type {
  EditableCellType,
  EditableCellOption,
  EditableTableColumn,
  CellError,
  TsvPasteAnchor,
  TsvPasteResult,
  EditableRowsExpose,
  REditableCellProps,
  REditableCellEmits,
  REditableCellSlots,
} from './types'

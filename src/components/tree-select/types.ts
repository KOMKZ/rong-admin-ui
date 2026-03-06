import type { VNode } from 'vue'

export interface TreeSelectNode {
  id: string | number
  label: string
  parentId: string | number | null
  children?: TreeSelectNode[]
  disabled?: boolean
  icon?: string
  /** Extra data passthrough for consumers */
  [key: string]: unknown
}

export type TreeSelectSize = 'small' | 'medium' | 'large'

export interface TreeSelectI18n {
  placeholder?: string
  search?: string
  noData?: string
  loading?: string
  clear?: string
}

export const DEFAULT_TREE_SELECT_I18N: TreeSelectI18n = {
  placeholder: 'Please select',
  search: 'Search...',
  noData: 'No data',
  loading: 'Loading...',
  clear: 'Clear',
}

export type TreeSelectLoadFn = () => Promise<TreeSelectNode[]>

export interface RTreeSelectProps {
  modelValue: string | number | null
  options?: TreeSelectNode[]
  loadData?: TreeSelectLoadFn
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  size?: TreeSelectSize
  searchable?: boolean
  defaultExpandLevel?: number
  maxHeight?: number | string
  i18n?: TreeSelectI18n
}

export interface RTreeSelectEmits {
  'update:modelValue': [value: string | number | null]
  select: [node: TreeSelectNode | null]
  clear: []
}

export interface RTreeSelectExpose {
  reload: () => Promise<void>
  open: () => void
  close: () => void
  getSelectedNode: () => TreeSelectNode | null
}

export interface RTreeSelectSlots {
  'node-label'?: (params: { node: TreeSelectNode; depth: number }) => VNode
  'node-icon'?: (params: { node: TreeSelectNode; expanded: boolean }) => VNode
  trigger?: (params: { selectedNode: TreeSelectNode | null; open: boolean }) => VNode
  empty?: () => VNode
}

import type { VNode } from 'vue'

// ─── Node Data ───

export interface TreeNodeData {
  id: string | number
  label: string
  parentId: string | number | null
  sortOrder: number
  depth: number
  itemCount?: number
  totalItemCount?: number
  icon?: string
  disabled?: boolean
  children?: TreeNodeData[]
  [key: string]: unknown
}

// ─── Density / Mode ───

export type TreeDensity = 'compact' | 'default' | 'comfortable'

export type TreeRequestMode = 'auto' | 'manual'

// ─── Node States ───

export type TreeNodeState =
  | 'default'
  | 'hover'
  | 'selected'
  | 'focused'
  | 'editing'
  | 'dragging'
  | 'drop-target'
  | 'drop-target-invalid'
  | 'disabled'
  | 'error'

// ─── Error Codes (mapped from domain) ───

export type TreeErrorCode =
  | 'DUPLICATE_NAME'
  | 'INVALID_NAME'
  | 'PARENT_NOT_FOUND'
  | 'CIRCULAR_REFERENCE'
  | 'MAX_DEPTH_EXCEEDED'
  | 'HAS_CHILDREN'
  | 'FOLDER_HAS_ARTICLES'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export interface TreeError {
  code: TreeErrorCode
  message: string
  nodeId?: string | number
  raw?: unknown
}

// ─── Request Hooks ───

export interface TreeRequestHooks {
  loadTree?: () => Promise<TreeNodeData[]>
  loadChildren?: (parentId: string | number) => Promise<TreeNodeData[]>
  create?: (params: { parentId: string | number | null; name: string }) => Promise<TreeNodeData>
  update?: (params: { id: string | number; name: string }) => Promise<TreeNodeData>
  delete?: (id: string | number) => Promise<void>
  move?: (params: { id: string | number; newParentId: string | number | null }) => Promise<void>
  reorder?: (params: { id: string | number; newOrder: number }) => Promise<void>
}

// ─── Delete Constraint ───

export interface DeleteConstraint {
  canDelete: boolean
  reason?: string
  childCount?: number
  articleCount?: number
}

export type CheckDeleteFn = (id: string | number) => Promise<DeleteConstraint>

// ─── Event Payloads ───

export interface TreeRequestEvent {
  action: string
  nodeId?: string | number
}

export interface TreeDataChangeEvent {
  type: 'create' | 'update' | 'delete' | 'move' | 'reorder'
  node?: TreeNodeData
  nodes: TreeNodeData[]
}

// ─── Node Icon Config ───

export interface TreeNodeIcons {
  folder?: string
  folderOpen?: string
  leaf?: string
  loading?: string
  locked?: string
}

// ─── Batch Operations ───

export interface TreeBatchConfig {
  enableMove?: boolean
  enableDelete?: boolean
}

// ─── i18n ───

export interface TreeI18n {
  search?: string
  expandAll?: string
  collapseAll?: string
  refresh?: string
  newFolder?: string
  newSubFolder?: string
  rename?: string
  delete?: string
  move?: string
  confirmDelete?: string
  confirmDeleteWithChildren?: string
  confirmDeleteWithArticles?: string
  cancel?: string
  confirm?: string
  noData?: string
  loading?: string
  retry?: string
  errorDefault?: string
  duplicateName?: string
  invalidName?: string
  maxDepthExceeded?: string
  batchSelect?: string
  batchMove?: string
  batchDelete?: string
  selected?: string
  items?: string
  deleteSuccess?: string
}

export const DEFAULT_I18N: TreeI18n = {
  search: 'Search...',
  expandAll: 'Expand All',
  collapseAll: 'Collapse All',
  refresh: 'Refresh',
  newFolder: 'New Folder',
  newSubFolder: 'New Subfolder',
  rename: 'Rename',
  delete: 'Delete',
  move: 'Move',
  confirmDelete: 'Are you sure you want to delete this folder?',
  confirmDeleteWithChildren: 'This folder has {count} subfolders. Please remove them first.',
  confirmDeleteWithArticles: 'This folder contains {count} articles. Please move them first.',
  cancel: 'Cancel',
  confirm: 'Confirm',
  noData: 'No folders',
  loading: 'Loading...',
  retry: 'Retry',
  errorDefault: 'Operation failed',
  duplicateName: 'A folder with this name already exists',
  invalidName: 'Invalid folder name',
  maxDepthExceeded: 'Maximum folder depth exceeded',
  batchSelect: 'Select',
  batchMove: 'Move Selected',
  batchDelete: 'Delete Selected',
  selected: '{count} selected',
  items: '{count} items',
  deleteSuccess: 'Deleted successfully',
}

// ─── Props ───

export interface ProTreeEditorProps {
  data?: TreeNodeData[]
  defaultExpandLevel?: number
  density?: TreeDensity
  requestMode?: TreeRequestMode
  requestHooks?: TreeRequestHooks
  checkDelete?: CheckDeleteFn
  selectable?: boolean
  checkedKeys?: (string | number)[]
  selectedKey?: string | number | null
  optimistic?: boolean
  draggable?: boolean
  maxDepth?: number
  showCounts?: boolean
  showBreadcrumb?: boolean
  icons?: TreeNodeIcons
  i18n?: TreeI18n
  batch?: TreeBatchConfig | false
  lazyLoad?: boolean
}

// ─── Emits ───

export interface ProTreeEditorEmits {
  'update:checkedKeys': [keys: (string | number)[]]
  'update:selectedKey': [key: string | number | null]
  select: [node: TreeNodeData]
  requestStart: [event: TreeRequestEvent]
  requestSuccess: [event: TreeRequestEvent]
  requestError: [event: TreeRequestEvent, error: TreeError]
  dataChange: [event: TreeDataChangeEvent]
}

// ─── Expose ───

export interface ProTreeEditorExpose {
  reload: () => Promise<void>
  refreshNode: (id: string | number) => Promise<void>
  expandAll: () => void
  collapseAll: () => void
  createNode: (parentId?: string | number | null) => void
  renameNode: (id: string | number) => void
  deleteNode: (id: string | number) => Promise<void>
  moveNode: (id: string | number, newParentId: string | number | null) => Promise<void>
  setKeyword: (keyword: string) => void
  getTreeData: () => TreeNodeData[]
}

// ─── Slots ───

export interface ProTreeEditorSlots {
  toolbar?: () => VNode
  'toolbar-extra'?: () => VNode
  'node-icon'?: (params: { node: TreeNodeData; expanded: boolean }) => VNode
  'node-label'?: (params: { node: TreeNodeData }) => VNode
  'node-extra'?: (params: { node: TreeNodeData }) => VNode
  'node-actions'?: (params: { node: TreeNodeData }) => VNode
  empty?: () => VNode
  loading?: () => VNode
}

// ─── Drop Position ───

export type DropPosition = 'before' | 'inside' | 'after'

export interface DropInfo {
  dragNodeId: string | number
  targetNodeId: string | number
  position: DropPosition
  isLegal: boolean
  reason?: TreeErrorCode
}

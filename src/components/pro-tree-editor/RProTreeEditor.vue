<script lang="ts" setup>
import { ref, computed, toRef, onMounted, watch, type PropType } from 'vue'
import { NEmpty, NButton, useDialog, useMessage } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import RTreeToolbar from './RTreeToolbar.vue'
import RTreeNode from './RTreeNode.vue'
import RTreeContextMenu from './RTreeContextMenu.vue'
import { useTreeData } from './composables/useTreeData'
import { useTreeSearch } from './composables/useTreeSearch'
import { useTreeDnd } from './composables/useTreeDnd'
import { useTreeKeyboard } from './composables/useTreeKeyboard'
import type {
  TreeNodeData,
  TreeDensity,
  TreeRequestMode,
  TreeRequestHooks,
  TreeNodeIcons,
  TreeI18n,
  TreeBatchConfig,
  TreeError,
  TreeRequestEvent,
  TreeDataChangeEvent,
  ProTreeEditorExpose,
  CheckDeleteFn,
  DropInfo,
} from './types'
import { DEFAULT_I18N } from './types'

const props = defineProps({
  data: { type: Array as PropType<TreeNodeData[]>, default: () => [] },
  defaultExpandLevel: { type: Number, default: 1 },
  density: { type: String as PropType<TreeDensity>, default: 'default' },
  requestMode: { type: String as PropType<TreeRequestMode>, default: 'auto' },
  requestHooks: { type: Object as PropType<TreeRequestHooks>, default: () => ({}) },
  checkDelete: { type: Function as PropType<CheckDeleteFn>, default: undefined },
  selectable: { type: Boolean, default: false },
  checkedKeys: { type: Array as PropType<(string | number)[]>, default: () => [] },
  selectedKey: { type: [String, Number] as PropType<string | number | null>, default: null },
  optimistic: { type: Boolean, default: true },
  draggable: { type: Boolean, default: true },
  maxDepth: { type: Number, default: 10 },
  showCounts: { type: Boolean, default: false },
  showBreadcrumb: { type: Boolean, default: false },
  icons: { type: Object as PropType<TreeNodeIcons>, default: () => ({}) },
  i18n: { type: Object as PropType<TreeI18n>, default: () => ({}) },
  batch: { type: [Object, Boolean] as PropType<TreeBatchConfig | false>, default: false },
  lazyLoad: { type: Boolean, default: false },
})

const emit = defineEmits<{
  'update:checkedKeys': [keys: (string | number)[]]
  'update:selectedKey': [key: string | number | null]
  select: [node: TreeNodeData]
  requestStart: [event: TreeRequestEvent]
  requestSuccess: [event: TreeRequestEvent]
  requestError: [event: TreeRequestEvent, error: TreeError]
  dataChange: [event: TreeDataChangeEvent]
}>()

const dialog = useDialog()
const message = useMessage()

const t = computed(() => ({ ...DEFAULT_I18N, ...props.i18n }))

const localSelectedKey = ref<string | number | null>(props.selectedKey)
const localCheckedKeys = ref<(string | number)[]>([...props.checkedKeys])
const batchMode = ref(false)
const treeContainerRef = ref<HTMLElement | null>(null)

watch(() => props.selectedKey, (v) => { localSelectedKey.value = v })
watch(() => props.checkedKeys, (v) => { localCheckedKeys.value = [...v] })

const treeOps = useTreeData({
  requestMode: toRef(props, 'requestMode'),
  requestHooks: toRef(props, 'requestHooks'),
  optimistic: toRef(props, 'optimistic'),
  lazyLoad: toRef(props, 'lazyLoad'),
  defaultExpandLevel: toRef(props, 'defaultExpandLevel'),
  checkDelete: toRef(props, 'checkDelete'),
  onRequestStart: (e) => emit('requestStart', e),
  onRequestSuccess: (e) => emit('requestSuccess', e),
  onRequestError: (e, err) => {
    emit('requestError', e, err)
    message.error(err.message || t.value.errorDefault || '')
  },
  onDataChange: (e) => emit('dataChange', e),
})

const search = useTreeSearch({
  treeData: treeOps.treeData,
  expandedKeys: treeOps.expandedKeys,
})

const dnd = useTreeDnd({
  treeData: treeOps.treeData,
  maxDepth: toRef(props, 'maxDepth'),
  draggable: toRef(props, 'draggable'),
  findNode: treeOps.findNode,
  isDescendantOf: treeOps.isDescendantOf,
  onDrop: handleDrop,
})

const keyboard = useTreeKeyboard({
  flatNodes: treeOps.flatNodes,
  expandedKeys: treeOps.expandedKeys,
  selectedKey: localSelectedKey,
  editingNodeId: treeOps.editingNodeId,
  visibleNodeIds: search.visibleNodeIds,
  onSelect: selectNode,
  onToggleExpand: (id) => treeOps.toggleExpand(id),
  onStartEditing: (id) => treeOps.startEditing(id),
  onCancelEditing: () => treeOps.cancelEditing(),
})

// ─── Context Menu ───

const ctxShow = ref(false)
const ctxX = ref(0)
const ctxY = ref(0)
const ctxNode = ref<TreeNodeData | null>(null)

function showContextMenu(event: MouseEvent, node: TreeNodeData): void {
  ctxX.value = event.clientX
  ctxY.value = event.clientY
  ctxNode.value = node
  ctxShow.value = true
}

function handleContextAction(key: string, node: TreeNodeData): void {
  switch (key) {
    case 'createChild':
      startCreateChild(node.id)
      break
    case 'createSibling':
      startCreateSibling(node)
      break
    case 'rename':
      treeOps.startEditing(node.id)
      break
    case 'delete':
      confirmDelete(node)
      break
    case 'move':
      break
  }
}

// ─── Node Operations ───

function selectNode(id: string | number): void {
  localSelectedKey.value = id
  emit('update:selectedKey', id)
  const node = treeOps.findNode(id)
  if (node) emit('select', node)
}

function handleNodeCheck(nodeId: string | number, checked: boolean): void {
  if (checked) {
    localCheckedKeys.value = [...localCheckedKeys.value, nodeId]
  } else {
    localCheckedKeys.value = localCheckedKeys.value.filter((k) => k !== nodeId)
  }
  emit('update:checkedKeys', localCheckedKeys.value)
}

// ─── Create ───

const pendingCreateParentId = ref<string | number | null>(null)

function startCreateChild(parentId: string | number): void {
  treeOps.expandedKeys.value.add(parentId)
  pendingCreateParentId.value = parentId
  const tempId = `__new_${Date.now()}`
  const parent = treeOps.findNode(parentId)
  if (!parent) return
  if (!parent.children) parent.children = []
  parent.children.push({
    id: tempId,
    label: '',
    parentId,
    sortOrder: 999,
    depth: parent.depth + 1,
  })
  treeOps.startEditing(tempId)
}

function startCreateSibling(node: TreeNodeData): void {
  pendingCreateParentId.value = node.parentId
  const siblings = node.parentId === null
    ? treeOps.treeData.value
    : treeOps.findNode(node.parentId)?.children
  if (!siblings) return
  const tempId = `__new_${Date.now()}`
  siblings.push({
    id: tempId,
    label: '',
    parentId: node.parentId,
    sortOrder: 999,
    depth: node.depth,
  })
  treeOps.startEditing(tempId)
}

function startCreateRoot(): void {
  pendingCreateParentId.value = null
  const tempId = `__new_${Date.now()}`
  treeOps.treeData.value.push({
    id: tempId,
    label: '',
    parentId: null,
    sortOrder: 999,
    depth: 0,
  })
  treeOps.startEditing(tempId)
}

async function handleEditSubmit(nodeId: string | number, name: string): Promise<void> {
  const isNew = String(nodeId).startsWith('__new_')
  try {
    if (isNew) {
      removeTempNode(nodeId)
      await treeOps.createNode(pendingCreateParentId.value, name)
      pendingCreateParentId.value = null
    } else {
      await treeOps.updateNode(nodeId, name)
    }
  } catch (err) {
    const treeError = err as TreeError
    if (treeError.code === 'DUPLICATE_NAME') {
      message.warning(t.value.duplicateName || '')
    } else if (treeError.code === 'INVALID_NAME') {
      message.warning(t.value.invalidName || '')
    }
  }
}

function handleEditCancel(nodeId: string | number): void {
  if (String(nodeId).startsWith('__new_')) {
    removeTempNode(nodeId)
    pendingCreateParentId.value = null
  }
  treeOps.cancelEditing()
}

function removeTempNode(id: string | number): void {
  const walk = (nodes: TreeNodeData[]): boolean => {
    const idx = nodes.findIndex((n) => n.id === id)
    if (idx >= 0) { nodes.splice(idx, 1); return true }
    for (const n of nodes) {
      if (n.children && walk(n.children)) return true
    }
    return false
  }
  walk(treeOps.treeData.value)
  treeOps.cancelEditing()
}

// ─── Delete ───

function confirmDelete(node: TreeNodeData): void {
  const hasChildren = node.children && node.children.length > 0
  const childCount = node.children?.length ?? 0
  const articleCount = node.totalItemCount ?? 0

  let content = t.value.confirmDelete || ''
  if (hasChildren) {
    content = (t.value.confirmDeleteWithChildren || '').replace('{count}', String(childCount))
  } else if (articleCount > 0) {
    content = (t.value.confirmDeleteWithArticles || '').replace('{count}', String(articleCount))
  }

  dialog.warning({
    title: t.value.delete,
    content,
    positiveText: t.value.confirm,
    negativeText: t.value.cancel,
    onPositiveClick: async () => {
      try {
        await treeOps.deleteNode(node.id)
        message.success(t.value.deleteSuccess || '')
      } catch {
        // error already handled by onRequestError
      }
    },
  })
}

// ─── Drop ───

async function handleDrop(info: DropInfo): Promise<void> {
  const { dragNodeId, targetNodeId, position } = info
  let newParentId: string | number | null

  if (position === 'inside') {
    newParentId = targetNodeId
  } else {
    const target = treeOps.findNode(targetNodeId)
    newParentId = target?.parentId ?? null
  }

  try {
    await treeOps.moveNode(dragNodeId, newParentId)
  } catch {
    // error already handled
  }
}

// ─── Batch ───

function toggleBatchMode(): void {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    localCheckedKeys.value = []
    emit('update:checkedKeys', [])
  }
}

// ─── Recursive Render ───

function renderNodes(nodes: TreeNodeData[]): TreeNodeData[] {
  return nodes.filter((n) => search.isNodeVisible(n.id))
}

// ─── Expose ───

const expose: ProTreeEditorExpose = {
  reload: treeOps.loadTree,
  refreshNode: treeOps.refreshNode,
  expandAll: treeOps.expandAll,
  collapseAll: treeOps.collapseAll,
  createNode: (parentId?: string | number | null) => {
    if (parentId) startCreateChild(parentId)
    else startCreateRoot()
  },
  renameNode: (id: string | number) => treeOps.startEditing(id),
  deleteNode: async (id: string | number) => {
    const node = treeOps.findNode(id)
    if (node) confirmDelete(node)
  },
  moveNode: treeOps.moveNode,
  setKeyword: search.setKeyword,
  getTreeData: () => treeOps.treeData.value,
}
defineExpose(expose)

// ─── Lifecycle ───

onMounted(() => {
  if (props.requestMode === 'auto' && props.requestHooks?.loadTree) {
    treeOps.loadTree()
  } else if (props.data?.length) {
    treeOps.treeData.value = props.data
  }
})

watch(
  () => props.data,
  (newData) => {
    if (newData?.length && !props.requestHooks?.loadTree) {
      treeOps.treeData.value = newData
    }
  },
  { deep: true },
)
</script>

<template>
  <div
    ref="treeContainerRef"
    class="rpte"
    :class="[`rpte--${density}`]"
    data-testid="pro-tree-editor"
    tabindex="0"
    role="tree"
    aria-label="Tree Editor"
    @keydown="keyboard.handleKeyDown"
  >
    <!-- Toolbar -->
    <slot name="toolbar">
      <RTreeToolbar
        :i18n="i18n"
        :loading="treeOps.loading.value"
        :keyword="search.keyword.value"
        :selectable="selectable"
        :batch="batch"
        :checked-count="localCheckedKeys.length"
        :batch-mode="batchMode"
        @update:keyword="search.setKeyword"
        @expand-all="treeOps.expandAll"
        @collapse-all="treeOps.collapseAll"
        @refresh="treeOps.loadTree"
        @create="startCreateRoot"
        @toggle-batch-mode="toggleBatchMode"
      >
        <template #toolbar-extra>
          <slot name="toolbar-extra" />
        </template>
      </RTreeToolbar>
    </slot>

    <!-- Loading -->
    <div
      v-if="treeOps.loading.value && treeOps.treeData.value.length === 0"
      class="rpte__loading"
      data-testid="tree-loading"
    >
      <slot name="loading">
        <RIcon name="loader" :size="24" class="rpte__spinner" />
        <span class="rpte__loading-text">{{ t.loading }}</span>
      </slot>
    </div>

    <!-- Error State -->
    <div
      v-else-if="treeOps.errorState.value && treeOps.treeData.value.length === 0"
      class="rpte__error"
      data-testid="tree-error"
    >
      <RIcon name="alert-triangle" :size="32" class="rpte__error-icon" />
      <span class="rpte__error-message">{{ treeOps.errorState.value.message }}</span>
      <NButton
        size="small"
        type="primary"
        data-testid="tree-retry-btn"
        @click="treeOps.loadTree"
      >
        <template #icon><RIcon name="refresh-cw" :size="14" /></template>
        {{ t.retry }}
      </NButton>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="treeOps.treeData.value.length === 0"
      class="rpte__empty"
      data-testid="tree-empty"
    >
      <slot name="empty">
        <NEmpty :description="t.noData">
          <template #extra>
            <NButton
              size="small"
              type="primary"
              @click="startCreateRoot"
            >
              <template #icon><RIcon name="plus" :size="14" /></template>
              {{ t.newFolder }}
            </NButton>
          </template>
        </NEmpty>
      </slot>
    </div>

    <!-- Tree Content -->
    <!-- eslint-disable vue/no-template-shadow -->
    <div v-else class="rpte__tree" role="group" data-testid="tree-content">
      <template v-for="node in renderNodes(treeOps.treeData.value)" :key="node.id">
        <RTreeNodeRecursive
          :node="node"
          :depth="0"
          :density="density"
          :icons="icons"
          :i18n="i18n"
          :show-counts="showCounts"
          :draggable="draggable"
          :selectable="selectable"
          :batch-mode="batchMode"
          :selected-key="localSelectedKey"
          :checked-keys="localCheckedKeys"
          :expanded-keys="treeOps.expandedKeys.value"
          :editing-node-id="treeOps.editingNodeId.value"
          :loading-node-ids="treeOps.loadingNodeIds.value"
          :operation-errors="treeOps.operationErrors.value"
          :drag-node-id="dnd.dragNodeId.value"
          :search-ops="search"
          :dnd-ops="dnd"
          @select="selectNode"
          @toggle="treeOps.toggleExpand"
          @start-edit="treeOps.startEditing"
          @submit-edit="handleEditSubmit"
          @cancel-edit="handleEditCancel"
          @delete="(n: TreeNodeData) => confirmDelete(n)"
          @check="handleNodeCheck"
          @contextmenu="showContextMenu"
          @dragstart="dnd.onDragStart"
          @dragover="dnd.onDragOver"
          @dragend="dnd.onDragEnd"
          @clear-error="treeOps.clearError"
        />
      </template>
    </div>

    <!-- Context Menu -->
    <RTreeContextMenu
      v-model:show="ctxShow"
      :x="ctxX"
      :y="ctxY"
      :node="ctxNode"
      :i18n="i18n"
      :draggable="draggable"
      @action="handleContextAction"
    />
  </div>
</template>

<!-- eslint-disable vue/one-component-per-file -->
<script lang="ts">
import { defineComponent, h, type PropType as PT } from 'vue'
import type { TreeNodeData as TND, TreeDensity as TD, TreeNodeIcons as TNI, TreeI18n as TI, TreeError as TE, DropPosition as DP } from './types'

/**
 * Recursive tree node wrapper — renders a node and its children.
 * Defined as a plain component to enable recursion in template.
 */
const RTreeNodeRecursive = defineComponent({
  name: 'RTreeNodeRecursive',
  props: {
    node: { type: Object as PT<TND>, required: true },
    depth: { type: Number, default: 0 },
    density: { type: String as PT<TD>, default: 'default' },
    icons: { type: Object as PT<TNI>, default: () => ({}) },
    i18n: { type: Object as PT<TI>, default: () => ({}) },
    showCounts: { type: Boolean, default: false },
    draggable: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    batchMode: { type: Boolean, default: false },
    selectedKey: { type: [String, Number] as PT<string | number | null>, default: null },
    checkedKeys: { type: Array as PT<(string | number)[]>, default: () => [] },
    expandedKeys: { type: Object as PT<Set<string | number>>, required: true },
    editingNodeId: { type: [String, Number] as PT<string | number | null>, default: null },
    loadingNodeIds: { type: Object as PT<Set<string | number>>, required: true },
    operationErrors: { type: Object as PT<Map<string | number, TE>>, required: true },
    dragNodeId: { type: [String, Number] as PT<string | number | null>, default: null },
    searchOps: { type: Object, required: true },
    dndOps: { type: Object, required: true },
  },
  emits: [
    'select', 'toggle', 'startEdit', 'submitEdit', 'cancelEdit',
    'delete', 'check', 'contextmenu', 'dragstart', 'dragover', 'dragend', 'clearError',
  ],
  setup(props, { emit }) {
    return () => {
      const { node, depth, expandedKeys, editingNodeId, loadingNodeIds, operationErrors, dragNodeId, searchOps, dndOps } = props
      const expanded = expandedKeys.has(node.id)
      const isEditing = editingNodeId === node.id
      const isLoading = loadingNodeIds.has(node.id)
      const isDragging = dragNodeId === node.id
      const error = operationErrors.get(node.id) || null
      const isMatch = searchOps.isMatch(node.id)
      const highlightRanges = searchOps.getHighlightRanges(node.label)
      const dropInfo = dndOps.getDropIndicator(node.id)
      const isVisible = searchOps.isNodeVisible(node.id)
      if (!isVisible) return null

      const children: ReturnType<typeof h>[] = []

      children.push(
        h(RTreeNode, {
          key: node.id,
          node,
          depth,
          expanded,
          selected: props.selectedKey === node.id,
          editing: isEditing,
          loading: isLoading,
          dragging: isDragging,
          disabled: node.disabled || false,
          density: props.density,
          icons: props.icons,
          i18n: props.i18n,
          showCounts: props.showCounts,
          draggable: props.draggable,
          selectable: props.selectable,
          checked: props.checkedKeys.includes(node.id),
          batchMode: props.batchMode,
          searchMatch: isMatch,
          highlightRanges,
          error,
          dropTarget: dropInfo.isTarget,
          dropPosition: dropInfo.position,
          dropLegal: dropInfo.legal,
          dropReason: dropInfo.reason,
          onToggle: () => emit('toggle', node.id),
          onSelect: () => emit('select', node.id),
          onStartEdit: () => emit('startEdit', node.id),
          onSubmitEdit: (name: string) => emit('submitEdit', node.id, name),
          onCancelEdit: () => emit('cancelEdit', node.id),
          onDelete: () => emit('delete', node),
          onCheck: (checked: boolean) => emit('check', node.id, checked),
          onContextmenu: (e: MouseEvent) => emit('contextmenu', e, node),
          onDragstart: () => emit('dragstart', node.id),
          onDragover: (pos: DP) => emit('dragover', node.id, pos),
          onDragend: () => emit('dragend'),
          onRetryError: () => emit('clearError', node.id),
        }),
      )

      if (expanded && node.children?.length) {
        for (const child of node.children) {
          if (!searchOps.isNodeVisible(child.id)) continue
          children.push(
            h(RTreeNodeRecursive, {
              key: child.id,
              node: child,
              depth: depth + 1,
              density: props.density,
              icons: props.icons,
              i18n: props.i18n,
              showCounts: props.showCounts,
              draggable: props.draggable,
              selectable: props.selectable,
              batchMode: props.batchMode,
              selectedKey: props.selectedKey,
              checkedKeys: props.checkedKeys,
              expandedKeys: props.expandedKeys,
              editingNodeId: props.editingNodeId,
              loadingNodeIds: props.loadingNodeIds,
              operationErrors: props.operationErrors,
              dragNodeId: props.dragNodeId,
              searchOps: props.searchOps,
              dndOps: props.dndOps,
              onSelect: (id: string | number) => emit('select', id),
              onToggle: (id: string | number) => emit('toggle', id),
              onStartEdit: (id: string | number) => emit('startEdit', id),
              onSubmitEdit: (id: string | number, name: string) => emit('submitEdit', id, name),
              onCancelEdit: (id: string | number) => emit('cancelEdit', id),
              onDelete: (n: TND) => emit('delete', n),
              onCheck: (id: string | number, checked: boolean) => emit('check', id, checked),
              onContextmenu: (e: MouseEvent, n: TND) => emit('contextmenu', e, n),
              onDragstart: (id: string | number) => emit('dragstart', id),
              onDragover: (id: string | number, pos: DP) => emit('dragover', id, pos),
              onDragend: () => emit('dragend'),
              onClearError: (id: string | number) => emit('clearError', id),
            }),
          )
        }
      }

      return children
    }
  },
})

export default { RTreeNodeRecursive }
</script>

<style scoped>
.rpte {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  padding: var(--ra-spacing-3);
  outline: none;
  min-height: 200px;
  overflow: auto;
}
.rpte:focus-within {
  border-color: var(--ra-color-border-focus);
  box-shadow: 0 0 0 2px var(--ra-color-focus-ring);
}

/* Density */
.rpte--compact { font-size: var(--ra-font-size-xs); }
.rpte--default { font-size: var(--ra-font-size-sm); }
.rpte--comfortable { font-size: var(--ra-font-size-base); }

.rpte__tree {
  display: flex;
  flex-direction: column;
}

.rpte__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-2);
  padding: var(--ra-spacing-12) 0;
}
.rpte__spinner {
  animation: rpte-main-spin 1s linear infinite;
  color: var(--ra-color-text-tertiary);
}
@keyframes rpte-main-spin {
  to { transform: rotate(360deg); }
}
.rpte__loading-text {
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-sm);
}

.rpte__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-12) 0;
}
.rpte__error-icon {
  color: var(--ra-color-danger);
}
.rpte__error-message {
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-sm);
  text-align: center;
}

.rpte__empty {
  padding: var(--ra-spacing-12) 0;
  text-align: center;
}
</style>

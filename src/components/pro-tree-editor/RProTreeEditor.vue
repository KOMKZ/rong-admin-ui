<script lang="ts" setup>
import './RProTreeEditor.css'
  import { ref, computed, toRef, onMounted, watch, type PropType } from 'vue'
  import { NEmpty, NButton, useDialog, useMessage } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import RTreeToolbar from './RTreeToolbar.vue'
  import RTreeContextMenu from './RTreeContextMenu.vue'
  import { RTreeNodeRecursive } from './RTreeNodeRecursive'
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

  watch(
    () => props.selectedKey,
    (v) => {
      localSelectedKey.value = v
    },
  )
  watch(
    () => props.checkedKeys,
    (v) => {
      localCheckedKeys.value = [...v]
    },
  )

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
  const submittingEditNodeIds = new Set<string | number>()

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
    const siblings =
      node.parentId === null ? treeOps.treeData.value : treeOps.findNode(node.parentId)?.children
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
    if (submittingEditNodeIds.has(nodeId)) return
    submittingEditNodeIds.add(nodeId)
    const isNew = String(nodeId).startsWith('__new_')
    try {
      if (isNew) {
        const parentId = pendingCreateParentId.value
        removeTempNode(nodeId)
        treeOps.cancelEditing()
        await treeOps.createNode(parentId, name)
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
    } finally {
      if (!isNew) submittingEditNodeIds.delete(nodeId)
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
      if (idx >= 0) {
        nodes.splice(idx, 1)
        return true
      }
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
void [NButton, NEmpty, RIcon, RTreeContextMenu, RTreeNodeRecursive, RTreeToolbar, dnd, handleContextAction, handleEditCancel, handleEditSubmit, handleNodeCheck, keyboard, renderNodes, showContextMenu, toggleBatchMode, treeContainerRef]
</script>

<template src="./RProTreeEditor.template.html"></template>

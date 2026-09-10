import { ref, computed, shallowRef, type Ref } from 'vue'
import type {
  TreeNodeData,
  TreeRequestHooks,
  TreeRequestMode,
  TreeError,
  TreeDataChangeEvent,
  TreeRequestEvent,
  CheckDeleteFn,
} from '../types'
import {
  findNode,
  flattenTree,
  isDescendantOf,
} from './treeDataUtils'
import { createTreeDataActions } from './treeDataActions'

export interface UseTreeDataOptions {
  requestMode: Ref<TreeRequestMode>
  requestHooks: Ref<TreeRequestHooks>
  optimistic: Ref<boolean>
  lazyLoad: Ref<boolean>
  defaultExpandLevel: Ref<number>
  checkDelete?: Ref<CheckDeleteFn | undefined>
  onRequestStart?: (event: TreeRequestEvent) => void
  onRequestSuccess?: (event: TreeRequestEvent) => void
  onRequestError?: (event: TreeRequestEvent, error: TreeError) => void
  onDataChange?: (event: TreeDataChangeEvent) => void
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTreeData(options: UseTreeDataOptions) {
  let requestIdCounter = 0
  const activeRequests = new Map<string, number>()

  function startRequest(key: string): number {
    const id = ++requestIdCounter
    activeRequests.set(key, id)
    return id
  }

  function isStaleRequest(key: string, id: number): boolean {
    return activeRequests.get(key) !== id
  }
  const treeData = ref<TreeNodeData[]>([])
  const loading = ref(false)
  const loadingNodeIds = ref<Set<string | number>>(new Set())
  const expandedKeys = ref<Set<string | number>>(new Set())
  const editingNodeId = ref<string | number | null>(null)
  const errorState = ref<TreeError | null>(null)
  const operationErrors = ref<Map<string | number, TreeError>>(new Map())
  const pendingSnapshot = shallowRef<TreeNodeData[] | null>(null)

  const flatNodes = computed(() => flattenTree(treeData.value))

  function emitRequest(
    phase: 'start' | 'success' | 'error',
    action: string,
    nodeId?: string | number,
    error?: TreeError,
  ): void {
    const event: TreeRequestEvent = { action, nodeId }
    if (phase === 'start') options.onRequestStart?.(event)
    else if (phase === 'success') options.onRequestSuccess?.(event)
    else if (error) options.onRequestError?.(event, error)
  }

  function emitDataChange(type: TreeDataChangeEvent['type'], node?: TreeNodeData): void {
    options.onDataChange?.({
      type,
      node,
      nodes: treeData.value,
    })
  }

  const { loadTree, loadChildren, createNode, updateNode, deleteNode, moveNode, reorderNode } =
    createTreeDataActions(
      options,
      {
        treeData,
        loading,
        loadingNodeIds,
        expandedKeys,
        editingNodeId,
        errorState,
        operationErrors,
        pendingSnapshot,
      },
      { startRequest, isStaleRequest, emitRequest, emitDataChange },
    )

  function toggleExpand(id: string | number): void {
    if (expandedKeys.value.has(id)) {
      expandedKeys.value.delete(id)
    } else {
      expandedKeys.value.add(id)
      if (options.lazyLoad.value) {
        const node = findNode(treeData.value, id)
        if (node && !node.children?.length) {
          loadChildren(id)
        }
      }
    }
  }

  function expandAll(): void {
    const walk = (nodes: TreeNodeData[]): void => {
      for (const n of nodes) {
        if (n.children?.length) {
          expandedKeys.value.add(n.id)
          walk(n.children)
        }
      }
    }
    walk(treeData.value)
  }

  function collapseAll(): void {
    expandedKeys.value.clear()
  }

  function startEditing(id: string | number): void {
    editingNodeId.value = id
  }

  function cancelEditing(): void {
    editingNodeId.value = null
  }

  function clearError(nodeId: string | number): void {
    operationErrors.value.delete(nodeId)
  }

  async function refreshNode(id: string | number): Promise<void> {
    await loadChildren(id)
  }

  return {
    treeData,
    flatNodes,
    loading,
    loadingNodeIds,
    expandedKeys,
    editingNodeId,
    errorState,
    operationErrors,
    loadTree,
    loadChildren,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    reorderNode,
    toggleExpand,
    expandAll,
    collapseAll,
    startEditing,
    cancelEditing,
    clearError,
    refreshNode,
    findNode: (id: string | number) => findNode(treeData.value, id),
    isDescendantOf: (nodeId: string | number, ancestorId: string | number) =>
      isDescendantOf(treeData.value, nodeId, ancestorId),
  }
}

import { ref, computed, shallowRef, type Ref } from 'vue'
import type {
  TreeNodeData,
  TreeRequestHooks,
  TreeRequestMode,
  TreeError,
  TreeErrorCode,
  TreeDataChangeEvent,
  TreeRequestEvent,
  CheckDeleteFn,
  DeleteConstraint,
} from '../types'

interface UseTreeDataOptions {
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

function cloneTree(nodes: TreeNodeData[]): TreeNodeData[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }))
}

function flattenTree(nodes: TreeNodeData[]): TreeNodeData[] {
  const result: TreeNodeData[] = []
  const walk = (items: TreeNodeData[]): void => {
    for (const n of items) {
      result.push(n)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return result
}

function findNode(
  nodes: TreeNodeData[],
  id: string | number,
): TreeNodeData | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function findParentList(
  nodes: TreeNodeData[],
  id: string | number,
): TreeNodeData[] | null {
  for (const n of nodes) {
    if (n.id === id) return nodes
    if (n.children) {
      const found = findParentList(n.children, id)
      if (found) return found
    }
  }
  return null
}

function removeNode(nodes: TreeNodeData[], id: string | number): boolean {
  const idx = nodes.findIndex((n) => n.id === id)
  if (idx >= 0) {
    nodes.splice(idx, 1)
    return true
  }
  for (const n of nodes) {
    if (n.children && removeNode(n.children, id)) return true
  }
  return false
}

function isDescendantOf(
  nodes: TreeNodeData[],
  nodeId: string | number,
  ancestorId: string | number,
): boolean {
  const ancestor = findNode(nodes, ancestorId)
  if (!ancestor?.children) return false
  return !!findNode(ancestor.children, nodeId)
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

  function emitRequest(phase: 'start' | 'success' | 'error', action: string, nodeId?: string | number, error?: TreeError): void {
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

  function extractErrorMessage(err: unknown): string {
    if (err === null || err === undefined) {
      return '未知错误'
    }

    if (typeof err === 'string') {
      return err || '未知错误'
    }

    if (err instanceof Error) {
      return err.message || '未知错误'
    }

    if (typeof err === 'object') {
      const e = err as Record<string, unknown>
      if (e.responseBody && typeof e.responseBody === 'object') {
        const rb = e.responseBody as Record<string, unknown>
        if (typeof rb.msg === 'string' && rb.msg) return rb.msg
        if (typeof rb.message === 'string' && rb.message) return rb.message
        if (typeof rb.error === 'string' && rb.error) return rb.error
      }
      if (typeof e.message === 'string' && e.message) return e.message
      if (typeof e.msg === 'string' && e.msg) return e.msg
      if (typeof e.error === 'string' && e.error) return e.error
    }

    return '未知错误'
  }

  function parseError(err: unknown): TreeError {
    const msg = extractErrorMessage(err)
    const codeMap: Record<string, TreeErrorCode> = {
      'folder name already exists': 'DUPLICATE_NAME',
      'invalid folder name': 'INVALID_NAME',
      'parent folder not found': 'PARENT_NOT_FOUND',
      'cannot move folder to its own descendant': 'CIRCULAR_REFERENCE',
      'max folder depth exceeded': 'MAX_DEPTH_EXCEEDED',
      'cannot delete folder with children': 'HAS_CHILDREN',
      'folder has articles': 'FOLDER_HAS_ARTICLES',
      'folder not found': 'NOT_FOUND',
    }
    let code: TreeErrorCode = 'UNKNOWN'
    for (const [pattern, c] of Object.entries(codeMap)) {
      if (msg.toLowerCase().includes(pattern.toLowerCase())) {
        code = c
        break
      }
    }
    if (code === 'UNKNOWN' && (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch'))) {
      code = 'NETWORK_ERROR'
    }
    return { code, message: msg, raw: err }
  }

  function initExpansion(nodes: TreeNodeData[], level: number, current = 0): void {
    for (const node of nodes) {
      if (current < level) {
        expandedKeys.value.add(node.id)
        if (node.children) initExpansion(node.children, level, current + 1)
      }
    }
  }

  async function loadTree(): Promise<void> {
    const hooks = options.requestHooks.value
    if (!hooks.loadTree) return

    const reqId = startRequest('loadTree')
    loading.value = true
    errorState.value = null
    emitRequest('start', 'loadTree')

    try {
      const data = await hooks.loadTree()
      if (isStaleRequest('loadTree', reqId)) return
      treeData.value = data
      expandedKeys.value = new Set()
      initExpansion(data, options.defaultExpandLevel.value)
      emitRequest('success', 'loadTree')
      emitDataChange('create')
    } catch (err) {
      if (isStaleRequest('loadTree', reqId)) return
      const treeError = parseError(err)
      errorState.value = treeError
      emitRequest('error', 'loadTree', undefined, treeError)
    } finally {
      if (!isStaleRequest('loadTree', reqId)) loading.value = false
    }
  }

  async function loadChildren(parentId: string | number): Promise<void> {
    const hooks = options.requestHooks.value
    if (!hooks.loadChildren) return

    const key = `loadChildren:${parentId}`
    const reqId = startRequest(key)
    loadingNodeIds.value.add(parentId)
    emitRequest('start', 'loadChildren', parentId)

    try {
      const children = await hooks.loadChildren(parentId)
      if (isStaleRequest(key, reqId)) return
      const parent = findNode(treeData.value, parentId)
      if (parent) {
        parent.children = children
        expandedKeys.value.add(parentId)
      }
      emitRequest('success', 'loadChildren', parentId)
    } catch (err) {
      if (isStaleRequest(key, reqId)) return
      const treeError = { ...parseError(err), nodeId: parentId }
      operationErrors.value.set(parentId, treeError)
      emitRequest('error', 'loadChildren', parentId, treeError)
    } finally {
      if (!isStaleRequest(key, reqId)) loadingNodeIds.value.delete(parentId)
    }
  }

  async function createNode(
    parentId: string | number | null,
    name: string,
  ): Promise<TreeNodeData | null> {
    const hooks = options.requestHooks.value
    if (!hooks.create) return null

    const tempId = `__temp_${Date.now()}`
    const tempNode: TreeNodeData = {
      id: tempId,
      label: name,
      parentId,
      sortOrder: 0,
      depth: 0,
      children: [],
    }

    if (options.optimistic.value) {
      pendingSnapshot.value = cloneTree(treeData.value)
      insertNode(tempNode, parentId)
    }

    emitRequest('start', 'create')

    try {
      const created = await hooks.create({ parentId, name })
      if (options.optimistic.value) {
        replaceNodeById(tempId, created)
      } else {
        insertNode(created, parentId)
      }
      if (parentId) expandedKeys.value.add(parentId)
      pendingSnapshot.value = null
      editingNodeId.value = null
      emitRequest('success', 'create', created.id)
      emitDataChange('create', created)
      return created
    } catch (err) {
      if (options.optimistic.value && pendingSnapshot.value) {
        treeData.value = pendingSnapshot.value
        pendingSnapshot.value = null
      }
      const treeError = parseError(err)
      emitRequest('error', 'create', undefined, treeError)
      throw treeError
    }
  }

  async function updateNode(
    id: string | number,
    name: string,
  ): Promise<TreeNodeData | null> {
    const hooks = options.requestHooks.value
    if (!hooks.update) return null

    const node = findNode(treeData.value, id)
    if (!node) return null

    const oldName = node.label

    if (options.optimistic.value) {
      pendingSnapshot.value = cloneTree(treeData.value)
      node.label = name
    }

    emitRequest('start', 'update', id)

    try {
      const updated = await hooks.update({ id, name })
      if (!options.optimistic.value) {
        const target = findNode(treeData.value, id)
        if (target) Object.assign(target, updated)
      } else {
        replaceNodeById(id, updated)
      }
      pendingSnapshot.value = null
      editingNodeId.value = null
      emitRequest('success', 'update', id)
      emitDataChange('update', updated)
      return updated
    } catch (err) {
      if (options.optimistic.value && pendingSnapshot.value) {
        treeData.value = pendingSnapshot.value
        pendingSnapshot.value = null
      } else if (node) {
        node.label = oldName
      }
      const treeError = { ...parseError(err), nodeId: id }
      operationErrors.value.set(id, treeError)
      emitRequest('error', 'update', id, treeError)
      throw treeError
    }
  }

  async function deleteNode(id: string | number): Promise<void> {
    const hooks = options.requestHooks.value
    if (!hooks.delete) return

    if (options.checkDelete?.value) {
      const constraint: DeleteConstraint = await options.checkDelete.value(id)
      if (!constraint.canDelete) {
        const treeError: TreeError = {
          code: constraint.articleCount ? 'FOLDER_HAS_ARTICLES' : 'HAS_CHILDREN',
          message: constraint.reason ?? 'Cannot delete',
          nodeId: id,
        }
        emitRequest('error', 'delete', id, treeError)
        throw treeError
      }
    }

    if (options.optimistic.value) {
      pendingSnapshot.value = cloneTree(treeData.value)
      removeNode(treeData.value, id)
    }

    emitRequest('start', 'delete', id)

    try {
      await hooks.delete(id)
      if (!options.optimistic.value) {
        removeNode(treeData.value, id)
      }
      pendingSnapshot.value = null
      operationErrors.value.delete(id)
      emitRequest('success', 'delete', id)
      emitDataChange('delete')
    } catch (err) {
      if (options.optimistic.value && pendingSnapshot.value) {
        treeData.value = pendingSnapshot.value
        pendingSnapshot.value = null
      }
      const treeError = { ...parseError(err), nodeId: id }
      operationErrors.value.set(id, treeError)
      emitRequest('error', 'delete', id, treeError)
      throw treeError
    }
  }

  async function moveNode(
    id: string | number,
    newParentId: string | number | null,
  ): Promise<void> {
    const hooks = options.requestHooks.value
    if (!hooks.move) return

    if (newParentId !== null && isDescendantOf(treeData.value, newParentId, id)) {
      const treeError: TreeError = {
        code: 'CIRCULAR_REFERENCE',
        message: 'Cannot move folder to its own descendant',
        nodeId: id,
      }
      emitRequest('error', 'move', id, treeError)
      throw treeError
    }

    if (options.optimistic.value) {
      pendingSnapshot.value = cloneTree(treeData.value)
      const node = findNode(treeData.value, id)
      if (node) {
        removeNode(treeData.value, id)
        node.parentId = newParentId
        insertNode(node, newParentId)
      }
    }

    emitRequest('start', 'move', id)

    try {
      await hooks.move({ id, newParentId })
      if (!options.optimistic.value) {
        await loadTree()
      }
      pendingSnapshot.value = null
      if (newParentId) expandedKeys.value.add(newParentId)
      emitRequest('success', 'move', id)
      emitDataChange('move')
    } catch (err) {
      if (options.optimistic.value && pendingSnapshot.value) {
        treeData.value = pendingSnapshot.value
        pendingSnapshot.value = null
      }
      const treeError = { ...parseError(err), nodeId: id }
      operationErrors.value.set(id, treeError)
      emitRequest('error', 'move', id, treeError)
      throw treeError
    }
  }

  async function reorderNode(id: string | number, newOrder: number): Promise<void> {
    const hooks = options.requestHooks.value
    if (!hooks.reorder) return

    emitRequest('start', 'reorder', id)

    try {
      await hooks.reorder({ id, newOrder })
      const siblings = findParentList(treeData.value, id)
      if (siblings) {
        const node = siblings.find((n) => n.id === id)
        if (node) {
          node.sortOrder = newOrder
          siblings.sort((a, b) => a.sortOrder - b.sortOrder)
        }
      }
      emitRequest('success', 'reorder', id)
      emitDataChange('reorder')
    } catch (err) {
      const treeError = { ...parseError(err), nodeId: id }
      emitRequest('error', 'reorder', id, treeError)
      throw treeError
    }
  }

  function insertNode(node: TreeNodeData, parentId: string | number | null): void {
    if (parentId === null) {
      treeData.value.push(node)
    } else {
      const parent = findNode(treeData.value, parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(node)
      }
    }
  }

  function replaceNodeById(oldId: string | number, newNode: TreeNodeData): void {
    const siblings = findParentList(treeData.value, oldId)
    if (siblings) {
      const idx = siblings.findIndex((n) => n.id === oldId)
      if (idx >= 0) siblings[idx] = { ...newNode, children: siblings[idx].children }
    }
  }

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

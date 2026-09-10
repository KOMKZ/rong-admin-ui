import type { Ref, ShallowRef } from 'vue'
import type {
  CheckDeleteFn,
  DeleteConstraint,
  TreeDataChangeEvent,
  TreeError,
  TreeNodeData,
} from '../types'
import {
  cloneTree,
  findNode,
  findParentList,
  isDescendantOf,
  parseTreeError,
  removeNode,
} from './treeDataUtils'
import type { UseTreeDataOptions } from './useTreeData'

interface TreeActionState {
  treeData: Ref<TreeNodeData[]>
  loading: Ref<boolean>
  loadingNodeIds: Ref<Set<string | number>>
  expandedKeys: Ref<Set<string | number>>
  editingNodeId: Ref<string | number | null>
  errorState: Ref<TreeError | null>
  operationErrors: Ref<Map<string | number, TreeError>>
  pendingSnapshot: ShallowRef<TreeNodeData[] | null>
}

interface TreeActionEvents {
  startRequest: (key: string) => number
  isStaleRequest: (key: string, id: number) => boolean
  emitRequest: (
    phase: 'start' | 'success' | 'error',
    action: string,
    nodeId?: string | number,
    error?: TreeError,
  ) => void
  emitDataChange: (type: TreeDataChangeEvent['type'], node?: TreeNodeData) => void
}

interface TreeActionContext {
  options: UseTreeDataOptions
  state: TreeActionState
  events: TreeActionEvents
}

export function createTreeDataActions(
  options: UseTreeDataOptions,
  state: TreeActionState,
  events: TreeActionEvents,
) {
  const ctx: TreeActionContext = { options, state, events }
  return {
    loadTree: () => loadTree(ctx),
    loadChildren: (parentId: string | number) => loadChildren(ctx, parentId),
    createNode: (parentId: string | number | null, name: string) =>
      createNode(ctx, parentId, name),
    updateNode: (id: string | number, name: string) => updateNode(ctx, id, name),
    deleteNode: (id: string | number) => deleteNode(ctx, id),
    moveNode: (id: string | number, newParentId: string | number | null) =>
      moveNode(ctx, id, newParentId),
    reorderNode: (id: string | number, newOrder: number) =>
      reorderNode(ctx, id, newOrder),
  }
}

async function loadTree(ctx: TreeActionContext): Promise<void> {
  const { options, state, events } = ctx
  const hooks = options.requestHooks.value
  if (!hooks.loadTree) return
  const reqId = events.startRequest('loadTree')
  state.loading.value = true
  state.errorState.value = null
  events.emitRequest('start', 'loadTree')
  try {
    const data = await hooks.loadTree()
    if (events.isStaleRequest('loadTree', reqId)) return
    state.treeData.value = data
    state.expandedKeys.value = new Set()
    initExpansion(state.expandedKeys, data, options.defaultExpandLevel.value)
    events.emitRequest('success', 'loadTree')
    events.emitDataChange('create')
  } catch (err) {
    if (events.isStaleRequest('loadTree', reqId)) return
    const treeError = parseTreeError(err)
    state.errorState.value = treeError
    events.emitRequest('error', 'loadTree', undefined, treeError)
  } finally {
    if (!events.isStaleRequest('loadTree', reqId)) state.loading.value = false
  }
}

async function loadChildren(
  ctx: TreeActionContext,
  parentId: string | number,
): Promise<void> {
  const { state, events } = ctx
  const hooks = ctx.options.requestHooks.value
  if (!hooks.loadChildren) return
  const key = `loadChildren:${parentId}`
  const reqId = events.startRequest(key)
  state.loadingNodeIds.value.add(parentId)
  events.emitRequest('start', 'loadChildren', parentId)
  try {
    const children = await hooks.loadChildren(parentId)
    if (events.isStaleRequest(key, reqId)) return
    const parent = findNode(state.treeData.value, parentId)
    if (parent) {
      parent.children = children
      state.expandedKeys.value.add(parentId)
    }
    events.emitRequest('success', 'loadChildren', parentId)
  } catch (err) {
    if (events.isStaleRequest(key, reqId)) return
    const treeError = { ...parseTreeError(err), nodeId: parentId }
    state.operationErrors.value.set(parentId, treeError)
    events.emitRequest('error', 'loadChildren', parentId, treeError)
  } finally {
    if (!events.isStaleRequest(key, reqId)) state.loadingNodeIds.value.delete(parentId)
  }
}

async function createNode(
  ctx: TreeActionContext,
  parentId: string | number | null,
  name: string,
): Promise<TreeNodeData | null> {
  const { options, state, events } = ctx
  const hooks = options.requestHooks.value
  if (!hooks.create) return null
  const tempId = `__temp_${Date.now()}`
  const tempNode: TreeNodeData = { id: tempId, label: name, parentId, sortOrder: 0, depth: 0, children: [] }
  if (options.optimistic.value) {
    state.pendingSnapshot.value = cloneTree(state.treeData.value)
    insertNode(state.treeData, tempNode, parentId)
  }
  events.emitRequest('start', 'create')
  try {
    const created = await hooks.create({ parentId, name })
    if (options.optimistic.value) {
      replaceNodeById(state.treeData, tempId, created)
    } else {
      insertNode(state.treeData, created, parentId)
    }
    if (parentId) state.expandedKeys.value.add(parentId)
    state.pendingSnapshot.value = null
    state.editingNodeId.value = null
    events.emitRequest('success', 'create', created.id)
    events.emitDataChange('create', created)
    return created
  } catch (err) {
    restorePendingSnapshot(state, options)
    const treeError = parseTreeError(err)
    events.emitRequest('error', 'create', undefined, treeError)
    throw treeError
  }
}

async function updateNode(
  ctx: TreeActionContext,
  id: string | number,
  name: string,
): Promise<TreeNodeData | null> {
  const { options, state, events } = ctx
  const hooks = options.requestHooks.value
  if (!hooks.update) return null
  const node = findNode(state.treeData.value, id)
  if (!node) return null
  const oldName = node.label
  if (options.optimistic.value) {
    state.pendingSnapshot.value = cloneTree(state.treeData.value)
    node.label = name
  }
  events.emitRequest('start', 'update', id)
  try {
    const updated = await hooks.update({ id, name })
    if (options.optimistic.value) replaceNodeById(state.treeData, id, updated)
    else Object.assign(findNode(state.treeData.value, id) ?? {}, updated)
    state.pendingSnapshot.value = null
    state.editingNodeId.value = null
    events.emitRequest('success', 'update', id)
    events.emitDataChange('update', updated)
    return updated
  } catch (err) {
    if (!restorePendingSnapshot(state, options)) node.label = oldName
    const treeError = { ...parseTreeError(err), nodeId: id }
    state.operationErrors.value.set(id, treeError)
    events.emitRequest('error', 'update', id, treeError)
    throw treeError
  }
}

async function deleteNode(ctx: TreeActionContext, id: string | number): Promise<void> {
  const { options, state, events } = ctx
  const hooks = options.requestHooks.value
  if (!hooks.delete) return
  await assertCanDelete(options.checkDelete, id, events.emitRequest)
  if (options.optimistic.value) {
    state.pendingSnapshot.value = cloneTree(state.treeData.value)
    removeNode(state.treeData.value, id)
  }
  events.emitRequest('start', 'delete', id)
  try {
    await hooks.delete(id)
    if (!options.optimistic.value) removeNode(state.treeData.value, id)
    state.pendingSnapshot.value = null
    state.operationErrors.value.delete(id)
    events.emitRequest('success', 'delete', id)
    events.emitDataChange('delete')
  } catch (err) {
    restorePendingSnapshot(state, options)
    const treeError = { ...parseTreeError(err), nodeId: id }
    state.operationErrors.value.set(id, treeError)
    events.emitRequest('error', 'delete', id, treeError)
    throw treeError
  }
}

async function moveNode(
  ctx: TreeActionContext,
  id: string | number,
  newParentId: string | number | null,
): Promise<void> {
  const { options, state, events } = ctx
  const hooks = options.requestHooks.value
  if (!hooks.move) return
  assertMoveTarget(state.treeData.value, id, newParentId, events.emitRequest)
  applyOptimisticMove(state, options, id, newParentId)
  events.emitRequest('start', 'move', id)
  try {
    await hooks.move({ id, newParentId })
    if (!options.optimistic.value) await loadTree(ctx)
    state.pendingSnapshot.value = null
    if (newParentId) state.expandedKeys.value.add(newParentId)
    events.emitRequest('success', 'move', id)
    events.emitDataChange('move')
  } catch (err) {
    restorePendingSnapshot(state, options)
    const treeError = { ...parseTreeError(err), nodeId: id }
    state.operationErrors.value.set(id, treeError)
    events.emitRequest('error', 'move', id, treeError)
    throw treeError
  }
}

async function reorderNode(
  ctx: TreeActionContext,
  id: string | number,
  newOrder: number,
): Promise<void> {
  const { state, events } = ctx
  const hooks = ctx.options.requestHooks.value
  if (!hooks.reorder) return
  events.emitRequest('start', 'reorder', id)
  try {
    await hooks.reorder({ id, newOrder })
    const siblings = findParentList(state.treeData.value, id)
    const node = siblings?.find((n) => n.id === id)
    if (siblings && node) {
      node.sortOrder = newOrder
      siblings.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    events.emitRequest('success', 'reorder', id)
    events.emitDataChange('reorder')
  } catch (err) {
    const treeError = { ...parseTreeError(err), nodeId: id }
    events.emitRequest('error', 'reorder', id, treeError)
    throw treeError
  }
}

function restorePendingSnapshot(
  state: TreeActionState,
  options: UseTreeDataOptions,
): boolean {
  if (!options.optimistic.value || !state.pendingSnapshot.value) return false
  state.treeData.value = state.pendingSnapshot.value
  state.pendingSnapshot.value = null
  return true
}

function applyOptimisticMove(
  state: TreeActionState,
  options: UseTreeDataOptions,
  id: string | number,
  newParentId: string | number | null,
): void {
  if (!options.optimistic.value) return
  state.pendingSnapshot.value = cloneTree(state.treeData.value)
  const node = findNode(state.treeData.value, id)
  if (!node) return
  removeNode(state.treeData.value, id)
  node.parentId = newParentId
  insertNode(state.treeData, node, newParentId)
}


async function assertCanDelete(
  checkDelete: Ref<CheckDeleteFn | undefined> | undefined,
  id: string | number,
  emitRequest: TreeActionEvents['emitRequest'],
): Promise<void> {
  if (!checkDelete?.value) return
  const constraint: DeleteConstraint = await checkDelete.value(id)
  if (constraint.canDelete) return
  const treeError: TreeError = {
    code: constraint.articleCount ? 'FOLDER_HAS_ARTICLES' : 'HAS_CHILDREN',
    message: constraint.reason ?? 'Cannot delete',
    nodeId: id,
  }
  emitRequest('error', 'delete', id, treeError)
  throw treeError
}

function assertMoveTarget(
  nodes: TreeNodeData[],
  id: string | number,
  newParentId: string | number | null,
  emitRequest: TreeActionEvents['emitRequest'],
): void {
  if (newParentId === null || !isDescendantOf(nodes, newParentId, id)) return
  const treeError: TreeError = {
    code: 'CIRCULAR_REFERENCE',
    message: 'Cannot move folder to its own descendant',
    nodeId: id,
  }
  emitRequest('error', 'move', id, treeError)
  throw treeError
}

function initExpansion(
  expandedKeys: Ref<Set<string | number>>,
  nodes: TreeNodeData[],
  level: number,
  current = 0,
): void {
  for (const node of nodes) {
    if (current < level) {
      expandedKeys.value.add(node.id)
      if (node.children) initExpansion(expandedKeys, node.children, level, current + 1)
    }
  }
}

function insertNode(
  treeData: Ref<TreeNodeData[]>,
  node: TreeNodeData,
  parentId: string | number | null,
): void {
  if (parentId === null) {
    treeData.value.push(node)
    return
  }
  const parent = findNode(treeData.value, parentId)
  if (!parent) return
  parent.children ??= []
  parent.children.push(node)
}

function replaceNodeById(
  treeData: Ref<TreeNodeData[]>,
  oldId: string | number,
  newNode: TreeNodeData,
): void {
  const siblings = findParentList(treeData.value, oldId)
  if (!siblings) return
  const idx = siblings.findIndex((n) => n.id === oldId)
  if (idx >= 0) siblings[idx] = { ...newNode, children: siblings[idx].children }
}

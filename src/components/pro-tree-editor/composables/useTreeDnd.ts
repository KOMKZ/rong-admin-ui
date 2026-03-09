import { ref, type Ref } from 'vue'
import type { TreeNodeData, DropPosition, DropInfo, TreeErrorCode } from '../types'

interface UseTreeDndOptions {
  treeData: Ref<TreeNodeData[]>
  maxDepth: Ref<number>
  draggable: Ref<boolean>
  findNode: (id: string | number) => TreeNodeData | null
  isDescendantOf: (nodeId: string | number, ancestorId: string | number) => boolean
  onDrop: (info: DropInfo) => void
}

function getMaxChildDepth(node: TreeNodeData): number {
  if (!node.children?.length) return 0
  let max = 0
  for (const child of node.children) {
    const d = 1 + getMaxChildDepth(child)
    if (d > max) max = d
  }
  return max
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTreeDnd(options: UseTreeDndOptions) {
  const dragNodeId = ref<string | number | null>(null)
  const dropTargetId = ref<string | number | null>(null)
  const dropPosition = ref<DropPosition | null>(null)
  const dropLegal = ref(true)
  const dropReason = ref<TreeErrorCode | undefined>()

  function validateDrop(
    dragId: string | number,
    targetId: string | number,
    position: DropPosition,
  ): { legal: boolean; reason?: TreeErrorCode } {
    if (!options.draggable.value) return { legal: false }
    if (dragId === targetId) return { legal: false, reason: 'CIRCULAR_REFERENCE' }

    const dragNode = options.findNode(dragId)
    const targetNode = options.findNode(targetId)
    if (!dragNode || !targetNode) return { legal: false, reason: 'NOT_FOUND' }

    if (targetNode.disabled) return { legal: false }

    if (options.isDescendantOf(targetId, dragId)) {
      return { legal: false, reason: 'CIRCULAR_REFERENCE' }
    }

    if (position === 'inside' && options.maxDepth.value > 0) {
      const dragSubtreeDepth = getMaxChildDepth(dragNode)
      const newDepth = targetNode.depth + 1 + dragSubtreeDepth
      if (newDepth >= options.maxDepth.value) {
        return { legal: false, reason: 'MAX_DEPTH_EXCEEDED' }
      }
    }

    if ((position === 'before' || position === 'after') && options.maxDepth.value > 0) {
      const dragSubtreeDepth = getMaxChildDepth(dragNode)
      const newDepth = targetNode.depth + dragSubtreeDepth
      if (newDepth >= options.maxDepth.value) {
        return { legal: false, reason: 'MAX_DEPTH_EXCEEDED' }
      }
    }

    return { legal: true }
  }

  function onDragStart(nodeId: string | number): void {
    if (!options.draggable.value) return
    dragNodeId.value = nodeId
  }

  function onDragOver(targetId: string | number, position: DropPosition): void {
    if (!dragNodeId.value || dragNodeId.value === targetId) {
      dropLegal.value = false
      return
    }
    dropTargetId.value = targetId
    dropPosition.value = position
    const validation = validateDrop(dragNodeId.value, targetId, position)
    dropLegal.value = validation.legal
    dropReason.value = validation.reason
  }

  function onDragEnd(): void {
    if (dragNodeId.value && dropTargetId.value && dropPosition.value && dropLegal.value) {
      const info: DropInfo = {
        dragNodeId: dragNodeId.value,
        targetNodeId: dropTargetId.value,
        position: dropPosition.value,
        isLegal: true,
      }
      options.onDrop(info)
    }
    resetDragState()
  }

  function onDragCancel(): void {
    resetDragState()
  }

  function resetDragState(): void {
    dragNodeId.value = null
    dropTargetId.value = null
    dropPosition.value = null
    dropLegal.value = true
    dropReason.value = undefined
  }

  function getDropIndicator(nodeId: string | number): {
    isTarget: boolean
    position: DropPosition | null
    legal: boolean
    reason?: TreeErrorCode
  } {
    if (dropTargetId.value !== nodeId) {
      return { isTarget: false, position: null, legal: true }
    }
    return {
      isTarget: true,
      position: dropPosition.value,
      legal: dropLegal.value,
      reason: dropReason.value,
    }
  }

  return {
    dragNodeId,
    dropTargetId,
    dropPosition,
    dropLegal,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    getDropIndicator,
    validateDrop,
  }
}

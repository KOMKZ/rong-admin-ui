import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useTreeDnd } from '../../../src/components/pro-tree-editor/composables/useTreeDnd'
import type { TreeNodeData } from '../../../src/components/pro-tree-editor/types'

const mockTree: TreeNodeData[] = [
  {
    id: 1, label: 'Root', parentId: null, sortOrder: 0, depth: 0,
    children: [
      { id: 2, label: 'Child A', parentId: 1, sortOrder: 0, depth: 1, children: [] },
      {
        id: 3, label: 'Child B', parentId: 1, sortOrder: 1, depth: 1,
        children: [
          { id: 4, label: 'Grandchild', parentId: 3, sortOrder: 0, depth: 2, children: [] },
        ],
      },
    ],
  },
]

function findNode(id: string | number): TreeNodeData | null {
  const walk = (nodes: TreeNodeData[]): TreeNodeData | null => {
    for (const n of nodes) {
      if (n.id === id) return n
      if (n.children) { const f = walk(n.children); if (f) return f }
    }
    return null
  }
  return walk(mockTree)
}

function isDescendantOf(nodeId: string | number, ancestorId: string | number): boolean {
  const ancestor = findNode(ancestorId)
  if (!ancestor?.children) return false
  const walk = (nodes: TreeNodeData[]): boolean => {
    for (const n of nodes) {
      if (n.id === nodeId) return true
      if (n.children && walk(n.children)) return true
    }
    return false
  }
  return walk(ancestor.children)
}

function createDnd() {
  const onDrop = vi.fn()
  const dnd = useTreeDnd({
    treeData: ref(mockTree),
    maxDepth: ref(10),
    draggable: ref(true),
    findNode,
    isDescendantOf,
    onDrop,
  })
  return { dnd, onDrop }
}

describe('useTreeDnd', () => {
  it('should validate self-drop as illegal', () => {
    const { dnd } = createDnd()
    const result = dnd.validateDrop(1, 1, 'inside')
    expect(result.legal).toBe(false)
    expect(result.reason).toBe('CIRCULAR_REFERENCE')
  })

  it('should validate drop to descendant as illegal', () => {
    const { dnd } = createDnd()
    const result = dnd.validateDrop(1, 3, 'inside')
    expect(result.legal).toBe(false)
    expect(result.reason).toBe('CIRCULAR_REFERENCE')
  })

  it('should validate legal sibling drop', () => {
    const { dnd } = createDnd()
    const result = dnd.validateDrop(2, 3, 'after')
    expect(result.legal).toBe(true)
  })

  it('should validate legal inside drop', () => {
    const { dnd } = createDnd()
    const result = dnd.validateDrop(4, 2, 'inside')
    expect(result.legal).toBe(true)
  })

  it('should track drag state', () => {
    const { dnd, onDrop } = createDnd()

    dnd.onDragStart(2)
    expect(dnd.dragNodeId.value).toBe(2)

    dnd.onDragOver(3, 'after')
    expect(dnd.dropTargetId.value).toBe(3)
    expect(dnd.dropPosition.value).toBe('after')

    dnd.onDragEnd()
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        dragNodeId: 2,
        targetNodeId: 3,
        position: 'after',
        isLegal: true,
      }),
    )
  })

  it('should provide drop indicator info', () => {
    const { dnd } = createDnd()

    dnd.onDragStart(2)
    dnd.onDragOver(3, 'inside')

    const indicator = dnd.getDropIndicator(3)
    expect(indicator.isTarget).toBe(true)
    expect(indicator.position).toBe('inside')
    expect(indicator.legal).toBe(true)

    const nonTarget = dnd.getDropIndicator(4)
    expect(nonTarget.isTarget).toBe(false)
  })

  it('should validate maxDepth constraint', () => {
    const onDrop = vi.fn()
    const dnd = useTreeDnd({
      treeData: ref(mockTree),
      maxDepth: ref(3),
      draggable: ref(true),
      findNode,
      isDescendantOf,
      onDrop,
    })

    // Dropping node 2 (Child A, depth=1, no children) inside node 4 (depth=2)
    // would put it at depth=3, which equals maxDepth=3 → illegal
    const result = dnd.validateDrop(2, 4, 'inside')
    expect(result.legal).toBe(false)
    expect(result.reason).toBe('MAX_DEPTH_EXCEEDED')
  })
})

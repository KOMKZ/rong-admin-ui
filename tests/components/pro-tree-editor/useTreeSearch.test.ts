import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTreeSearch } from '../../../src/components/pro-tree-editor/composables/useTreeSearch'
import type { TreeNodeData } from '../../../src/components/pro-tree-editor/types'

const mockTree: TreeNodeData[] = [
  {
    id: 1, label: 'Documents', parentId: null, sortOrder: 0, depth: 0,
    children: [
      { id: 2, label: 'Reports', parentId: 1, sortOrder: 0, depth: 1, children: [] },
      {
        id: 3, label: 'Photos', parentId: 1, sortOrder: 1, depth: 1,
        children: [
          { id: 4, label: 'Vacation Photos', parentId: 3, sortOrder: 0, depth: 2, children: [] },
        ],
      },
    ],
  },
  { id: 5, label: 'Music', parentId: null, sortOrder: 1, depth: 0, children: [] },
]

function createSearch() {
  const treeData = ref(mockTree)
  const expandedKeys = ref(new Set<string | number>())
  return useTreeSearch({ treeData, expandedKeys })
}

describe('useTreeSearch', () => {
  it('should return empty matches when keyword is empty', () => {
    const search = createSearch()
    expect(search.matchedNodeIds.value.size).toBe(0)
  })

  it('should match nodes by keyword (case insensitive)', () => {
    const search = createSearch()
    search.setKeyword('photo')
    expect(search.matchedNodeIds.value.has(3)).toBe(true)
    expect(search.matchedNodeIds.value.has(4)).toBe(true)
    expect(search.matchedNodeIds.value.has(1)).toBe(false)
  })

  it('should include ancestor paths in visible nodes', () => {
    const search = createSearch()
    search.setKeyword('vacation')

    const visible = search.visibleNodeIds.value
    expect(visible).not.toBeNull()
    expect(visible!.has(4)).toBe(true)
    expect(visible!.has(3)).toBe(true)
    expect(visible!.has(1)).toBe(true)
    expect(visible!.has(5)).toBe(false)
  })

  it('should return null for visibleNodeIds when keyword is empty', () => {
    const search = createSearch()
    search.setKeyword('')
    expect(search.visibleNodeIds.value).toBeNull()
  })

  it('should generate highlight ranges', () => {
    const search = createSearch()
    search.setKeyword('photo')
    const ranges = search.getHighlightRanges('Vacation Photos')
    expect(ranges).toHaveLength(1)
    expect(ranges[0]).toEqual({ start: 9, end: 14 })
  })

  it('should handle multiple highlight ranges', () => {
    const search = createSearch()
    search.setKeyword('a')
    const ranges = search.getHighlightRanges('Banana')
    expect(ranges.length).toBeGreaterThanOrEqual(2)
  })

  it('isNodeVisible should return true when no search', () => {
    const search = createSearch()
    expect(search.isNodeVisible(1)).toBe(true)
    expect(search.isNodeVisible(5)).toBe(true)
  })
})

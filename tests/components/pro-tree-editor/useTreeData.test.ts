import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useTreeData } from '../../../src/components/pro-tree-editor/composables/useTreeData'
import type { TreeNodeData, TreeRequestHooks } from '../../../src/components/pro-tree-editor/types'

function makeMockHooks(overrides: Partial<TreeRequestHooks> = {}): TreeRequestHooks {
  return {
    loadTree: vi.fn().mockResolvedValue([
      {
        id: 1, label: 'Root', parentId: null, sortOrder: 0, depth: 0,
        children: [
          { id: 2, label: 'Child A', parentId: 1, sortOrder: 0, depth: 1, children: [] },
          { id: 3, label: 'Child B', parentId: 1, sortOrder: 1, depth: 1, children: [] },
        ],
      },
    ] satisfies TreeNodeData[]),
    loadChildren: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(async (params: { parentId: string | number | null; name: string }) => ({
      id: 100, label: params.name, parentId: params.parentId, sortOrder: 0, depth: 0,
    })),
    update: vi.fn().mockImplementation(async (params: { id: string | number; name: string }) => ({
      id: params.id, label: params.name, parentId: null, sortOrder: 0, depth: 0,
    })),
    delete: vi.fn().mockResolvedValue(undefined),
    move: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function createTreeData(hooks?: Partial<TreeRequestHooks>) {
  const mockHooks = makeMockHooks(hooks)
  return useTreeData({
    requestMode: ref('auto'),
    requestHooks: ref(mockHooks),
    optimistic: ref(false),
    lazyLoad: ref(false),
    defaultExpandLevel: ref(1),
    onRequestStart: vi.fn(),
    onRequestSuccess: vi.fn(),
    onRequestError: vi.fn(),
    onDataChange: vi.fn(),
  })
}

describe('useTreeData', () => {
  describe('loadTree', () => {
    it('should load tree data and set expanded keys by defaultExpandLevel', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      expect(tree.treeData.value).toHaveLength(1)
      expect(tree.treeData.value[0].label).toBe('Root')
      expect(tree.treeData.value[0].children).toHaveLength(2)
      expect(tree.expandedKeys.value.has(1)).toBe(true)
    })

    it('should set loading state during request', async () => {
      let resolvePromise: (value: TreeNodeData[]) => void
      const tree = createTreeData({
        loadTree: vi.fn().mockReturnValue(
          new Promise<TreeNodeData[]>((resolve) => { resolvePromise = resolve }),
        ),
      })

      const promise = tree.loadTree()
      expect(tree.loading.value).toBe(true)

      resolvePromise!([])
      await promise
      expect(tree.loading.value).toBe(false)
    })

    it('should handle error and set errorState', async () => {
      const tree = createTreeData({
        loadTree: vi.fn().mockRejectedValue(new Error('Network error')),
      })

      await tree.loadTree()
      expect(tree.errorState.value).not.toBeNull()
      expect(tree.errorState.value?.code).toBe('NETWORK_ERROR')
    })
  })

  describe('createNode', () => {
    it('should create a node and insert it', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      const created = await tree.createNode(null, 'New Folder')
      expect(created).not.toBeNull()
      expect(created?.label).toBe('New Folder')
      expect(tree.treeData.value.length).toBeGreaterThan(1)
    })

    it('should create a child node', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      await tree.createNode(1, 'Sub Folder')
      const root = tree.treeData.value[0]
      expect(root.children).toHaveLength(3)
    })
  })

  describe('updateNode', () => {
    it('should update node label', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      await tree.updateNode(2, 'Renamed')
      const node = tree.findNode(2)
      expect(node?.label).toBe('Renamed')
    })

    it('should throw on duplicate name', async () => {
      const tree = createTreeData({
        update: vi.fn().mockRejectedValue(new Error('folder name already exists in the same parent')),
      })
      await tree.loadTree()

      await expect(tree.updateNode(2, 'Duplicate')).rejects.toMatchObject({
        code: 'DUPLICATE_NAME',
      })
    })
  })

  describe('deleteNode', () => {
    it('should remove node from tree', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      await tree.deleteNode(3)
      const root = tree.treeData.value[0]
      expect(root.children).toHaveLength(1)
      expect(root.children?.[0].id).toBe(2)
    })
  })

  describe('toggleExpand', () => {
    it('should toggle expanded state', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      expect(tree.expandedKeys.value.has(1)).toBe(true)
      tree.toggleExpand(1)
      expect(tree.expandedKeys.value.has(1)).toBe(false)
      tree.toggleExpand(1)
      expect(tree.expandedKeys.value.has(1)).toBe(true)
    })
  })

  describe('expandAll / collapseAll', () => {
    it('should expand all nodes with children', async () => {
      const tree = createTreeData()
      await tree.loadTree()

      tree.collapseAll()
      expect(tree.expandedKeys.value.size).toBe(0)

      tree.expandAll()
      expect(tree.expandedKeys.value.has(1)).toBe(true)
    })
  })

  describe('error parsing', () => {
    it('should parse HAS_CHILDREN error', async () => {
      const tree = createTreeData({
        delete: vi.fn().mockRejectedValue(new Error('cannot delete folder with children')),
      })
      await tree.loadTree()

      await expect(tree.deleteNode(1)).rejects.toMatchObject({
        code: 'HAS_CHILDREN',
      })
    })

    it('should parse CIRCULAR_REFERENCE error', async () => {
      const tree = createTreeData({
        move: vi.fn().mockRejectedValue(new Error('cannot move folder to its own descendant')),
      })
      await tree.loadTree()

      await expect(tree.moveNode(1, 2)).rejects.toMatchObject({
        code: 'CIRCULAR_REFERENCE',
      })
    })
  })
})

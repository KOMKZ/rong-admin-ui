import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createArticleFolderAdapter } from '../../../src/components/pro-tree-editor/adapters/articleFolderAdapter'
import type { TreeHttpClient } from '../../../src/components/pro-tree-editor/adapters/articleFolderAdapter'

function createMockHttpClient(): TreeHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}

describe('articleFolderAdapter', () => {
  let httpClient: TreeHttpClient

  beforeEach(() => {
    httpClient = createMockHttpClient()
  })

  it('should create adapter with requestHooks and checkDelete', () => {
    const adapter = createArticleFolderAdapter({
      httpClient,
      baseUrl: '/api/admin/article-folders',
    })

    expect(adapter.requestHooks).toBeDefined()
    expect(adapter.requestHooks.loadTree).toBeDefined()
    expect(adapter.requestHooks.loadChildren).toBeDefined()
    expect(adapter.requestHooks.create).toBeDefined()
    expect(adapter.requestHooks.update).toBeDefined()
    expect(adapter.requestHooks.delete).toBeDefined()
    expect(adapter.requestHooks.move).toBeDefined()
    expect(adapter.requestHooks.reorder).toBeDefined()
    expect(adapter.checkDelete).toBeDefined()
  })

  describe('loadTree', () => {
    it('should call GET /tree and map FolderNodeDTO to TreeNodeData', async () => {
      const mockData = [
        {
          id: 1, name: 'Root', parent_id: null, sort_order: 0, depth: 0,
          item_count: 5, total_item_count: 10,
          children: [
            { id: 2, name: 'Child', parent_id: 1, sort_order: 0, depth: 1, item_count: 3, total_item_count: 3, children: [] },
          ],
        },
      ]
      ;(httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockData)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      const result = await adapter.requestHooks.loadTree!()

      expect(httpClient.get).toHaveBeenCalledWith('/api/admin/article-folders/tree')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].label).toBe('Root')
      expect(result[0].itemCount).toBe(5)
      expect(result[0].totalItemCount).toBe(10)
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children![0].label).toBe('Child')
    })
  })

  describe('loadChildren', () => {
    it('should call GET /:id/children', async () => {
      const mockData = [
        { id: 3, name: 'Sub', parent_id: 1, sort_order: 0, depth: 1, item_count: 0, total_item_count: 0, path: '/1/3/', created_at: '', updated_at: '' },
      ]
      ;(httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockData)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      const result = await adapter.requestHooks.loadChildren!(1)

      expect(httpClient.get).toHaveBeenCalledWith('/api/admin/article-folders/1/children')
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('Sub')
    })
  })

  describe('create', () => {
    it('should call POST baseUrl with correct body', async () => {
      const mockResponse = {
        id: 10, name: 'New', parent_id: 1, sort_order: 0, depth: 1,
        item_count: 0, total_item_count: 0, path: '/1/10/', created_at: '', updated_at: '',
      }
      ;(httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      const result = await adapter.requestHooks.create!({ parentId: 1, name: 'New' })

      expect(httpClient.post).toHaveBeenCalledWith('/api/admin/article-folders', { name: 'New', parent_id: 1 })
      expect(result.label).toBe('New')
      expect(result.parentId).toBe(1)
    })
  })

  describe('update', () => {
    it('should call PUT /:id with name body', async () => {
      const mockResponse = {
        id: 1, name: 'Updated', parent_id: null, sort_order: 0, depth: 0,
        item_count: 0, total_item_count: 0, path: '/1/', created_at: '', updated_at: '',
      }
      ;(httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      const result = await adapter.requestHooks.update!({ id: 1, name: 'Updated' })

      expect(httpClient.put).toHaveBeenCalledWith('/api/admin/article-folders/1', { name: 'Updated' })
      expect(result.label).toBe('Updated')
    })
  })

  describe('delete', () => {
    it('should call DELETE /:id', async () => {
      ;(httpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await adapter.requestHooks.delete!(1)

      expect(httpClient.delete).toHaveBeenCalledWith('/api/admin/article-folders/1')
    })
  })

  describe('move', () => {
    it('should call PUT /:id/move with new_parent_id body', async () => {
      ;(httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await adapter.requestHooks.move!({ id: 3, newParentId: 2 })

      expect(httpClient.put).toHaveBeenCalledWith('/api/admin/article-folders/3/move', { new_parent_id: 2 })
    })
  })

  describe('reorder', () => {
    it('should call PUT /:id/reorder with new_order body', async () => {
      ;(httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await adapter.requestHooks.reorder!({ id: 1, newOrder: 3 })

      expect(httpClient.put).toHaveBeenCalledWith('/api/admin/article-folders/1/reorder', { new_order: 3 })
    })
  })

  describe('error mapping', () => {
    it('should map duplicate name error', async () => {
      ;(httpClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('folder name already exists in the same parent'),
      )

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await expect(adapter.requestHooks.create!({ parentId: null, name: 'dup' }))
        .rejects.toMatchObject({ code: 'DUPLICATE_NAME' })
    })

    it('should map max depth error', async () => {
      ;(httpClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('max folder depth exceeded'),
      )

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await expect(adapter.requestHooks.create!({ parentId: 1, name: 'deep' }))
        .rejects.toMatchObject({ code: 'MAX_DEPTH_EXCEEDED' })
    })

    it('should map has children error on delete', async () => {
      ;(httpClient.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('cannot delete folder with children'),
      )

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await expect(adapter.requestHooks.delete!(1))
        .rejects.toMatchObject({ code: 'HAS_CHILDREN' })
    })

    it('should map network error', async () => {
      ;(httpClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('network error: failed to fetch'),
      )

      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      await expect(adapter.requestHooks.loadTree!())
        .rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    })
  })

  describe('checkDelete', () => {
    it('should always return canDelete true (server-side check)', async () => {
      const adapter = createArticleFolderAdapter({ httpClient, baseUrl: '/api/admin/article-folders' })
      const result = await adapter.checkDelete(1)

      expect(result.canDelete).toBe(true)
      expect(httpClient.get).not.toHaveBeenCalled()
    })
  })
})

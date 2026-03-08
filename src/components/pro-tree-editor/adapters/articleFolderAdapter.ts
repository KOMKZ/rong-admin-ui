import type {
  TreeNodeData,
  TreeRequestHooks,
  TreeError,
  TreeErrorCode,
  CheckDeleteFn,
  DeleteConstraint,
} from '../types'

// ─── Backend DTO Contracts ───

export interface FolderNodeDTO {
  id: number
  name: string
  parent_id: number | null
  sort_order: number
  depth: number
  item_count: number
  total_item_count: number
  children?: FolderNodeDTO[]
}

export interface FolderDTO {
  id: number
  name: string
  parent_id: number | null
  sort_order: number
  depth: number
  item_count: number
  total_item_count: number
  path: string
  created_at: string
  updated_at: string
}

export interface CreateFolderRequest {
  name: string
  parent_id: number | null
}

export interface UpdateFolderRequest {
  name: string
}

export interface MoveFolderRequest {
  new_parent_id: number | null
}

export interface ReorderFolderRequest {
  new_order: number
}

export interface CanDeleteResponse {
  can_delete: boolean
  article_count: number
  child_count?: number
  reason?: string
}

export interface FolderTreeResponse {
  items: FolderNodeDTO[]
}

export interface FolderListResponse {
  items: FolderDTO[]
}

export interface ApiErrorResponse {
  error: string
  message: string
  code?: string
}

// ─── HTTP Client Contract ───

export interface TreeHttpClient {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, data?: unknown) => Promise<T>
  put: <T>(url: string, data?: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
}

// ─── Error Mapping ───

const ERROR_PATTERN_MAP: Array<[RegExp, TreeErrorCode]> = [
  [/folder name already exists/i, 'DUPLICATE_NAME'],
  [/invalid folder name/i, 'INVALID_NAME'],
  [/parent folder not found/i, 'PARENT_NOT_FOUND'],
  [/cannot move folder to its own descendant/i, 'CIRCULAR_REFERENCE'],
  [/max folder depth exceeded/i, 'MAX_DEPTH_EXCEEDED'],
  [/cannot delete folder with children/i, 'HAS_CHILDREN'],
  [/folder has articles/i, 'FOLDER_HAS_ARTICLES'],
  [/folder not found/i, 'NOT_FOUND'],
]

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

function mapApiError(err: unknown): TreeError {
  const msg = extractErrorMessage(err)
  let code: TreeErrorCode = 'UNKNOWN'

  for (const [pattern, errorCode] of ERROR_PATTERN_MAP) {
    if (pattern.test(msg)) {
      code = errorCode
      break
    }
  }

  if (code === 'UNKNOWN' && (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout'))) {
    code = 'NETWORK_ERROR'
  }

  return { code, message: msg, raw: err }
}

// ─── DTO → TreeNodeData Mapping ───

function mapFolderNode(dto: FolderNodeDTO): TreeNodeData {
  return {
    id: dto.id,
    label: dto.name,
    parentId: dto.parent_id,
    sortOrder: dto.sort_order,
    depth: dto.depth,
    itemCount: dto.item_count,
    totalItemCount: dto.total_item_count,
    icon: dto.children?.length ? 'folder' : 'file',
    children: dto.children?.map(mapFolderNode),
  }
}

function mapFolderDTO(dto: FolderDTO): TreeNodeData {
  return {
    id: dto.id,
    label: dto.name,
    parentId: dto.parent_id,
    sortOrder: dto.sort_order,
    depth: dto.depth,
    itemCount: dto.item_count,
    totalItemCount: dto.total_item_count,
    icon: 'folder',
  }
}

// ─── Adapter Factory ───

export interface ArticleFolderAdapterOptions {
  httpClient: TreeHttpClient
  baseUrl: string
}

export function createArticleFolderAdapter(
  options: ArticleFolderAdapterOptions,
): {
  requestHooks: TreeRequestHooks
  checkDelete: CheckDeleteFn
} {
  const { httpClient, baseUrl } = options
  const url = (path: string): string => `${baseUrl}${path}`

  const requestHooks: TreeRequestHooks = {
    async loadTree(): Promise<TreeNodeData[]> {
      try {
        const resp = await httpClient.get<FolderTreeResponse>(url('/tree'))
        const items = resp.items ?? []
        return items.map(mapFolderNode)
      } catch (err) {
        throw mapApiError(err)
      }
    },

    async loadChildren(parentId: string | number): Promise<TreeNodeData[]> {
      try {
        const resp = await httpClient.get<FolderListResponse>(
          url(`/${parentId}/children`),
        )
        const items = resp.items ?? []
        return items.map(mapFolderDTO)
      } catch (err) {
        throw mapApiError(err)
      }
    },

    async create(params: {
      parentId: string | number | null
      name: string
    }): Promise<TreeNodeData> {
      try {
        const body: CreateFolderRequest = {
          name: params.name,
          parent_id: params.parentId as number | null,
        }
        const data = await httpClient.post<FolderDTO>(url(''), body)
        return mapFolderDTO(data)
      } catch (err) {
        throw mapApiError(err)
      }
    },

    async update(params: {
      id: string | number
      name: string
    }): Promise<TreeNodeData> {
      try {
        const body: UpdateFolderRequest = { name: params.name }
        const data = await httpClient.put<FolderDTO>(
          url(`/${params.id}`),
          body,
        )
        return mapFolderDTO(data)
      } catch (err) {
        throw mapApiError(err)
      }
    },

    async delete(id: string | number): Promise<void> {
      try {
        await httpClient.delete(url(`/${id}`))
      } catch (err) {
        throw mapApiError(err)
      }
    },

    async move(params: {
      id: string | number
      newParentId: string | number | null
    }): Promise<void> {
      try {
        const body: MoveFolderRequest = {
          new_parent_id: params.newParentId as number | null,
        }
        await httpClient.put(url(`/${params.id}/move`), body)
      } catch (err) {
        throw mapApiError(err)
      }
    },

    async reorder(params: {
      id: string | number
      newOrder: number
    }): Promise<void> {
      try {
        const body: ReorderFolderRequest = { new_order: params.newOrder }
        await httpClient.put(url(`/${params.id}/reorder`), body)
      } catch (err) {
        throw mapApiError(err)
      }
    },
  }

  const checkDelete: CheckDeleteFn = async (
    _id: string | number,
  ): Promise<DeleteConstraint> => {
    // 后端在 DELETE handler 内直接检查约束并返回错误，
    // 无独立 can-delete 端点，前端始终允许发起删除请求。
    return { canDelete: true }
  }

  return { requestHooks, checkDelete }
}

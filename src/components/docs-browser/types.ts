export interface DocDirectory {
  name: string
  path: string
}

export interface DocFileItem {
  name: string
  title?: string
  path: string
  size: number
  is_dir: boolean
  mod_time: number
  directory: string
}

export interface DocFileContent {
  name: string
  path: string
  content: string
  size: number
}

export type DocSortOrder = 'desc' | 'asc'
export type DocSortBy = 'mod_time' | 'name'

export interface DocListFilesResponse {
  files: DocFileItem[]
  total: number
  order: DocSortOrder
  sort_by?: DocSortBy
  directories: Record<string, number>
}

export interface DocListDirectoriesResponse {
  directories: DocDirectory[]
}

export interface DocsApiAdapter {
  getFileList: (order: DocSortOrder, sortBy?: DocSortBy) => Promise<DocListFilesResponse>
  getDirectories: () => Promise<DocListDirectoriesResponse>
  getFileContent: (dir: string, path: string) => Promise<DocFileContent>
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange'

export interface SerializedRange {
  startContainerPath: string
  startOffset: number
  endContainerPath: string
  endOffset: number
}

export interface HighlightItem {
  id: number
  source_type: string
  source_id?: number
  source_key: string
  color: string
  text: string
  note: string
  serialized_range: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HighlightSourceQuery {
  source_type: string
  source_id?: number
  source_key: string
}

export interface CreateHighlightInput {
  source_type: string
  source_id?: number
  source_key: string
  color: string
  text: string
  note?: string
  serialized_range: string
  sort_order: number
}

export interface HighlightApiAdapter {
  listHighlights: (query: HighlightSourceQuery) => Promise<{ items: HighlightItem[] }>
  createHighlight: (input: CreateHighlightInput) => Promise<HighlightItem>
  updateHighlight: (id: number, data: Partial<Pick<HighlightItem, 'color' | 'note' | 'sort_order'>>) => Promise<void>
  deleteHighlight: (id: number) => Promise<void>
  copyText: (query: HighlightSourceQuery) => Promise<{ text: string }>
  batchDelete: (query: HighlightSourceQuery) => Promise<void>
}

export interface RDocsBrowserProps {
  api: DocsApiAdapter
  highlightApi?: HighlightApiAdapter
  cacheKey?: string
  height?: string
  enableToc?: boolean
  enableCache?: boolean
  enableFullscreen?: boolean
  enableHighlight?: boolean
  activeFileTag?: string
}

export interface RDocsBrowserEmits {
  (e: 'file-select', file: DocFileItem): void
  (e: 'file-tag-change', tag: string): void
  (e: 'directory-change', dir: string): void
  (e: 'refresh'): void
  (e: 'cache-clear'): void
}

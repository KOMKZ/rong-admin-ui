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

export interface DocListFilesResponse {
  files: DocFileItem[]
  total: number
  order: DocSortOrder
  directories: Record<string, number>
}

export interface DocListDirectoriesResponse {
  directories: DocDirectory[]
}

export interface DocsApiAdapter {
  getFileList: (order: DocSortOrder) => Promise<DocListFilesResponse>
  getDirectories: () => Promise<DocListDirectoriesResponse>
  getFileContent: (dir: string, path: string) => Promise<DocFileContent>
}

export interface RDocsBrowserProps {
  api: DocsApiAdapter
  cacheKey?: string
  height?: string
  enableToc?: boolean
  enableCache?: boolean
  enableFullscreen?: boolean
}

export interface RDocsBrowserEmits {
  (e: 'file-select', file: DocFileItem): void
  (e: 'directory-change', dir: string): void
  (e: 'refresh'): void
  (e: 'cache-clear'): void
}

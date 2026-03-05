import type { VNode } from 'vue'

export type UploadListType = 'text' | 'image' | 'image-card'

export interface UploadFile {
  id: string
  name: string
  status: 'pending' | 'uploading' | 'success' | 'error' | 'paused'
  url?: string
  thumbUrl?: string
  size?: number
  type?: string
  percent?: number
  error?: string
  /** Uploaded chunks for resume capability */
  uploadedChunks?: number
  /** Total chunks (set by chunked upload strategy) */
  totalChunks?: number
}

export interface UploadRequestOptions {
  file: File
  onProgress: (percent: number) => void
  onSuccess: (response: unknown) => void
  onError: (error: Error) => void
  /** AbortSignal for cancellation */
  signal?: AbortSignal
}

/** Chunked upload strategy interface (pluggable, not bound to a backend) */
export interface ChunkedUploadStrategy {
  /** Size per chunk in bytes; defaults to 5MB */
  chunkSize?: number
  /** Upload a single chunk; returns a promise with the chunk response */
  uploadChunk: (options: ChunkUploadOptions) => Promise<unknown>
  /** Merge all uploaded chunks into a final file */
  mergeChunks: (options: ChunkMergeOptions) => Promise<{ url: string }>
  /** Query which chunks have already been uploaded (for resume) */
  queryUploadedChunks?: (fileHash: string) => Promise<number[]>
}

export interface ChunkUploadOptions {
  file: File
  fileHash: string
  chunkIndex: number
  chunkTotal: number
  chunkBlob: Blob
  onProgress: (percent: number) => void
  signal?: AbortSignal
}

export interface ChunkMergeOptions {
  fileHash: string
  fileName: string
  chunkTotal: number
}

/** Concurrent upload queue configuration */
export interface UploadQueueConfig {
  /** Max concurrent uploads; defaults to 3 */
  concurrency?: number
  /** Max retries per file on failure; defaults to 2 */
  maxRetries?: number
  /** Delay between retries in ms; defaults to 1000 */
  retryDelay?: number
}

export interface FileUploadProps {
  fileList: UploadFile[]
  action?: string
  accept?: string
  maxCount?: number
  maxSize?: number
  multiple?: boolean
  disabled?: boolean
  listType?: UploadListType
  draggable?: boolean
  customRequest?: (options: UploadRequestOptions) => void
  showRemoveButton?: boolean
  showPreviewButton?: boolean
  /** Enable concurrent upload queue */
  queueConfig?: UploadQueueConfig
  /** Chunked upload strategy (enables chunked upload when provided) */
  chunkedStrategy?: ChunkedUploadStrategy
}

export interface FileUploadEmits {
  'update:fileList': [fileList: UploadFile[]]
  beforeUpload: [file: File, done: (proceed: boolean) => void]
  change: [info: { file: UploadFile; fileList: UploadFile[] }]
  remove: [file: UploadFile]
  preview: [file: UploadFile]
  /** Fired when a file's retry count is exhausted */
  retryExhausted: [file: UploadFile]
}

export interface FileUploadSlots {
  default?: () => VNode
  trigger?: () => VNode
  fileItem?: (params: { file: UploadFile }) => VNode
  tip?: () => VNode
}

export interface FileUploadExpose {
  submit: () => void
  clear: () => void
  abort: (fileId: string) => void
  /** Pause a specific file upload (chunked only) */
  pause: (fileId: string) => void
  /** Resume a paused file upload (chunked only) */
  resume: (fileId: string) => void
  /** Retry a failed file upload */
  retry: (fileId: string) => void
}

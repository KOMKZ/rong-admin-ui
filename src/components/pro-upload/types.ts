import type { VNode } from 'vue'

/* ─── File Item ─── */

export type ProUploadFileStatus =
  | 'pending'
  | 'queued'
  | 'uploading'
  | 'success'
  | 'error'

export interface ProUploadFileItem {
  uid: string
  name: string
  size: number
  type: string
  status: ProUploadFileStatus
  progress: number
  url?: string
  thumbUrl?: string
  storageId?: string
  fileId?: number
  error?: string
  /** Raw File object (only present before/during upload) */
  raw?: File
  /** Retry count consumed so far */
  _retryCount?: number
}

/* ─── Storage Integration ─── */

export interface ProUploadPayloadContext {
  storage?: string
  category?: string
  businessId?: string
  businessType?: string
}

export interface ProUploadRawResponse {
  id?: number
  file_id?: number
  storage_id?: string
  url?: string
  original_name?: string
  original_filename?: string
  size?: number
  file_size?: number
  content_type?: string
  [key: string]: unknown
}

/* ─── Request ─── */

export interface ProUploadRequestOptions {
  file: File
  formData: FormData
  onProgress: (percent: number) => void
  onSuccess: (response: unknown) => void
  onError: (error: Error) => void
  signal: AbortSignal
}

/* ─── Retry Config ─── */

export interface ProUploadRetryConfig {
  maxRetries?: number
  retryDelay?: number
}

/* ─── Locale / i18n ─── */

export interface ProUploadLocale {
  dropHint?: string
  clickHint?: string
  removeConfirm?: string
  retryLabel?: string
  deleteLabel?: string
  previewLabel?: string
  exceedCount?: string
  exceedSize?: string
  invalidType?: string
  uploadFailed?: string
}

export const defaultLocale: ProUploadLocale = {
  dropHint: '拖拽文件到此处，或',
  clickHint: '点击上传',
  removeConfirm: '确定删除？',
  retryLabel: '重试',
  deleteLabel: '删除',
  previewLabel: '预览',
  exceedCount: '文件数量超出限制',
  exceedSize: '文件大小超出限制',
  invalidType: '文件类型不支持',
  uploadFailed: '上传失败',
}

/* ─── Props ─── */

export interface ProUploadProps {
  /** Controlled value — list of file items */
  value?: ProUploadFileItem[]
  /** Multiple file selection */
  multiple?: boolean
  /** Accepted file types (e.g. ".jpg,.png" or "image/*") */
  accept?: string
  /** Max number of files */
  maxCount?: number
  /** Max file size in MB */
  maxSizeMB?: number
  /** Disabled state */
  disabled?: boolean
  /** Read-only state (shows files but no add/remove) */
  readonly?: boolean
  /** Enable drag-and-drop */
  draggable?: boolean
  /** Concurrent upload limit */
  concurrency?: number
  /** Retry configuration */
  retryConfig?: ProUploadRetryConfig
  /** Storage domain type (e.g. "avatar", "image", "document") */
  storage?: string
  /** Category for file metadata */
  category?: string
  /** Business ID for file metadata */
  businessId?: string
  /** Business type for file metadata */
  businessType?: string
  /** Display mode */
  listType?: 'text' | 'picture' | 'picture-card'
  /** Custom upload request (pluggable network layer) */
  customRequest?: (options: ProUploadRequestOptions) => void
  /** Hook before upload; return false or Promise<false> to prevent */
  beforeUpload?: (file: File) => boolean | Promise<boolean>
  /** Build FormData payload; override to add custom fields */
  buildUploadPayload?: (file: File, ctx: ProUploadPayloadContext) => FormData
  /** Parse raw server response into FileItem fields */
  parseResponse?: (raw: unknown) => Partial<ProUploadFileItem>
  /** Custom file item renderer */
  renderItem?: (params: { file: ProUploadFileItem }) => VNode
  /** i18n text overrides */
  locale?: Partial<ProUploadLocale>
}

/* ─── Emits ─── */

export interface ProUploadEmits {
  (e: 'change', fileList: ProUploadFileItem[]): void
  (e: 'update:value', fileList: ProUploadFileItem[]): void
  (e: 'success', file: ProUploadFileItem, response: unknown): void
  (e: 'error', file: ProUploadFileItem, error: Error): void
  (e: 'preview', file: ProUploadFileItem): void
  (e: 'remove', file: ProUploadFileItem): void
  (e: 'exceed', info: { type: 'count' | 'size' | 'accept'; file: File; limit: number | string }): void
}

/* ─── Slots ─── */

export interface ProUploadSlots {
  trigger?: () => VNode
  tip?: () => VNode
  fileItem?: (params: { file: ProUploadFileItem }) => VNode
}

/* ─── Expose ─── */

export interface ProUploadExpose {
  submit: () => void
  clear: () => void
  abort: (uid: string) => void
  retry: (uid: string) => void
  getFileList: () => ProUploadFileItem[]
}

import type {
  ProUploadFileItem,
  ProUploadProps,
  ProUploadRequestOptions,
} from '../pro-upload/types'
import type { VNode } from 'vue'

export type MediaResourceClass = 'image' | 'video' | 'audio' | 'document' | 'archive'

/** 可持久化引用与可展示信息一体化的媒体资源读模型。 */
export interface MediaResource {
  storageId: string
  url: string
  mediaClass: MediaResourceClass
  contentType: string
  filename: string
  size: number
  width?: number
  height?: number
  durationMs?: number
  thumbnail?: MediaResource | null
}

export interface MediaResourceUploadProps {
  modelValue?: MediaResource | null
  mediaClass: MediaResourceClass
  generateThumbnail?: boolean
  timeoutMs?: number
  storage: string
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  readonly?: boolean
  draggable?: boolean
  action?: string
  headers?: Record<string, string>
  withCredentials?: boolean
  businessId?: string
  businessType?: string
  listType?: ProUploadProps['listType']
  customRequest?: (options: ProUploadRequestOptions) => void
  dataTestid?: string
}

export interface MediaResourceUploadEmits {
  (event: 'update:modelValue', value: MediaResource | null): void
  (event: 'success', resource: MediaResource, file: ProUploadFileItem, response: unknown): void
  (event: 'error', file: ProUploadFileItem, error: Error): void
  (event: 'remove', resource: MediaResource | null): void
}

export interface MediaResourceUploadSlots {
  tip?: () => VNode
}

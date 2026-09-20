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
  /** 读模型媒体类别，用于回填与响应适配兜底；上传 payload 的 media_class 由 upload case 写入。 */
  mediaClass: MediaResourceClass
  /** 必选：由调用方用 upload case 构造（storage / business_type / media_class 等策略字段在这里写入）。 */
  customRequest: (options: ProUploadRequestOptions) => void
  timeoutMs?: number
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  readonly?: boolean
  draggable?: boolean
  listType?: ProUploadProps['listType']
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

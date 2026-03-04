import type { VNode } from 'vue'

export type UploadListType = 'text' | 'image' | 'image-card'

export interface UploadFile {
  id: string
  name: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  thumbUrl?: string
  size?: number
  type?: string
  percent?: number
  error?: string
}

export interface UploadRequestOptions {
  file: File
  onProgress: (percent: number) => void
  onSuccess: (response: unknown) => void
  onError: (error: Error) => void
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
}

export interface FileUploadEmits {
  'update:fileList': [fileList: UploadFile[]]
  beforeUpload: [file: File, done: (proceed: boolean) => void]
  change: [info: { file: UploadFile; fileList: UploadFile[] }]
  remove: [file: UploadFile]
  preview: [file: UploadFile]
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
}

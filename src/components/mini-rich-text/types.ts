// MiniRichTextImageUploadAdapter 上传结果合同：url 必填；storageId 为稳定资源引用，
// 存在时编辑器把 data-storage-id 写入 img（读侧按它重建展示 URL，ticket 000241）。
export interface MiniRichTextImageUploadAdapter {
  upload: (file: File) => Promise<{ url: string; storageId?: string; alt?: string }>
}

export type MiniRichTextPreviewMode = 'mini' | 'web'
export type MiniRichTextBlockTag = 'p' | 'h2' | 'h3' | 'blockquote'

export interface MiniRichTextEditorProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  height?: string | number
  imageUploadAdapter?: MiniRichTextImageUploadAdapter
  enableFullscreenPreview?: boolean
}

export interface MiniRichTextPreviewProps {
  content?: string
  emptyText?: string
}

export interface MiniRichTextCompatibilityIssue {
  level: 'warning' | 'error'
  message: string
}

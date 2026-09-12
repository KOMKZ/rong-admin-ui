export interface MiniRichTextImageUploadAdapter {
  upload: (file: File) => Promise<{ url: string; alt?: string }>
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

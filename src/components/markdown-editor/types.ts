export type MarkdownEditorViewMode = 'split' | 'edit' | 'preview'

export interface RMarkdownEditorProps {
  modelValue?: string
  viewMode?: MarkdownEditorViewMode
  defaultSplitRatio?: number
  previewScale?: number
  height?: string | number
  placeholder?: string
  readonly?: boolean
  showModeToggle?: boolean
  showScaleControl?: boolean
}

export interface RMarkdownEditorEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:viewMode', mode: MarkdownEditorViewMode): void
  (e: 'save', content: string): void
}

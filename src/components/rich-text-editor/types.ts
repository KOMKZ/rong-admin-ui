import type { Editor, Extension, Mark, Node } from '@tiptap/vue-3'

export type RichTextEditorTheme = 'classic' | 'minimal' | 'midnight' | 'aurora'

export type TiptapExtension = Extension | Mark | Node

export interface ImageUploadAdapter {
  upload: (file: File) => Promise<string>
}

export interface FileUploadAdapter {
  upload: (file: File) => Promise<{ url: string; name?: string }>
}

export interface ToolbarConfig {
  heading?: boolean | number[]
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  highlight?: boolean
  link?: boolean
  image?: boolean
  table?: boolean
  codeBlock?: boolean
  blockquote?: boolean
  bulletList?: boolean
  orderedList?: boolean
  taskList?: boolean
  horizontalRule?: boolean
  undo?: boolean
  redo?: boolean
}

export interface RichTextEditorI18n {
  bold?: string
  italic?: string
  underline?: string
  code?: string
  codeBlock?: string
  highlight?: string
  heading?: string
  bulletList?: string
  orderedList?: string
  taskList?: string
  table?: string
  insertTable?: string
  undo?: string
  redo?: string
  image?: string
  link?: string
  blockquote?: string
  horizontalRule?: string
  mermaid?: string
  gridBlock?: string
  toc?: string
  attachment?: string
}

export interface RRichTextEditorProps {
  modelValue?: string
  placeholder?: string
  readonly?: boolean
  preview?: boolean
  bordered?: boolean
  theme?: RichTextEditorTheme
  height?: string | number
  maxHeight?: string | number
  toolbar?: ToolbarConfig | false
  extensions?: TiptapExtension[]
  imageUploadAdapter?: ImageUploadAdapter
  fileUploadAdapter?: FileUploadAdapter
  i18n?: RichTextEditorI18n
}

export interface RRichTextEditorEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'ready', editor: Editor): void
}

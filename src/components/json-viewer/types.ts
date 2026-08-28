export type JsonViewerValue = unknown

export type JsonViewerSize = 'small' | 'medium' | 'large'

export type JsonViewerTokenType =
  | 'plain'
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'punctuation'

export interface JsonViewerToken {
  text: string
  type: JsonViewerTokenType
}

export interface JsonViewerLine {
  number: number
  tokens: JsonViewerToken[]
}

export interface JsonViewerProps {
  value?: JsonViewerValue
  title?: string
  size?: JsonViewerSize
  height?: number | string
  maxHeight?: number | string
  emptyText?: string
  copyable?: boolean
  expandable?: boolean
  showHeader?: boolean
}

export interface JsonViewerExpose {
  open: () => void
  close: () => void
  copy: () => Promise<void>
}

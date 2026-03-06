export type MarkdownPreviewTheme = 'github' | 'github-dark'

export interface RMarkdownPreviewProps {
  content: string
  scale?: number
  theme?: MarkdownPreviewTheme
  enableMermaid?: boolean
  enableHighlight?: boolean
  highlightTheme?: string
}

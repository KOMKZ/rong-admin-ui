export interface ShowcaseLayoutProps {
  title: string
  description?: string
  version?: string
  componentName?: string
}

export interface DemoSectionProps {
  title: string
  description?: string
  collapsed?: boolean
}

export interface PropsTableRow {
  name: string
  type: string
  default?: string
  required?: boolean
  description: string
}

export interface PropsTableProps {
  title?: string
  rows: PropsTableRow[]
}

export interface QualityPanelItem {
  label: string
  status: 'pass' | 'fail' | 'warn' | 'skip'
  detail?: string
}

export interface QualityPanelProps {
  title?: string
  items: QualityPanelItem[]
}

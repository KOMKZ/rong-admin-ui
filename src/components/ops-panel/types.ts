export interface OpsPanelProps {
  tab: string
}

export interface OpsPanelEmits {
  'update:tab': [value: string]
}

export interface OpsChartPlaceholderProps {
  height?: string
  label?: string
}

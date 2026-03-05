import type { VNode } from 'vue'

export interface DescriptionItem {
  key: string
  label: string
  value?: string | number | boolean | null
  span?: number
  render?: () => VNode
  copyable?: boolean
  emptyText?: string
}

export interface DescriptionGroup {
  title?: string
  icon?: string
  items: DescriptionItem[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface DescriptionsPanelProps {
  items?: DescriptionItem[]
  groups?: DescriptionGroup[]
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  bordered?: boolean
  size?: 'small' | 'medium' | 'large'
  title?: string
  colon?: boolean
  labelWidth?: number | string
  layout?: 'horizontal' | 'vertical'
  emptyText?: string
}

export interface DescriptionsPanelSlots {
  title?: () => VNode
  extra?: () => VNode
  [key: `item-${string}`]: (params: { item: DescriptionItem }) => VNode
}

export interface DescriptionsPanelExpose {
  toggleGroup: (index: number) => void
  expandAll: () => void
  collapseAll: () => void
}

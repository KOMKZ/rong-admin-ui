import type { VNode } from 'vue'

export type TableDensity = 'compact' | 'default' | 'comfortable'

export interface ColumnPreset {
  key: string
  label: string
  visible: boolean
  fixed?: 'left' | 'right' | false
}

export interface TableToolbarProProps {
  title?: string
  refreshable?: boolean
  exportable?: boolean
  densitySwitchable?: boolean
  fullscreenable?: boolean
  columnConfigurable?: boolean
  currentDensity?: TableDensity
  columnPresets?: ColumnPreset[]
  loading?: boolean
}

export interface TableToolbarProEmits {
  refresh: []
  export: []
  'update:density': [density: TableDensity]
  'update:fullscreen': [fullscreen: boolean]
  'update:columnPresets': [presets: ColumnPreset[]]
}

export interface TableToolbarProSlots {
  prefix?: () => VNode
  extra?: () => VNode
  title?: () => VNode
}

export interface TableToolbarProExpose {
  toggleFullscreen: () => void
  resetColumns: () => void
}

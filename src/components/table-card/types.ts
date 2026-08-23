import type { ColumnPreset, TableDensity, TableToolbarAction } from '../table-toolbar/types'

export interface TableCardProps {
  title?: string
  loading?: boolean
  refreshable?: boolean
  exportable?: boolean
  exportLabel?: string
  exportConfirmMessage?: string
  actions?: TableToolbarAction[]
  densitySwitchable?: boolean
  fullscreenable?: boolean
  columnConfigurable?: boolean
  currentDensity?: TableDensity
  columnPresets?: ColumnPreset[]
  dataTestid?: string
}

export interface TableCardEmits {
  refresh: []
  export: []
  action: [key: string]
  'update:density': [density: TableDensity]
  'update:fullscreen': [fullscreen: boolean]
  'update:columnPresets': [presets: ColumnPreset[]]
}

export type { ColumnPreset, TableDensity, TableToolbarAction }

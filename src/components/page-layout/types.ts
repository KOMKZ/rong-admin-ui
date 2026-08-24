import type { ColumnPreset, TableDensity, TableToolbarAction } from '../table-toolbar/types'

export type PageTone = 'default' | 'plain'
export type FormPageWidth = 'narrow' | 'medium' | 'wide' | 'full'

export interface PageProps {
  dataTestid?: string
  tone?: PageTone
}

export interface SectionCardProps {
  title?: string
  description?: string
  compact?: boolean
  flush?: boolean
  dataTestid?: string
}

export interface ListPageProps {
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
  tableTestid?: string
}

export interface ListPageEmits {
  refresh: []
  export: []
  action: [key: string]
  'update:density': [density: TableDensity]
  'update:fullscreen': [fullscreen: boolean]
  'update:columnPresets': [presets: ColumnPreset[]]
}

export interface FormPageProps {
  title?: string
  description?: string
  width?: FormPageWidth
  dataTestid?: string
  cardTestid?: string
}

export interface DetailPageProps {
  dataTestid?: string
}

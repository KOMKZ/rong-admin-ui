import type { FormFieldSchema } from '../form-renderer/types'

export interface SettingsBoardCard {
  key: string
  title: string
  description?: string
  icon?: string
  fields: FormFieldSchema[]
}

export interface SettingsBoardTab {
  key: string
  title: string
  description?: string
  cards: SettingsBoardCard[]
}

export interface SettingsBoardProps {
  title: string
  description?: string
  tabs: SettingsBoardTab[]
  model: Record<string, unknown>
  activeTab?: string
  loading?: boolean
  saving?: boolean
  statusText?: string
  savedAtText?: string
  cols?: number
}

export interface SettingsBoardEmits {
  'update:activeTab': [value: string]
  'update:model': [model: Record<string, unknown>]
  refresh: []
  reset: [tab: SettingsBoardTab]
  save: [tab: SettingsBoardTab]
}

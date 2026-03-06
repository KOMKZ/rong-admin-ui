import type { Component } from 'vue'

export type SettingsFieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'switch'
  | 'number'
  | 'color'
  | 'date-picker'
  | 'radio'
  | 'custom'

export interface SettingsFieldOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface SettingsField {
  key: string
  label: string
  description?: string
  type: SettingsFieldType
  value: string
  component?: string
  componentParams?: Record<string, unknown>
  options?: SettingsFieldOption[]
  placeholder?: string
  disabled?: boolean
  rules?: SettingsFieldRule[]
  customComponent?: Component
  customComponentProps?: Record<string, unknown>
}

export interface SettingsFieldRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  validator?: (value: string) => boolean | string | Promise<boolean | string>
}

export interface SettingsGroup {
  key: string
  label: string
  icon?: string
  description?: string
  fields: SettingsField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface SettingsManagerAdapter {
  fetchGroups: () => Promise<SettingsGroup[]>
  saveField: (key: string, value: string) => Promise<void>
  saveBatch?: (fields: Array<{ key: string; value: string }>) => Promise<void>
}

export interface SettingsManagerProps {
  adapter: SettingsManagerAdapter
  title?: string
  description?: string
  showSearch?: boolean
  showGroupNav?: boolean
  saveMode?: 'field' | 'batch'
  layout?: 'vertical' | 'card'
}

export interface SettingsManagerEmits {
  saved: [key: string, value: string]
  'batch-saved': [fields: Array<{ key: string; value: string }>]
  error: [error: Error]
  loaded: [groups: SettingsGroup[]]
}

export interface SettingsManagerExpose {
  reload: () => Promise<void>
  getValues: () => Record<string, string>
  getDirtyFields: () => Array<{ key: string; value: string }>
  resetDirty: () => void
  saveAll: () => Promise<void>
}

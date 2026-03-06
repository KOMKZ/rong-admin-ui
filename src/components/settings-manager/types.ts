import type { Component } from 'vue'
import type { ProUploadRequestOptions } from '../pro-upload/types'

export type SettingsFieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'switch'
  | 'number'
  | 'color'
  | 'date-picker'
  | 'radio'
  | 'image'
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
  /** image type: accepted file types (default "image/*") */
  accept?: string
  /** image type: max file size in MB */
  maxSizeMB?: number
  /** image type: max number of files (default 1) */
  maxCount?: number
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
  /** Custom upload request for image fields (passed to RProUpload) */
  customUploadRequest?: (options: ProUploadRequestOptions) => void
  /** Parse upload response to extract URL */
  parseUploadResponse?: (raw: unknown) => { url: string; storageId?: string }
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

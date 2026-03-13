export interface MenuPresetItem {
  id: string | number
  parentId: string | number | null
  name: string
  path: string
  icon?: string
  orderNum?: number
  hidden?: boolean
  meta?: Record<string, unknown>
  children?: MenuPresetItem[]
}

export interface MenuPreset {
  id: string
  name: string
  readonly?: boolean
  items: MenuPresetItem[]
  createdAt?: number
  updatedAt?: number
}

export interface MenuPresetSavePayload {
  presetId: string
  items: MenuPresetItem[]
}

export interface MenuPresetEditorProps {
  presets: MenuPreset[]
  activePresetId: string
  defaultPresetId?: string
  loading?: boolean
}

export interface MenuPresetEditorEmits {
  'update:activePresetId': [presetId: string]
  'create-preset': [name: string]
  'delete-preset': [presetId: string]
  'set-default-preset': [presetId: string]
  'save-preset': [payload: MenuPresetSavePayload]
}

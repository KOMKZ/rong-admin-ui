import type { VNode } from 'vue'
import type { FormFieldSchema } from '../form-renderer/types'

export interface FilterScheme {
  id: string
  name: string
  values: Record<string, unknown>
  createdAt: number
}

export interface QuickFilter {
  key: string
  label: string
  value: unknown
  icon?: string
}

export interface FilterBarProProps {
  schema: FormFieldSchema[]
  modelValue: Record<string, unknown>
  collapsible?: boolean
  defaultCollapsed?: boolean
  quickFilters?: QuickFilter[]
  storageKey?: string
  savedSchemes?: FilterScheme[]
  maxVisibleFields?: number
  cols?: number
  resetLabel?: string
  searchLabel?: string
  advancedLabel?: string
  saveSchemeLabel?: string
}

export interface FilterBarProEmits {
  'update:modelValue': [values: Record<string, unknown>]
  search: [values: Record<string, unknown>]
  reset: []
  toggleAdvanced: [expanded: boolean]
  saveScheme: [scheme: Omit<FilterScheme, 'id' | 'createdAt'>]
  deleteScheme: [id: string]
  loadScheme: [scheme: FilterScheme]
}

export interface FilterBarProSlots {
  extra?: () => VNode
  quickFilter?: (params: { filter: QuickFilter; active: boolean }) => VNode
  beforeActions?: () => VNode
  afterActions?: () => VNode
}

export interface FilterBarProExpose {
  reset: () => void
  search: () => void
  getValues: () => Record<string, unknown>
  setValues: (values: Record<string, unknown>) => void
  toggleAdvanced: (expanded?: boolean) => void
}

import type { VNode } from 'vue'

export interface CheckCardOption {
  value: string | number
  title: string
  description?: string
  icon?: string
  avatar?: string
  extra?: string
  disabled?: boolean
  tag?: string
  tagType?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export interface CheckCardGroupProps {
  options: CheckCardOption[]
  modelValue: (string | number)[] | string | number | null
  multiple?: boolean
  columns?: number | 'auto'
  cardMinWidth?: number
  gap?: number
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  bordered?: boolean
}

export interface CheckCardGroupEmits {
  'update:modelValue': [value: (string | number)[] | string | number | null]
  change: [value: (string | number)[] | string | number | null]
}

export interface CheckCardGroupSlots {
  card?: (params: { option: CheckCardOption; checked: boolean; disabled: boolean }) => VNode
  extra?: (params: { option: CheckCardOption }) => VNode
}

export interface CheckCardGroupExpose {
  selectAll: () => void
  clearAll: () => void
  getSelected: () => (string | number)[]
}

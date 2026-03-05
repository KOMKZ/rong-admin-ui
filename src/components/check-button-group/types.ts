export interface CheckButtonOption {
  value: string | number
  label: string
  icon?: string
  disabled?: boolean
}

export interface CheckButtonGroupProps {
  options: CheckButtonOption[]
  modelValue: (string | number)[] | string | number | null
  multiple?: boolean
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  block?: boolean
}

export interface CheckButtonGroupEmits {
  'update:modelValue': [value: (string | number)[] | string | number | null]
  change: [value: (string | number)[] | string | number | null]
}

export interface CheckButtonGroupExpose {
  selectAll: () => void
  clearAll: () => void
  getSelected: () => (string | number)[]
}

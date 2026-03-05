import type { VNode } from 'vue'

export interface BatchAction {
  key: string
  label: string
  icon?: string
  danger?: boolean
  confirmMessage?: string
  disabled?: boolean
}

export interface BatchActionBarProps {
  selectedCount: number
  selectedKeys?: (string | number)[]
  actions: BatchAction[]
  visible?: boolean
  clearLabel?: string
  countTemplate?: string
}

export interface BatchActionBarEmits {
  action: [key: string, selectedKeys: (string | number)[]]
  clear: []
}

export interface BatchActionBarSlots {
  extra?: (params: { selectedCount: number }) => VNode
  prefix?: () => VNode
}

export interface BatchActionBarExpose {
  clear: () => void
}

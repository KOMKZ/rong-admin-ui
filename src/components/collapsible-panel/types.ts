import type { Ref } from 'vue'

export interface CollapsiblePanelProps {
  title: string
  defaultExpanded?: boolean
  icon?: string
  badge?: string | number
  bordered?: boolean
}

export interface CollapsiblePanelExpose {
  expanded: Ref<boolean>
  toggle: () => void
}

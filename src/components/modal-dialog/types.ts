import type { VNode } from 'vue'

export type ModalPreset = 'dialog' | 'confirm' | 'info' | 'success' | 'warning' | 'error'

export interface ModalDialogProps {
  visible: boolean
  title?: string
  preset?: ModalPreset
  width?: number | string
  closable?: boolean
  maskClosable?: boolean
  closeOnEsc?: boolean
  loading?: boolean
  positiveText?: string
  negativeText?: string
  showFooter?: boolean
  autoFocus?: boolean
  trapFocus?: boolean
}

export interface ModalDialogEmits {
  'update:visible': [visible: boolean]
  confirm: []
  cancel: []
  afterOpen: []
  afterClose: []
}

export interface ModalDialogSlots {
  default?: () => VNode
  header?: () => VNode
  footer?: () => VNode
  icon?: () => VNode
}

export interface ModalDialogExpose {
  open: () => void
  close: () => void
}

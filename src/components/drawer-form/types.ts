import type { FormFieldSchema } from '../form-renderer/types'

export type DrawerPlacement = 'left' | 'right'
export type DrawerWidth = 'small' | 'medium' | 'large' | 'full' | number

export interface DrawerFormError {
  field?: string
  message: string
}

export interface RDrawerFormProps {
  visible: boolean
  title: string
  schema: FormFieldSchema[]
  model: Record<string, unknown>
  placement?: DrawerPlacement
  width?: DrawerWidth
  loading?: boolean
  submitText?: string
  cancelText?: string
  retryText?: string
  showFooter?: boolean
  closeOnMaskClick?: boolean
  labelWidth?: number
  labelPlacement?: 'left' | 'top'
  asyncValidator?: (model: Record<string, unknown>) => Promise<DrawerFormError[]>
}

export interface RDrawerFormEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:model', value: Record<string, unknown>): void
  (e: 'submit', model: Record<string, unknown>): void
  (e: 'cancel'): void
  (e: 'retry'): void
}

export interface RDrawerFormExpose {
  validate: () => Promise<boolean>
  resetFields: () => void
  clearErrors: () => void
}

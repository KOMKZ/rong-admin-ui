import type { FormFieldSchema } from '../form-renderer/types'

export type DrawerPlacement = 'left' | 'right'
export type DrawerWidth = 'small' | 'medium' | 'large' | 'full' | number

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
  showFooter?: boolean
  closeOnMaskClick?: boolean
  labelWidth?: number
  labelPlacement?: 'left' | 'top'
}

export interface RDrawerFormEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:model', value: Record<string, unknown>): void
  (e: 'submit', model: Record<string, unknown>): void
  (e: 'cancel'): void
}

export interface RDrawerFormExpose {
  validate: () => Promise<boolean>
  resetFields: () => void
}

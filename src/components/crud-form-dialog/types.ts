import type { FormFieldSchema, FormRendererExpose } from '../form-renderer/types'

export type CrudMode = 'create' | 'edit' | 'view'

export interface CrudFormDialogProps {
  visible: boolean
  mode: CrudMode
  schema: FormFieldSchema[]
  model: Record<string, unknown>
  title?: string
  width?: number | string
  loading?: boolean
  labelWidth?: number | string
  cols?: number
}

export interface CrudFormDialogEmits {
  'update:visible': [visible: boolean]
  'update:model': [model: Record<string, unknown>]
  submit: [model: Record<string, unknown>, mode: CrudMode]
  cancel: []
}

export interface CrudFormDialogExpose {
  open: (mode: CrudMode, model?: Record<string, unknown>) => void
  close: () => void
  validate: () => Promise<boolean>
  getFormRef: () => FormRendererExpose | null
}

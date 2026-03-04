import type { Component, VNode } from 'vue'

export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'daterange'
  | 'number'
  | 'upload'
  | 'custom'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface FormFieldRule {
  required?: boolean
  message?: string
  trigger?: 'blur' | 'change' | 'input'
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: unknown) => boolean | string | Promise<boolean | string>
}

export interface FormFieldSchema {
  key: string
  label: string
  type: FormFieldType
  defaultValue?: unknown
  placeholder?: string
  rules?: FormFieldRule[]
  options?: FormFieldOption[]
  span?: number
  hidden?: boolean | ((model: Record<string, unknown>) => boolean)
  disabled?: boolean | ((model: Record<string, unknown>) => boolean)
  component?: Component
  componentProps?: Record<string, unknown>
}

export interface FormRendererProps {
  schema: FormFieldSchema[]
  model: Record<string, unknown>
  labelWidth?: number | string
  labelPlacement?: 'left' | 'top'
  cols?: number
  disabled?: boolean
  readonly?: boolean
  size?: 'small' | 'medium' | 'large'
  showFeedback?: boolean
}

export interface FormRendererEmits {
  'update:model': [model: Record<string, unknown>]
  submit: [model: Record<string, unknown>]
  reset: []
}

export interface FormRendererSlots {
  actions?: () => VNode
  fieldPrefix?: (params: { field: FormFieldSchema }) => VNode
  fieldSuffix?: (params: { field: FormFieldSchema }) => VNode
}

export interface FormRendererExpose {
  validate: () => Promise<boolean>
  resetFields: () => void
  getValues: () => Record<string, unknown>
  setValues: (values: Record<string, unknown>) => void
  clearValidate: (keys?: string[]) => void
}

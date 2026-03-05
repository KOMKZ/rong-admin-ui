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

/** Async options loader — resolved when field first renders or when dependencies change */
export type AsyncOptionsLoader = (
  model: Record<string, unknown>,
) => Promise<FormFieldOption[]>

/** Field dependency declaration — when any dependency field changes, re-evaluate this field */
export interface FieldDependency {
  /** Keys of fields this field depends on */
  fields: string[]
  /** Callback to patch the schema when dependencies change */
  effect: (
    depValues: Record<string, unknown>,
    currentSchema: FormFieldSchema,
  ) => Partial<FormFieldSchema> | void
}

/** A group of fields rendered under a common heading */
export interface FormFieldGroup {
  key: string
  title: string
  /** Optional description shown under the group heading */
  description?: string
  /** Field keys belonging to this group (order matters) */
  fields: string[]
  /** Whether the group is collapsible */
  collapsible?: boolean
  /** Default collapsed state */
  defaultCollapsed?: boolean
}

export interface FormFieldSchema {
  key: string
  label: string
  type: FormFieldType
  defaultValue?: unknown
  placeholder?: string
  rules?: FormFieldRule[]
  options?: FormFieldOption[]
  /** Async option loader; takes precedence over static options when provided */
  asyncOptions?: AsyncOptionsLoader
  /** Field dependency configuration for reactive schema patching */
  dependency?: FieldDependency
  span?: number
  hidden?: boolean | ((model: Record<string, unknown>) => boolean)
  disabled?: boolean | ((model: Record<string, unknown>) => boolean)
  component?: Component
  componentProps?: Record<string, unknown>
  /** Group key this field belongs to (used with FormRendererProps.groups) */
  group?: string
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
  /** Field groups for sectioned rendering */
  groups?: FormFieldGroup[]
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
  /** Custom group header rendering */
  groupHeader?: (params: { group: FormFieldGroup }) => VNode
}

export interface FormRendererExpose {
  validate: () => Promise<boolean>
  resetFields: () => void
  getValues: () => Record<string, unknown>
  setValues: (values: Record<string, unknown>) => void
  clearValidate: (keys?: string[]) => void
  /** Dynamically patch a field's schema at runtime */
  patchField: (key: string, patch: Partial<FormFieldSchema>) => void
  /** Reload async options for a specific field */
  reloadOptions: (key: string) => Promise<void>
}

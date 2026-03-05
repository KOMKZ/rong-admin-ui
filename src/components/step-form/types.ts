import type { VNode } from 'vue'
import type { FormFieldSchema } from '../form-renderer/types'

export type StepStatus = 'wait' | 'process' | 'finish' | 'error'

export interface StepDefinition {
  key: string
  title: string
  description?: string
  icon?: string
  schema?: FormFieldSchema[]
  validate?: (values: Record<string, unknown>) => Promise<boolean | string>
}

export interface StepFormProps {
  steps: StepDefinition[]
  modelValue: Record<string, unknown>
  currentStep?: number
  finishButtonLabel?: string
  nextButtonLabel?: string
  prevButtonLabel?: string
  submitButtonLabel?: string
  showStepDescription?: boolean
  labelWidth?: number | string
  disabled?: boolean
}

export interface StepFormEmits {
  'update:modelValue': [values: Record<string, unknown>]
  'update:currentStep': [step: number]
  next: [step: number, values: Record<string, unknown>]
  prev: [step: number]
  finish: [values: Record<string, unknown>]
  stepValidateError: [step: number, error: string]
}

export interface StepFormSlots {
  [key: `step-${string}`]: (params: {
    step: StepDefinition
    values: Record<string, unknown>
    isLast: boolean
  }) => VNode
  actions?: (params: {
    currentStep: number
    isFirst: boolean
    isLast: boolean
    next: () => void
    prev: () => void
    submit: () => void
  }) => VNode
  finishResult?: (params: { values: Record<string, unknown> }) => VNode
}

export interface StepFormExpose {
  next: () => Promise<boolean>
  prev: () => void
  reset: () => void
  submit: () => Promise<boolean>
  goTo: (step: number) => void
  getCurrentValues: () => Record<string, unknown>
}

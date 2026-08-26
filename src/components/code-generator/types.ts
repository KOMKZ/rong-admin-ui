export interface CodeGeneratorTargetType {
  key: string
  label: string
  description?: string
}

export interface CodeGeneratorStrategyContext {
  targetType: string
  sourceText: string
  currentValue: string
  extra?: Record<string, unknown>
}

export interface CodeGeneratorStrategy {
  key: string
  label: string
  description?: string
  targetTypes: string[]
  generate: (context: CodeGeneratorStrategyContext) => string
}

export interface CodeGeneratorApplyPayload {
  targetType: string
  strategyKey: string
  value: string
  sourceText: string
}

export interface CodeGeneratorDialogProps {
  show: boolean
  title?: string
  targetTypes: CodeGeneratorTargetType[]
  strategies: CodeGeneratorStrategy[]
  targetType?: string
  sourceText?: string
  currentValue?: string
  extra?: Record<string, unknown>
  sourceLabel?: string
  sourcePlaceholder?: string
  previewLabel?: string
  applyLabel?: string
  cancelLabel?: string
  disabled?: boolean
}

export interface CodeGeneratorDialogEmits {
  'update:show': [value: boolean]
  'update:targetType': [value: string]
  apply: [payload: CodeGeneratorApplyPayload]
}

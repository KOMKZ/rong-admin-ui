export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong' | 'excellent'

export interface PasswordRule {
  key: string
  label: string
  test: (value: string) => boolean
}

export interface PasswordStrengthProps {
  modelValue: string
  rules?: PasswordRule[]
  showRules?: boolean
  showScore?: boolean
  showLevel?: boolean
  minLength?: number
  maxLength?: number
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

export interface PasswordStrengthEmits {
  'update:modelValue': [value: string]
  levelChange: [level: PasswordStrengthLevel, score: number]
}

export interface PasswordStrengthExpose {
  getLevel: () => PasswordStrengthLevel
  getScore: () => number
  getPassedRules: () => string[]
  focus: () => void
}

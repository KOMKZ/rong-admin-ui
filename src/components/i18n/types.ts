export interface LanguageOption {
  value: string
  label: string
}

export interface LanguageSelectorProps {
  modelValue: string
  options: LanguageOption[]
}

export interface LanguageSelectorEmits {
  'update:modelValue': [value: string]
}

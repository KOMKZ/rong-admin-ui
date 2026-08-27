export type MoneyValue = number | null | undefined

export interface MoneyFormatOptions {
  currency?: string
  scale?: number
  emptyText?: string
  showCurrency?: boolean
  currencyPosition?: 'prefix' | 'suffix'
}

export interface RMoneyTextProps extends MoneyFormatOptions {
  value?: MoneyValue
}

export interface RMoneyInputProps {
  value?: number | null
  currency?: string
  scale?: number
  min?: number
  max?: number
  placeholder?: string
  disabled?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large'
}

export interface RMoneyInputEmits {
  (e: 'update:value', value: number | null): void
  (e: 'valid-change', valid: boolean): void
}

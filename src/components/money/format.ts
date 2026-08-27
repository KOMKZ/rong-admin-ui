import type { MoneyFormatOptions, MoneyValue } from './types'

export function normalizeMoneyScale(scale?: number): number {
  if (!Number.isFinite(scale)) return 2
  return Math.max(0, Math.min(8, Math.trunc(Number(scale))))
}

export function formatMinorMoney(value: MoneyValue, options: MoneyFormatOptions = {}): string {
  const emptyText = options.emptyText ?? '-'
  if (value === null || value === undefined) return emptyText
  if (!Number.isFinite(value)) return emptyText

  const scale = normalizeMoneyScale(options.scale)
  const currency = options.currency || 'CNY'
  const amount = Number(value) / 10 ** scale
  const text = amount.toFixed(scale)
  if (options.showCurrency === false) return text
  return options.currencyPosition === 'suffix' ? `${text} ${currency}` : `${currency} ${text}`
}

export function decimalMoneyToMinor(value: string, scale = 2): number | null {
  const normalizedScale = normalizeMoneyScale(scale)
  const text = value.trim()
  if (!text) return null
  if (!new RegExp(`^\\d+(?:\\.\\d{0,${normalizedScale}})?$`).test(text)) {
    return null
  }
  const [integerPart, decimalPart = ''] = text.split('.')
  const paddedDecimal = decimalPart.padEnd(normalizedScale, '0')
  const major = Number.parseInt(integerPart, 10)
  const minor = normalizedScale > 0 ? Number.parseInt(paddedDecimal || '0', 10) : 0
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor)) return null
  return major * 10 ** normalizedScale + minor
}

export function minorMoneyToDecimal(value: number | null | undefined, scale = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  const normalizedScale = normalizeMoneyScale(scale)
  const sign = value < 0 ? '-' : ''
  const absolute = Math.abs(Math.trunc(value))
  const divisor = 10 ** normalizedScale
  const major = Math.floor(absolute / divisor)
  if (normalizedScale === 0) return `${sign}${major}`
  const minor = String(absolute % divisor).padStart(normalizedScale, '0')
  return `${sign}${major}.${minor}`
}

export function isValidDecimalMoney(value: string, scale = 2): boolean {
  const text = value.trim()
  if (!text) return true
  return decimalMoneyToMinor(text, scale) !== null
}

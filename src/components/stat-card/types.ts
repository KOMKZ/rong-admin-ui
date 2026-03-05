export type StatCardTrend = 'up' | 'down' | 'flat'
export type StatCardSize = 'small' | 'medium' | 'large'
export type StatCardVariant = 'default' | 'outlined' | 'filled'
export type StatCardComparePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface StatCardCompare {
  previousValue: number
  currentValue: number
  period: StatCardComparePeriod
  periodLabel?: string
}

export interface RStatCardProps {
  title: string
  value: string | number
  prefix?: string
  suffix?: string
  trend?: StatCardTrend
  trendValue?: string
  trendLabel?: string
  compare?: StatCardCompare
  icon?: string
  iconColor?: string
  description?: string
  loading?: boolean
  size?: StatCardSize
  variant?: StatCardVariant
  clickable?: boolean
}

export interface RStatCardEmits {
  (e: 'click'): void
}

export type StatCardTrend = 'up' | 'down' | 'flat'
export type StatCardSize = 'small' | 'medium' | 'large'
export type StatCardVariant = 'default' | 'outlined' | 'filled'

export interface RStatCardProps {
  title: string
  value: string | number
  prefix?: string
  suffix?: string
  trend?: StatCardTrend
  trendValue?: string
  trendLabel?: string
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

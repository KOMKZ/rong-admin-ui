import type { RStatCardProps } from '../stat-card/types'

export type KpiGridCols = 1 | 2 | 3 | 4 | 6

export interface KpiItem extends RStatCardProps {
  key: string
}

export interface RKpiGridProps {
  items: KpiItem[]
  cols?: KpiGridCols
  loading?: boolean
  gap?: number
}

export interface RKpiGridEmits {
  (e: 'item-click', key: string): void
}

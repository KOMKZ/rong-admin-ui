import type { FunctionalComponent, SVGAttributes } from 'vue'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number

export type IconColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | string

export interface RIconProps {
  name: string
  size?: IconSize
  color?: IconColor
  strokeWidth?: number
  class?: string
}

export type LucideIcon = FunctionalComponent<SVGAttributes>

export interface IconRegistryEntry {
  component: LucideIcon
  aliases?: string[]
}

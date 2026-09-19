import type { FunctionalComponent, SVGAttributes } from 'vue'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number

/** 能力瓦片色调：映射到语义 token（-bg / 主体色），新增色调 = 新增 token 对。 */
export type IconTileTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'neutral'

export type IconTileSize = 'sm' | 'md' | 'lg' | number

export interface IconTileProps {
  /** 图标注册名（同 RIcon name）。 */
  icon: string
  tone?: IconTileTone
  size?: IconTileSize
  strokeWidth?: number
}

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

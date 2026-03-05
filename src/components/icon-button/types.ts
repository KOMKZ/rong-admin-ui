export interface IconButtonProps {
  icon: string
  tooltip?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  danger?: boolean
  loading?: boolean
  disabled?: boolean
  circle?: boolean
  ghost?: boolean
  dashed?: boolean
  ariaLabel?: string
}

export interface IconButtonEmits {
  click: [event: MouseEvent]
}

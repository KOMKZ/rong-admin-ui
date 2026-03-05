export type ResultStatus = 'success' | 'error' | 'warning' | 'info' | '403' | '404' | '500'

export interface RResultStateProps {
  status: ResultStatus
  title?: string
  description?: string
  showIcon?: boolean
}

export interface RResultStateEmits {
  (e: 'primary-action'): void
  (e: 'secondary-action'): void
}

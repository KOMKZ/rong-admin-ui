export type ExportFormat = 'csv' | 'xlsx'

export type ExportTaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'

export interface ExportTaskSnapshot {
  status: ExportTaskStatus
  progress: number
  statusMessage?: string
}

export interface ExportFormatOption {
  label: string
  value: ExportFormat
}

export type AsyncTaskStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'timeout'

export interface AsyncTaskSnapshot {
  jobId: string
  taskType: string
  status: string
  progress: number
  artifact?: string
  errorMessage?: string
  updatedAt?: string
}

export interface AsyncTaskRecord {
  jobId: string
  taskType: string
  title: string
  status: AsyncTaskStatus
  progress: number
  createdAt: number
  updatedAt: number
  deadlineAt: number
  unread: boolean
  errorMessage?: string
  artifact?: string
  metadata?: Record<string, unknown>
}

export interface AsyncTaskAction {
  key: string
  label: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  disabled?: boolean
  onClick: (task: AsyncTaskRecord) => void | Promise<void>
}

export interface AsyncTaskQuery {
  getMany: (jobIds: string[]) => Promise<AsyncTaskSnapshot[]>
}

export interface AsyncTaskCenterOptions {
  storageKey?: string
  pollIntervalMs?: number
  timeoutMs?: number
  maxRecords?: number
  query: AsyncTaskQuery
  resolveActions?: (task: AsyncTaskRecord) => AsyncTaskAction[]
  onStatusChange?: (task: AsyncTaskRecord, previousStatus: AsyncTaskStatus) => void
}

export interface WatchAsyncTaskInput {
  jobId: string
  taskType?: string
  title?: string
  metadata?: Record<string, unknown>
}

export interface AsyncTaskCenterInstance {
  records: import('vue').ComputedRef<AsyncTaskRecord[]>
  pendingCount: import('vue').ComputedRef<number>
  watch: (input: WatchAsyncTaskInput) => void
  refresh: (jobId: string) => Promise<void>
  remove: (jobId: string) => void
  clearAll: () => void
  start: () => void
  stop: () => void
  destroy: () => void
  actions: (task: AsyncTaskRecord) => AsyncTaskAction[]
}

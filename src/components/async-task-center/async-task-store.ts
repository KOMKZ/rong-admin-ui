import { computed, ref } from 'vue'
import type { AsyncTaskRecord, AsyncTaskSnapshot, WatchAsyncTaskInput } from './types'

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled'])

function readRecords(key: string): AsyncTaskRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function createAsyncTaskStore(options: { storageKey: string; maxRecords: number }) {
  const records = ref<AsyncTaskRecord[]>(readRecords(options.storageKey))

  function persist(): void {
    try {
      localStorage.setItem(
        options.storageKey,
        JSON.stringify(records.value.slice(0, options.maxRecords)),
      )
    } catch {
      // localStorage 可能被浏览器策略禁用，任务轮询仍然应该继续工作。
    }
  }

  function upsert(input: WatchAsyncTaskInput): AsyncTaskRecord {
    const existing = records.value.find((item) => item.jobId === input.jobId)
    if (existing) {
      existing.unread = true
      persist()
      return existing
    }
    const now = Date.now()
    const record: AsyncTaskRecord = {
      jobId: input.jobId,
      taskType: input.taskType ?? '',
      title: input.title ?? '异步任务',
      status: 'pending',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      deadlineAt: now,
      unread: true,
      metadata: input.metadata,
    }
    records.value.unshift(record)
    persist()
    return record
  }

  function renew(jobId: string, timeoutMs: number): void {
    const record = records.value.find((item) => item.jobId === jobId)
    if (!record) return
    record.deadlineAt = Date.now() + timeoutMs
    persist()
  }

  function apply(snapshot: AsyncTaskSnapshot, timeoutMs: number): void {
    const record = records.value.find((item) => item.jobId === snapshot.jobId)
    if (!record) return
    record.taskType = snapshot.taskType || record.taskType
    record.status = mapStatus(snapshot.status)
    record.progress = Math.max(0, Math.min(100, Math.round(snapshot.progress || 0)))
    record.artifact = snapshot.artifact
    record.errorMessage = snapshot.errorMessage
    record.updatedAt = Date.now()
    if (!TERMINAL.has(record.status)) record.deadlineAt = Date.now() + timeoutMs
    persist()
  }

  function markTimeout(jobId: string): void {
    const record = records.value.find((item) => item.jobId === jobId)
    if (!record || TERMINAL.has(record.status)) return
    record.status = 'timeout'
    record.updatedAt = Date.now()
    persist()
  }

  function remove(jobId: string): void {
    records.value = records.value.filter((item) => item.jobId !== jobId)
    persist()
  }

  function clearAll(): void {
    records.value = []
    try {
      localStorage.removeItem(options.storageKey)
    } catch {
      // ignore unavailable storage
    }
  }

  function markRead(jobId: string): void {
    const record = records.value.find((item) => item.jobId === jobId)
    if (record) {
      record.unread = false
      persist()
    }
  }

  return {
    records: computed(() => records.value),
    pendingCount: computed(() => records.value.filter((item) => !TERMINAL.has(item.status)).length),
    upsert,
    renew,
    apply,
    markTimeout,
    markRead,
    remove,
    clearAll,
  }
}

function mapStatus(status: string): AsyncTaskRecord['status'] {
  switch (status.toLowerCase()) {
    case 'success':
    case 'succeeded':
    case 'completed':
      return 'succeeded'
    case 'failed':
    case 'error':
      return 'failed'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    case 'running':
    case 'processing':
      return 'running'
    default:
      return 'pending'
  }
}

import type { AsyncTaskQuery, AsyncTaskRecord, AsyncTaskStatus } from './types'
import { createAsyncTaskStore } from './async-task-store'

export function createAsyncTaskPoller(
  store: ReturnType<typeof createAsyncTaskStore>,
  query: AsyncTaskQuery,
  options: {
    intervalMs: number
    timeoutMs: number
    onStatusChange?: (task: AsyncTaskRecord, previousStatus: AsyncTaskStatus) => void
  },
) {
  let timer: ReturnType<typeof setInterval> | null = null
  let querying = false

  async function poll(): Promise<void> {
    if (querying) return
    const ids = store.records.value
      .filter((item) => !['succeeded', 'failed', 'cancelled', 'timeout'].includes(item.status))
      .map((item) => item.jobId)
    if (!ids.length) return
    querying = true
    try {
      const snapshots = await query.getMany(ids)
      snapshots.forEach((snapshot) => {
        const before = store.records.value.find((item) => item.jobId === snapshot.jobId)
        const previousStatus = before?.status
        store.apply(snapshot, options.timeoutMs)
        const after = store.records.value.find((item) => item.jobId === snapshot.jobId)
        if (after && previousStatus && after.status !== previousStatus) {
          options.onStatusChange?.(after, previousStatus)
        }
      })
      const now = Date.now()
      ids.forEach((id) => {
        const record = store.records.value.find((item) => item.jobId === id)
        if (record && record.deadlineAt < now) store.markTimeout(id)
      })
    } finally {
      querying = false
    }
  }

  function start(): void {
    if (timer) return
    void poll()
    timer = setInterval(() => void poll(), options.intervalMs)
  }

  function stop(): void {
    if (timer) clearInterval(timer)
    timer = null
  }

  return { start, stop, poll }
}

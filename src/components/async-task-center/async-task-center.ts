import { createAsyncTaskPoller } from './async-task-poller'
import { createAsyncTaskStore } from './async-task-store'
import type { AsyncTaskCenterInstance, AsyncTaskCenterOptions, WatchAsyncTaskInput } from './types'

export function createAsyncTaskCenter(options: AsyncTaskCenterOptions): AsyncTaskCenterInstance {
  const store = createAsyncTaskStore({
    storageKey: options.storageKey ?? 'rong-admin:async-tasks',
    maxRecords: options.maxRecords ?? 50,
  })
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000
  const poller = createAsyncTaskPoller(store, options.query, {
    intervalMs: options.pollIntervalMs ?? 5000,
    timeoutMs,
    onStatusChange: options.onStatusChange,
  })

  if (store.pendingCount.value > 0) poller.start()

  function watch(input: WatchAsyncTaskInput): void {
    const record = store.upsert(input)
    store.renew(record.jobId, timeoutMs)
    poller.start()
  }

  async function refresh(jobId: string): Promise<void> {
    const record = store.upsert({ jobId })
    record.status = 'running'
    store.renew(record.jobId, timeoutMs)
    await poller.poll()
    poller.start()
  }

  return {
    records: store.records,
    pendingCount: store.pendingCount,
    watch,
    refresh,
    remove: store.remove,
    clearAll: store.clearAll,
    start: poller.start,
    stop: poller.stop,
    destroy: poller.stop,
    actions: (task) => options.resolveActions?.(task) ?? [],
  }
}

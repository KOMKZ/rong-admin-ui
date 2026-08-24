import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { NMessageProvider } from 'naive-ui'
import { createAsyncTaskCenter } from '../../src/components/async-task-center'
import { createAsyncTaskPoller } from '../../src/components/async-task-center/async-task-poller'
import { createAsyncTaskStore } from '../../src/components/async-task-center/async-task-store'
import RAsyncTaskCenter from '../../src/components/async-task-center/RAsyncTaskCenter.vue'

describe('async task center', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('polls multiple tasks and reports status transitions', async () => {
    const store = createAsyncTaskStore({ storageKey: 'test:async-tasks', maxRecords: 10 })
    store.upsert({ jobId: 'job-1', title: '管理员列表导出' })
    store.upsert({ jobId: 'job-2', title: '管理员列表导出' })
    const statusChanges: string[] = []
    const poller = createAsyncTaskPoller(
      store,
      {
        getMany: async (jobIds) =>
          jobIds.map((jobId) => ({
            jobId,
            taskType: 'admin.admins.export',
            status: 'succeeded',
            progress: 100,
            artifact: 'oss:export@admins.csv',
          })),
      },
      {
        intervalMs: 5000,
        timeoutMs: 60000,
        onStatusChange: (task) => statusChanges.push(`${task.jobId}:${task.status}`),
      },
    )

    await poller.poll()

    expect(store.records.value.map((task) => task.status)).toEqual(['succeeded', 'succeeded'])
    expect(statusChanges).toEqual(['job-2:succeeded', 'job-1:succeeded'])
  })

  it('exposes application-defined actions for completed tasks', () => {
    const center = createAsyncTaskCenter({
      query: { getMany: async () => [] },
      resolveActions: (task) =>
        task.status === 'succeeded' ? [{ key: 'download', label: '下载', onClick: vi.fn() }] : [],
    })
    center.watch({ jobId: 'job-1', title: '管理员列表导出' })
    const task = center.records.value[0]
    task.status = 'succeeded'

    expect(center.actions(task).map((action) => action.key)).toEqual(['download'])
    center.destroy()
  })

  it('renders the progress notification trigger with a progress icon', () => {
    const center = createAsyncTaskCenter({
      query: { getMany: async () => [] },
    })

    const wrapper = mount({
      render: () => h(NMessageProvider, null, { default: () => h(RAsyncTaskCenter, { center }) }),
    })

    const trigger = wrapper.find('[data-testid="async-task-center-trigger"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toBe('进度通知')
    expect(wrapper.find('[data-testid="r-icon"]').attributes('aria-label')).toBe('activity')

    wrapper.unmount()
    center.destroy()
  })
})

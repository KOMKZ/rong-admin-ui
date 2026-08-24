<script setup lang="ts">
  import { NButton, NProgress, NSpace, NTag, NText } from 'naive-ui'
  import type { AsyncTaskAction, AsyncTaskRecord } from './types'

  const props = defineProps<{
    task: AsyncTaskRecord
    refreshing: boolean
    actions: AsyncTaskAction[]
  }>()
  const emit = defineEmits<{
    refresh: []
    remove: []
    open: []
    action: [action: AsyncTaskAction]
  }>()

  function statusLabel(status: AsyncTaskRecord['status']): string {
    return {
      pending: '等待中',
      running: '处理中',
      succeeded: '已完成',
      failed: '失败',
      cancelled: '已取消',
      timeout: '已超时',
    }[status]
  }
</script>

<template>
  <div class="r-async-task-item" @click="emit('open')">
    <div class="r-async-task-item__header">
      <NText strong>{{ task.title }}</NText>
      <NTag
        size="small"
        :type="
          task.status === 'succeeded'
            ? 'success'
            : task.status === 'failed' || task.status === 'timeout'
              ? 'error'
              : 'info'
        "
      >
        {{ statusLabel(task.status) }}
      </NTag>
    </div>
    <NProgress type="line" :percentage="task.progress" :show-indicator="false" :height="5" />
    <div class="r-async-task-item__footer">
      <NText depth="3">{{ task.jobId }}</NText>
      <NSpace size="small" align="center">
        <NButton text size="tiny" :loading="refreshing" @click.stop="emit('refresh')">刷新</NButton>
        <NButton
          v-for="action in props.actions"
          :key="action.key"
          text
          size="tiny"
          :type="action.type"
          :disabled="action.disabled"
          @click.stop="emit('action', action)"
          >{{ action.label }}</NButton
        >
        <NButton text size="tiny" type="error" @click.stop="emit('remove')">移除</NButton>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
  .r-async-task-item {
    padding: 10px 12px;
    border-bottom: 1px solid var(--ra-color-border, #eee);
    cursor: pointer;
  }
  .r-async-task-item__header,
  .r-async-task-item__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .r-async-task-item__footer {
    margin-top: 6px;
    font-size: 11px;
  }
</style>

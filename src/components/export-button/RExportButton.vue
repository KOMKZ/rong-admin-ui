<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, type PropType } from 'vue'
  import { NButton, NProgress, NSelect, NSpace, NText, type SelectOption } from 'naive-ui'
  import type { ExportFormat, ExportFormatOption, ExportTaskSnapshot } from './types'

  const props = defineProps({
    label: { type: String, default: '导出' },
    disabled: { type: Boolean, default: false },
    pollInterval: { type: Number, default: 1200 },
    autoDownload: { type: Boolean, default: true },
    formats: {
      type: Array as PropType<ExportFormatOption[]>,
      default: () => [
        { label: 'CSV', value: 'csv' },
        { label: 'Excel', value: 'xlsx' },
      ],
    },
    createTask: {
      type: Function as PropType<(format: ExportFormat) => Promise<number | string>>,
      required: true,
    },
    queryTask: {
      type: Function as PropType<(taskId: number | string) => Promise<ExportTaskSnapshot>>,
      required: true,
    },
    downloadTask: {
      type: Function as PropType<(taskId: number | string) => Promise<void>>,
      required: true,
    },
  })

  const emit = defineEmits<{
    started: [taskId: number | string, format: ExportFormat]
    progress: [snapshot: ExportTaskSnapshot]
    success: [taskId: number | string]
    error: [message: string]
    finished: []
  }>()

  const selectedFormat = ref<ExportFormat>('csv')
  const taskId = ref<number | string | null>(null)
  const running = ref(false)
  const progress = ref(0)
  const statusText = ref('')
  const polling = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  const canStart = computed(() => !props.disabled && !running.value)
  const selectOptions = computed<SelectOption[]>(() =>
    props.formats.map((item) => ({
      label: item.label,
      value: item.value,
    })),
  )

  onBeforeUnmount(() => {
    stopPolling()
  })

  async function handleStart(): Promise<void> {
    if (!canStart.value) {
      return
    }

    try {
      progress.value = 0
      statusText.value = '创建导出任务中...'
      const id = await props.createTask(selectedFormat.value)
      taskId.value = id
      running.value = true
      emit('started', id, selectedFormat.value)

      await pollOnce()
      startPolling()
    } catch (error) {
      statusText.value = ''
      running.value = false
      emit('error', resolveMessage(error, '创建导出任务失败'))
    }
  }

  function startPolling(): void {
    stopPolling()
    timer = setInterval(() => {
      void pollOnce()
    }, props.pollInterval)
  }

  function stopPolling(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  async function pollOnce(): Promise<void> {
    if (!running.value || taskId.value === null || polling.value) {
      return
    }

    polling.value = true
    try {
      const snapshot = await props.queryTask(taskId.value)
      progress.value = normalizeProgress(snapshot.progress)
      statusText.value = snapshot.statusMessage || statusLabel(snapshot.status)
      emit('progress', snapshot)

      if (snapshot.status === 'success') {
        stopPolling()
        if (props.autoDownload) {
          await props.downloadTask(taskId.value)
        }
        running.value = false
        emit('success', taskId.value)
        emit('finished')
        return
      }

      if (snapshot.status === 'failed' || snapshot.status === 'cancelled') {
        stopPolling()
        running.value = false
        emit('error', snapshot.statusMessage || statusLabel(snapshot.status))
        emit('finished')
      }
    } catch (error) {
      stopPolling()
      running.value = false
      emit('error', resolveMessage(error, '查询导出状态失败'))
      emit('finished')
    } finally {
      polling.value = false
    }
  }

  function normalizeProgress(value: number): number {
    if (!Number.isFinite(value)) {
      return 0
    }
    return Math.min(100, Math.max(0, Math.round(value)))
  }

  function statusLabel(status: ExportTaskSnapshot['status']): string {
    switch (status) {
      case 'pending':
        return '等待执行'
      case 'running':
        return '导出中'
      case 'success':
        return '导出完成'
      case 'failed':
        return '导出失败'
      case 'cancelled':
        return '已取消'
      default:
        return '处理中'
    }
  }

  function resolveMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message
    }
    return fallback
  }
</script>

<template>
  <div class="r-export-button" data-testid="export-button">
    <NSpace align="center" size="small">
      <NSelect
        v-model:value="selectedFormat"
        :disabled="running || disabled"
        :options="selectOptions"
        size="small"
        style="width: 110px"
        data-testid="export-format-select"
      />
      <NButton
        size="small"
        :loading="running"
        :disabled="!canStart"
        data-testid="export-trigger"
        @click="handleStart"
      >
        {{ running ? '导出中' : label }}
      </NButton>
    </NSpace>

    <div v-if="running" class="r-export-button__progress" data-testid="export-progress">
      <NProgress type="line" :percentage="progress" :show-indicator="false" :height="6" />
      <NText depth="3" class="r-export-button__text">{{ statusText }} {{ progress }}%</NText>
    </div>
  </div>
</template>

<style scoped>
  .r-export-button {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .r-export-button__progress {
    min-width: 180px;
  }

  .r-export-button__text {
    font-size: 12px;
  }
</style>

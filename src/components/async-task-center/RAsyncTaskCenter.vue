<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import {
    NBadge,
    NButton,
    NDrawer,
    NDrawerContent,
    NEmpty,
    NSpace,
    NText,
    useMessage,
  } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import RAsyncTaskItem from './RAsyncTaskItem.vue'
  import type { AsyncTaskCenterInstance } from './types'

  const props = defineProps<{ center: AsyncTaskCenterInstance }>()
  const emit = defineEmits<{ open: [task: string] }>()
  const refreshing = ref<string | null>(null)
  const drawerOpen = ref(false)
  const tasks = computed(() => props.center.records.value)
  const message = useMessage()
  const knownStatuses = new Map<string, string>()

  watch(
    tasks,
    (nextTasks) => {
      for (const task of nextTasks) {
        const previous = knownStatuses.get(task.jobId)
        if (previous && previous !== task.status && task.status === 'succeeded') {
          message.success(`${task.title}已完成`, { duration: 4500 })
        }
        knownStatuses.set(task.jobId, task.status)
      }
    },
    { deep: true, immediate: true },
  )

  async function refresh(jobId: string): Promise<void> {
    refreshing.value = jobId
    try {
      await props.center.refresh(jobId)
    } finally {
      refreshing.value = null
    }
  }

  async function runAction(
    task: string,
    action: ReturnType<AsyncTaskCenterInstance['actions']>[number],
  ): Promise<void> {
    const record = tasks.value.find((item) => item.jobId === task)
    if (!record || action.disabled) return
    await action.onClick(record)
  }

  function openTask(jobId: string): void {
    emit('open', jobId)
    drawerOpen.value = false
  }
</script>

<template>
  <NBadge :value="center.pendingCount.value" :max="99" :show="center.pendingCount.value > 0">
    <NButton
      circle
      quaternary
      aria-label="进度通知"
      data-testid="async-task-center-trigger"
      @click="drawerOpen = true"
    >
      <template #icon><RIcon name="activity" :size="18" /></template>
    </NButton>
  </NBadge>
  <NDrawer
    v-model:show="drawerOpen"
    placement="right"
    :width="420"
    data-testid="async-task-center-drawer"
  >
    <NDrawerContent title="进度通知" closable>
      <div class="r-async-task-center__header">
        <NText depth="3">共 {{ tasks.length }} 个任务</NText>
        <NSpace size="small">
          <NButton text size="small" @click="center.start()">全部刷新</NButton>
          <NButton text size="small" type="error" @click="center.clearAll()">清空记录</NButton>
        </NSpace>
      </div>
      <NEmpty v-if="!tasks.length" description="暂无异步任务" />
      <RAsyncTaskItem
        v-for="task in tasks"
        :key="task.jobId"
        :task="task"
        :actions="center.actions(task)"
        :refreshing="refreshing === task.jobId"
        @refresh="refresh(task.jobId)"
        @remove="center.remove(task.jobId)"
        @action="runAction(task.jobId, $event)"
        @open="openTask(task.jobId)"
      />
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
  .r-async-task-center__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 16px;
    border-bottom: 1px solid var(--ra-color-border, #eee);
  }
  .r-async-task-center {
    min-height: 100%;
  }
</style>

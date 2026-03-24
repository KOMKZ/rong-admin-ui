<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import { NProgress, NText, NSpace, NTag } from 'naive-ui'

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface StepItem {
  label: string
  status: StepStatus
  durationMs?: number
}

const props = defineProps({
  steps: { type: Array as PropType<StepItem[]>, required: true },
  currentStep: { type: Number, default: 0 },
  totalSteps: { type: Number, default: 0 },
  compact: { type: Boolean, default: false },
})

const percentage = computed(() => {
  const total = props.totalSteps || props.steps.length
  if (total <= 0) return 0
  const done = props.steps.filter(s => s.status === 'completed').length
  return Math.min(100, Math.round((done / total) * 100))
})

const progressColor = computed(() => {
  if (props.steps.some(s => s.status === 'failed')) return '#d03050'
  if (props.steps.every(s => s.status === 'completed')) return '#18a058'
  return '#2080f0'
})

const statusColor: Record<StepStatus, string> = {
  pending: 'default',
  running: 'info',
  completed: 'success',
  failed: 'error',
}
</script>

<template>
  <div class="r-step-progress">
    <NSpace v-if="!compact" justify="space-between" align="center" style="margin-bottom: 6px">
      <NText depth="3" style="font-size: 12px">
        Step {{ currentStep + 1 }} / {{ totalSteps || steps.length }}
      </NText>
      <NText depth="3" style="font-size: 12px">{{ percentage }}%</NText>
    </NSpace>
    <NProgress
      type="line"
      :percentage="percentage"
      :height="compact ? 4 : 8"
      :border-radius="4"
      :color="progressColor"
      :show-indicator="false"
      :processing="steps.some(s => s.status === 'running')"
    />
    <div v-if="!compact" class="r-step-progress__list">
      <div v-for="(step, i) in steps" :key="i" class="r-step-progress__item">
        <NTag :type="statusColor[step.status] as any" size="tiny" :bordered="false" round>
          {{ step.label }}
        </NTag>
        <NText v-if="step.durationMs !== undefined" depth="3" style="font-size: 11px; margin-left: 4px">
          {{ step.durationMs }}ms
        </NText>
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-step-progress__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.r-step-progress__item {
  display: flex;
  align-items: center;
}
</style>

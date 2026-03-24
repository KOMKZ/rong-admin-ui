<script lang="ts" setup>
import { type PropType } from 'vue'
import { NTimeline, NTimelineItem, NText, NTag, NSpace } from 'naive-ui'

export type TimelineEntryStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface TimelineEntry {
  nodeId: string
  label: string
  status: TimelineEntryStatus
  startMs: number
  endMs: number
  durationMs: number
  error?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  tokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number }
}

defineProps({
  entries: { type: Array as PropType<TimelineEntry[]>, required: true },
  totalMs: { type: Number, default: 0 },
  showDetail: { type: Boolean, default: false },
})

function statusType(s: TimelineEntryStatus): 'default' | 'info' | 'success' | 'error' | 'warning' {
  switch (s) {
    case 'running': return 'info'
    case 'completed': return 'success'
    case 'failed': return 'error'
    case 'skipped': return 'warning'
    default: return 'default'
  }
}
</script>

<template>
  <div class="r-timeline-view">
    <NSpace v-if="totalMs > 0" justify="end" style="margin-bottom: 8px">
      <NText depth="3" style="font-size: 12px">总耗时 {{ totalMs }}ms</NText>
    </NSpace>
    <NTimeline>
      <NTimelineItem
        v-for="(entry, i) in entries"
        :key="i"
        :type="statusType(entry.status)"
        :title="entry.label || entry.nodeId"
      >
        <template #header>
          <NSpace :size="4" align="center">
            <NText strong>{{ entry.label || entry.nodeId }}</NText>
            <NTag :type="statusType(entry.status)" size="tiny" :bordered="false" round>
              {{ entry.status }}
            </NTag>
            <NText v-if="entry.durationMs > 0" depth="3" style="font-size: 11px">
              {{ entry.durationMs }}ms
            </NText>
          </NSpace>
        </template>
        <template v-if="showDetail" #default>
          <div v-if="entry.tokenUsage" class="r-timeline-view__tokens">
            <NText depth="3" style="font-size: 11px">
              Tokens: {{ entry.tokenUsage.inputTokens }} in / {{ entry.tokenUsage.outputTokens }} out
            </NText>
          </div>
          <div v-if="entry.error" class="r-timeline-view__error">
            <NText type="error" style="font-size: 11px">{{ entry.error }}</NText>
          </div>
        </template>
      </NTimelineItem>
    </NTimeline>
  </div>
</template>

<style scoped>
.r-timeline-view__tokens {
  margin-top: 2px;
}
.r-timeline-view__error {
  margin-top: 2px;
}
</style>

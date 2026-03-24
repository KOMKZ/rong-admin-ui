<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import { NProgress, NText, NSpace, NTag } from 'naive-ui'

export type IndexStatus = 'idle' | 'indexing' | 'completed' | 'failed'

const props = defineProps({
  total: { type: Number, required: true },
  indexed: { type: Number, required: true },
  status: { type: String as PropType<IndexStatus>, default: 'idle' },
  showLabel: { type: Boolean, default: true },
  height: { type: Number, default: 12 },
  borderRadius: { type: Number, default: 6 },
})

const percentage = computed(() => {
  if (props.total <= 0) return 0
  return Math.min(100, Math.round((props.indexed / props.total) * 100))
})

const indicatorColor = computed(() => {
  switch (props.status) {
    case 'indexing':
      return '#2080f0'
    case 'completed':
      return '#18a058'
    case 'failed':
      return '#d03050'
    default:
      return '#909399'
  }
})

const statusTagType = computed<'default' | 'info' | 'success' | 'error'>(() => {
  switch (props.status) {
    case 'indexing':
      return 'info'
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'indexing':
      return '向量化中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return '待处理'
  }
})
</script>

<template>
  <div class="r-index-progress">
    <NSpace v-if="showLabel" justify="space-between" align="center" :size="4" style="margin-bottom: 4px">
      <NText depth="3" style="font-size: 12px">
        {{ indexed }} / {{ total }} 文档
      </NText>
      <NTag :type="statusTagType" size="small" :bordered="false">
        {{ statusLabel }}
      </NTag>
    </NSpace>
    <NProgress
      type="line"
      :percentage="percentage"
      :height="height"
      :border-radius="borderRadius"
      :color="indicatorColor"
      :show-indicator="false"
      :processing="status === 'indexing'"
    />
  </div>
</template>

<style scoped>
.r-index-progress {
  min-width: 120px;
}
</style>

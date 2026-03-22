<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" placement="right">
    <NDrawerContent :title="drawerTitle" closable>
      <template v-if="graphData">
        <RFlowTimeline
          ref="timelineRef"
          :nodes="graphData.nodes"
          :edges="graphData.edges"
          height="100%"
        />
      </template>
      <NEmpty v-else :description="emptyDescription" />
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NDrawer, NDrawerContent, NEmpty } from 'naive-ui'
import RFlowTimeline from '../flow/RFlowTimeline.vue'
import type { FlowData } from '../flow/types'

const props = defineProps<{
  show: boolean
  entityType: 'agent' | 'team'
  entityId?: number | null
  fetchGraph?: (id: number) => Promise<FlowData>
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const visible = ref(props.show)
const graphData = ref<FlowData | null>(null)
const timelineRef = ref<InstanceType<typeof RFlowTimeline> | null>(null)

const drawerWidth = computed(() => (props.entityType === 'team' ? 560 : 520))

const drawerTitle = computed(() =>
  props.entityType === 'team' ? 'Team 执行过程' : 'Agent 执行过程',
)

const emptyDescription = computed(() =>
  props.entityType === 'team' ? '等待 Team 执行...' : '等待 Agent 执行...',
)

watch(
  () => props.show,
  (val) => {
    visible.value = val
  },
)
watch(visible, (val) => {
  emit('update:show', val)
})

watch(
  () => props.entityId,
  async (id) => {
    if (!id || !props.fetchGraph) {
      graphData.value = null
      return
    }
    try {
      graphData.value = await props.fetchGraph(id)
    } catch {
      graphData.value = null
    }
  },
  { immediate: true },
)

defineExpose({
  getTimeline: () => timelineRef.value,
})
</script>

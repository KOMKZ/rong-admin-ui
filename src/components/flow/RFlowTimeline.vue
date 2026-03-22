<template>
  <div class="r-flow-timeline" :style="{ height }">
    <VueFlow
      :nodes="timelineNodes"
      :edges="timelineEdges"
      :default-viewport="{ zoom: 0.85, x: 50, y: 20 }"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
    >
      <template #node-default="{ data, label }">
        <div
          class="r-flow-node r-flow-node--default"
          :class="{
            'r-flow-node--active': data?._status === 'running',
            'r-flow-node--completed': data?._status === 'completed',
            'r-flow-node--error': data?._status === 'error',
          }"
        >
          <div class="r-flow-node__label">{{ label }}</div>
          <div v-if="data?._status === 'running'" class="r-flow-node__pulse-wrap">
            <span class="r-flow-node__pulse" />
          </div>
          <div v-if="data?._duration" class="r-flow-node__sub">{{ data._duration }}ms</div>
        </div>
      </template>
      <Background />
      <MiniMap />
    </VueFlow>

    <div class="r-flow-timeline__log">
      <div
        v-for="evt in events"
        :key="evt.id"
        class="r-flow-timeline__entry"
        :class="`r-flow-timeline__entry--${evt.type}`"
      >
        <span class="r-flow-timeline__ts">{{ formatTS(evt.timestamp) }}</span>
        <span class="r-flow-timeline__badge">{{ evt.type }}</span>
        <span class="r-flow-timeline__node">{{ evt.node_id }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import type { FlowNode, FlowEdge, FlowTimelineEvent } from './types'

const props = withDefaults(defineProps<{
  nodes: FlowNode[]
  edges: FlowEdge[]
  height?: string
}>(), {
  height: '500px',
})

const nodeStatus = ref<Record<string, { status: string; enterTime?: number; duration?: number }>>({})
const events = ref<FlowTimelineEvent[]>([])

let sse: EventSource | null = null

const timelineNodes = computed(() =>
  props.nodes.map((n) => {
    const st = nodeStatus.value[n.id]
    return {
      id: n.id, type: n.type || 'default', label: n.label, position: n.position,
      data: { ...(n.data || {}), _status: st?.status || 'idle', _duration: st?.duration },
    }
  }),
)

const timelineEdges = computed(() =>
  props.edges.map((e) => ({
    id: e.id, source: e.source, target: e.target,
    label: e.label || '', type: 'default',
    animated: nodeStatus.value[e.source]?.status === 'running',
  })),
)

function handleEvent(evt: FlowTimelineEvent) {
  events.value.push(evt)
  switch (evt.type) {
    case 'node_enter':
      nodeStatus.value[evt.node_id] = { status: 'running', enterTime: evt.timestamp }
      break
    case 'node_exit': {
      const ex = nodeStatus.value[evt.node_id]
      nodeStatus.value[evt.node_id] = { status: 'completed', duration: ex?.enterTime ? evt.timestamp - ex.enterTime : undefined }
      break
    }
  }
}

function connectSSE(url: string) {
  if (sse) sse.close()
  sse = new EventSource(url)
  for (const t of ['node_enter', 'node_exit', 'tool_call', 'tool_result'] as const) {
    sse.addEventListener(t, (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data)
        handleEvent({ id: `${Date.now()}-${Math.random()}`, type: t, node_id: d.node_id || '', timestamp: d.timestamp || Date.now(), detail: d.detail })
      } catch { /* skip */ }
    })
  }
  sse.onerror = () => { sse?.close(); sse = null }
}

function reset() { nodeStatus.value = {}; events.value = [] }

function formatTS(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

onUnmounted(() => { sse?.close() })

defineExpose({ handleEvent, connectSSE, reset })
</script>

<style scoped>
.r-flow-timeline {
  display: flex;
  width: 100%;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
.r-flow-timeline .vue-flow { flex: 1; }
.r-flow-timeline__log {
  width: 260px;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
  padding: 8px;
  background: white;
  font-size: 12px;
}
.r-flow-timeline__entry {
  padding: 3px 0;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 4px;
}
.r-flow-timeline__ts { color: #9ca3af; font-family: monospace; font-size: 10px; }
.r-flow-timeline__badge {
  padding: 1px 5px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}
.r-flow-timeline__entry--node_enter .r-flow-timeline__badge { background: #dbeafe; color: #2563eb; }
.r-flow-timeline__entry--node_exit .r-flow-timeline__badge { background: #dcfce7; color: #16a34a; }
.r-flow-timeline__entry--tool_call .r-flow-timeline__badge { background: #fef3c7; color: #d97706; }
.r-flow-timeline__entry--tool_result .r-flow-timeline__badge { background: #ede9fe; color: #6366f1; }
.r-flow-timeline__node { font-weight: 500; color: #374151; }

.r-flow-node--active { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.3) !important; background: #eef2ff !important; }
.r-flow-node--completed { border-color: #16a34a !important; background: #f0fdf4 !important; }
.r-flow-node--error { border-color: #dc2626 !important; background: #fef2f2 !important; }
.r-flow-node__pulse-wrap { display: flex; justify-content: center; margin-top: 4px; }
.r-flow-node__pulse {
  width: 8px; height: 8px; border-radius: 50%; background: #6366f1;
  animation: r-pulse 1.5s ease-in-out infinite;
}
@keyframes r-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
</style>

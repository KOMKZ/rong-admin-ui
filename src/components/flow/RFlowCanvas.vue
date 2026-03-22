<template>
  <div class="r-flow-canvas" :style="{ height }">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :default-viewport="{ zoom: 0.85, x: 50, y: 20 }"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
    >
      <template #node-input="{ label }">
        <div class="r-flow-node r-flow-node--input">
          <div class="r-flow-node__icon">▶</div>
          <div class="r-flow-node__label">{{ label }}</div>
        </div>
      </template>
      <template #node-output="{ label }">
        <div class="r-flow-node r-flow-node--output">
          <div class="r-flow-node__icon">■</div>
          <div class="r-flow-node__label">{{ label }}</div>
        </div>
      </template>
      <template #node-default="{ data, label }">
        <div class="r-flow-node r-flow-node--default">
          <div class="r-flow-node__label">{{ label }}</div>
          <div v-if="data?.truncated" class="r-flow-node__sub">{{ data.truncated }}</div>
          <div v-if="data?.strategy" class="r-flow-node__badge">{{ data.strategy }}</div>
        </div>
      </template>
      <slot name="addons">
        <Background />
        <Controls />
        <MiniMap />
      </slot>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { FlowNode, FlowEdge } from './types'

const props = withDefaults(defineProps<{
  nodes: FlowNode[]
  edges: FlowEdge[]
  height?: string
}>(), {
  height: '500px',
})

const flowNodes = computed(() =>
  props.nodes.map((n) => ({
    id: n.id,
    type: n.type || 'default',
    label: n.label,
    position: n.position,
    data: n.data || {},
  })),
)

const flowEdges = computed(() =>
  props.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label || '',
    type: e.type === 'dispatch' ? 'smoothstep' : 'default',
    animated: e.type === 'dispatch',
    style: e.type === 'dispatch' ? { stroke: '#6366f1' } : undefined,
  })),
)
</script>

<style scoped>
.r-flow-canvas {
  width: 100%;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}

.r-flow-node {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.r-flow-node--input {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.r-flow-node--output {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.r-flow-node--default {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.r-flow-node__icon { margin-bottom: 4px; font-size: 16px; }
.r-flow-node__label { font-weight: 600; }
.r-flow-node__sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.r-flow-node__badge {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  background: #ede9fe;
  color: #6366f1;
  font-weight: 500;
}
</style>

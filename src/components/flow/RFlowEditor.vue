<template>
  <div class="r-flow-editor" :style="{ height }">
    <div class="r-flow-editor__toolbar">
      <slot name="toolbar">
        <button class="r-flow-editor__btn" @click="fitView">适配画布</button>
        <button class="r-flow-editor__btn" @click="addNode">添加节点</button>
        <button class="r-flow-editor__btn r-flow-editor__btn--danger" :disabled="!selectedNodeId" @click="removeSelected">删除选中</button>
        <span class="r-flow-editor__separator" />
        <button class="r-flow-editor__btn r-flow-editor__btn--primary" @click="handleSave">保存</button>
      </slot>
    </div>
    <VueFlow
      v-model:nodes="editNodes"
      v-model:edges="editEdges"
      :default-viewport="{ zoom: 0.85, x: 50, y: 20 }"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      :nodes-draggable="true"
      :nodes-connectable="true"
      :elements-selectable="true"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @connect="onConnect"
    >
      <template #node-input="{ label }">
        <div class="r-flow-node r-flow-node--input">
          <div class="r-flow-node__label">{{ label }}</div>
        </div>
      </template>
      <template #node-output="{ label }">
        <div class="r-flow-node r-flow-node--output">
          <div class="r-flow-node__label">{{ label }}</div>
        </div>
      </template>
      <template #node-default="{ label }">
        <div class="r-flow-node r-flow-node--default">
          <div class="r-flow-node__label">{{ label }}</div>
        </div>
      </template>
      <Background />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { FlowNode, FlowEdge } from './types'

const props = withDefaults(defineProps<{
  nodes: FlowNode[]
  edges: FlowEdge[]
  height?: string
}>(), {
  height: '600px',
})

const emit = defineEmits<{
  save: [data: { nodes: FlowNode[]; edges: FlowEdge[] }]
}>()

const { fitView: doFitView } = useVueFlow()

const editNodes = ref<any[]>([])
const editEdges = ref<any[]>([])
const selectedNodeId = ref<string | null>(null)

watch(
  () => [props.nodes, props.edges],
  () => {
    editNodes.value = props.nodes.map((n) => ({
      id: n.id, type: n.type || 'default', label: n.label,
      position: { ...n.position }, data: { ...(n.data || {}) },
    }))
    editEdges.value = props.edges.map((e) => ({
      id: e.id, source: e.source, target: e.target,
      label: e.label || '', type: 'default',
    }))
  },
  { immediate: true },
)

let nodeCounter = 0

function fitView() { doFitView() }

function addNode() {
  nodeCounter++
  editNodes.value.push({
    id: `custom_${Date.now()}_${nodeCounter}`,
    type: 'default',
    label: `Node ${nodeCounter}`,
    position: { x: 250 + Math.random() * 100, y: 200 + Math.random() * 100 },
    data: {},
  })
}

function removeSelected() {
  if (!selectedNodeId.value) return
  const id = selectedNodeId.value
  editNodes.value = editNodes.value.filter((n) => n.id !== id)
  editEdges.value = editEdges.value.filter((e) => e.source !== id && e.target !== id)
  selectedNodeId.value = null
}

function onNodeClick(event: { node: { id: string } }) { selectedNodeId.value = event.node.id }
function onPaneClick() { selectedNodeId.value = null }

function onConnect(conn: Connection) {
  const id = `e-${conn.source}-${conn.target}`
  if (!editEdges.value.find((e) => e.id === id)) {
    editEdges.value.push({ id, source: conn.source, target: conn.target, type: 'default' })
  }
}

function handleSave() {
  emit('save', {
    nodes: editNodes.value.map((n) => ({
      id: n.id, type: n.type, label: n.label as string,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: n.data,
    })),
    edges: editEdges.value.map((e) => ({
      id: e.id, source: e.source, target: e.target,
      label: e.label || undefined, type: e.type === 'smoothstep' ? 'dispatch' : undefined,
    })),
  })
}
</script>

<style scoped>
.r-flow-editor {
  position: relative;
  width: 100%;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
.r-flow-editor__toolbar {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: white;
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  display: flex;
  gap: 6px;
  align-items: center;
}
.r-flow-editor__btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}
.r-flow-editor__btn:hover { background: #f9fafb; }
.r-flow-editor__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.r-flow-editor__btn--primary { background: #6366f1; color: white; border-color: #6366f1; }
.r-flow-editor__btn--primary:hover { background: #4f46e5; }
.r-flow-editor__btn--danger { color: #dc2626; border-color: #fca5a5; }
.r-flow-editor__separator { width: 1px; height: 20px; background: #e5e7eb; }
</style>

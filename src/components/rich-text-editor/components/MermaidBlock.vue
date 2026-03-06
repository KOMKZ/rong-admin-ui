<script lang="ts" setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { ref, watch, onMounted, computed } from 'vue'
import { Play, Pencil, Copy, Trash2 } from 'lucide-vue-next'

const props = defineProps(nodeViewProps)
const isEditable = computed(() => props.editor?.isEditable ?? true)

const code = ref(props.node.attrs.code || 'graph TD;\nA-->B;')
const svgContent = ref('')
const errorMessage = ref('')
const showEditor = ref(false)
const isRendering = ref(false)

const renderDiagram = async () => {
  isRendering.value = true
  try {
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
    const { svg } = await mermaid.render(id, code.value)
    svgContent.value = svg
    errorMessage.value = ''
  } catch (error: any) {
    errorMessage.value = error?.message || '渲染失败，请检查语法'
  } finally {
    isRendering.value = false
  }
}

let renderTimer: ReturnType<typeof setTimeout> | null = null
function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(renderDiagram, 300)
}

function toggleEdit() {
  showEditor.value = !showEditor.value
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value)
  } catch { /* ignore */ }
}

watch(
  () => props.node.attrs.code,
  (val) => {
    if (val !== code.value) code.value = val
  },
)

watch(
  code,
  (val) => {
    props.updateAttributes({ code: val })
    scheduleRender()
  },
  { immediate: true },
)

watch(
  isEditable,
  (val) => {
    if (!val) showEditor.value = false
  },
  { immediate: true },
)

onMounted(renderDiagram)
</script>

<template>
  <NodeViewWrapper class="rte-mermaid-block">
    <div v-if="isEditable" class="rte-mermaid-toolbar">
      <div class="rte-mermaid-toolbar__left">
        <button
          class="rte-mermaid-btn rte-mermaid-btn--primary"
          :disabled="isRendering"
          @click="renderDiagram"
        >
          <Play :size="14" />
          <span>渲染</span>
        </button>
        <button class="rte-mermaid-btn" @click="toggleEdit">
          <Pencil :size="14" />
          <span>{{ showEditor ? '隐藏' : '编辑' }}</span>
        </button>
      </div>
      <div class="rte-mermaid-toolbar__right">
        <button class="rte-mermaid-btn rte-mermaid-btn--ghost" @click="copyCode" title="复制代码">
          <Copy :size="14" />
        </button>
        <button class="rte-mermaid-btn rte-mermaid-btn--ghost rte-mermaid-btn--danger" @click="deleteNode" title="删除">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <textarea
      v-if="showEditor && isEditable"
      v-model="code"
      class="rte-mermaid-textarea"
      spellcheck="false"
    />

    <div class="rte-mermaid-preview" :class="{ 'rte-mermaid-preview--error': errorMessage }">
      <div v-if="errorMessage" class="rte-mermaid-error">{{ errorMessage }}</div>
      <div v-else v-html="svgContent" />
    </div>
  </NodeViewWrapper>
</template>

<style>
.rte-mermaid-block {
  border: 1px solid var(--ra-color-border-default, #e5e7eb);
  border-radius: var(--ra-radius-lg, 8px);
  padding: 12px;
  background: var(--ra-color-bg-muted, #f8fafc);
  margin: 16px 0;
}

.rte-mermaid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rte-mermaid-toolbar__left,
.rte-mermaid-toolbar__right {
  display: flex;
  gap: 4px;
  align-items: center;
}

.rte-mermaid-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 4px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.15s ease;
}

.rte-mermaid-btn:hover:not(:disabled) {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.rte-mermaid-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rte-mermaid-btn--primary {
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rte-mermaid-btn--primary:hover:not(:disabled) {
  background: var(--ra-color-brand-primary-hover, #0860c4);
  color: #fff;
}

.rte-mermaid-btn--ghost {
  border: none;
  background: transparent;
  padding: 4px 6px;
}

.rte-mermaid-btn--danger:hover {
  color: var(--ra-color-danger, #cf222e);
}

.rte-mermaid-textarea {
  width: 100%;
  min-height: 120px;
  font-family: 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  border-radius: var(--ra-radius-md, 6px);
  border: 1px solid var(--ra-color-border-default, #d1d5db);
  padding: 10px;
  background: var(--ra-color-bg-surface, #fff);
  resize: vertical;
  margin-bottom: 12px;
  outline: none;
  box-sizing: border-box;
}

.rte-mermaid-textarea:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
  box-shadow: 0 0 0 2px var(--ra-color-focus-ring, rgba(9, 105, 218, 0.3));
}

.rte-mermaid-preview {
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-bg-surface, #fff);
  padding: 16px;
  min-height: 100px;
  border: 1px solid var(--ra-color-border-light, #e2e8f0);
  overflow: auto;
}

.rte-mermaid-preview--error {
  border-color: var(--ra-color-danger, #f87171);
  background: #fef2f2;
}

.rte-mermaid-error {
  color: var(--ra-color-danger, #b91c1c);
  font-size: 13px;
}
</style>

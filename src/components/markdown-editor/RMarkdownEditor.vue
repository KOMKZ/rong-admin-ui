<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { MarkdownEditorViewMode } from './types'
import { useViewMode } from './composables/useViewMode'
import EditorPane from './components/EditorPane.vue'
import PreviewPane from './components/PreviewPane.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    viewMode?: MarkdownEditorViewMode
    defaultSplitRatio?: number
    previewScale?: number
    height?: string | number
    placeholder?: string
    readonly?: boolean
    showModeToggle?: boolean
    showScaleControl?: boolean
  }>(),
  {
    modelValue: '',
    viewMode: 'split',
    defaultSplitRatio: 0.5,
    previewScale: 50,
    height: '100%',
    placeholder: '在此输入 Markdown 内容...',
    readonly: false,
    showModeToggle: true,
    showScaleControl: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:viewMode': [mode: MarkdownEditorViewMode]
  save: [content: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const splitRatio = ref(props.defaultSplitRatio)
const scale = ref(props.previewScale)
const isDraggingSplit = ref(false)

const { currentMode, isEditVisible, isPreviewVisible, isSplit, setMode } = useViewMode({
  initialMode: props.viewMode,
  onModeChange: (mode) => emit('update:viewMode', mode),
})

watch(
  () => props.viewMode,
  (newMode) => {
    if (newMode !== currentMode.value) {
      setMode(newMode)
    }
  },
)

watch(
  () => props.previewScale,
  (v) => {
    scale.value = v
  },
)

const normalizedHeight = computed(() => {
  if (typeof props.height === 'number') return `${props.height}px`
  return props.height
})

const editorStyle = computed(() => {
  if (!isSplit.value) return {}
  return { width: `${splitRatio.value * 100}%`, flex: 'none' }
})

const previewStyle = computed(() => {
  if (!isSplit.value) return {}
  return { width: `${(1 - splitRatio.value) * 100}%`, flex: 'none' }
})

function handleContentUpdate(value: string) {
  emit('update:modelValue', value)
}

const SPLIT_RATIO_KEY = 'rme-split-ratio'

function persistRatio() {
  try { localStorage.setItem(SPLIT_RATIO_KEY, String(splitRatio.value)) } catch { /* ignore */ }
}

function loadPersistedRatio() {
  try {
    const saved = localStorage.getItem(SPLIT_RATIO_KEY)
    if (saved) {
      const v = parseFloat(saved)
      if (!isNaN(v) && v >= 0.2 && v <= 0.8) splitRatio.value = v
    }
  } catch { /* ignore */ }
}

function onSplitDragStart(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  isDraggingSplit.value = true
  document.body.style.cursor = 'col-resize'
  document.addEventListener('mousemove', onSplitDragMove)
  document.addEventListener('mouseup', onSplitDragEnd)
  document.addEventListener('touchmove', onSplitDragMove, { passive: false })
  document.addEventListener('touchend', onSplitDragEnd)
}

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0
  return e.clientX
}

function onSplitDragMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingSplit.value || !containerRef.value) return
  e.preventDefault()
  const rect = containerRef.value.getBoundingClientRect()
  const x = getClientX(e) - rect.left
  splitRatio.value = Math.min(0.8, Math.max(0.2, x / rect.width))
}

function onSplitDragEnd() {
  isDraggingSplit.value = false
  document.body.style.cursor = ''
  document.removeEventListener('mousemove', onSplitDragMove)
  document.removeEventListener('mouseup', onSplitDragEnd)
  document.removeEventListener('touchmove', onSplitDragMove)
  document.removeEventListener('touchend', onSplitDragEnd)
  persistRatio()
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    emit('save', props.modelValue ?? '')
  }
}

function handleScaleInput(e: Event) {
  const target = e.target as HTMLInputElement
  scale.value = Number(target.value)
}

const modes: { key: MarkdownEditorViewMode; label: string }[] = [
  { key: 'split', label: '分屏' },
  { key: 'edit', label: '编辑' },
  { key: 'preview', label: '预览' },
]

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadPersistedRatio()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', onSplitDragMove)
  document.removeEventListener('mouseup', onSplitDragEnd)
  document.removeEventListener('touchmove', onSplitDragMove)
  document.removeEventListener('touchend', onSplitDragEnd)
})
</script>

<template>
  <div
    ref="containerRef"
    class="r-markdown-editor"
    :class="{ 'r-markdown-editor--dragging': isDraggingSplit }"
    :style="{ height: normalizedHeight }"
    data-testid="markdown-editor"
  >
    <div v-if="showModeToggle || showScaleControl" class="rme-toolbar">
      <div class="rme-toolbar__left">
        <slot name="toolbar-left" />
      </div>
      <div class="rme-toolbar__right">
        <template v-if="showScaleControl && isSplit">
          <label class="rme-scale-control" data-testid="markdown-editor-scale">
            <span class="rme-scale-label">预览缩放</span>
            <input
              type="range"
              class="rme-scale-slider"
              :value="scale"
              min="30"
              max="100"
              step="10"
              aria-label="预览缩放"
              @input="handleScaleInput"
            />
            <span class="rme-scale-value">{{ scale }}%</span>
          </label>
          <span class="rme-toolbar-divider" />
        </template>
        <div v-if="showModeToggle" class="rme-mode-toggle" role="group" aria-label="视图模式">
          <button
            v-for="m in modes"
            :key="m.key"
            class="rme-mode-btn"
            :class="{ 'rme-mode-btn--active': currentMode === m.key }"
            :aria-pressed="currentMode === m.key"
            @click="setMode(m.key)"
          >
            {{ m.label }}
          </button>
        </div>
        <slot name="toolbar-right" />
      </div>
    </div>

    <div class="rme-body">
      <div v-if="isEditVisible" class="rme-edit-area" :style="editorStyle">
        <EditorPane
          :model-value="modelValue"
          :placeholder="placeholder"
          :readonly="readonly"
          @update:model-value="handleContentUpdate"
        />
      </div>

      <div
        v-if="isSplit"
        class="rme-split-handle"
        role="separator"
        aria-orientation="vertical"
        tabindex="0"
        data-testid="markdown-editor-split-handle"
        @mousedown="onSplitDragStart"
        @touchstart="onSplitDragStart"
      >
        <div class="rme-split-handle__line" />
      </div>

      <div v-if="isPreviewVisible" class="rme-preview-area" :style="previewStyle">
        <PreviewPane :content="modelValue" :scale="scale" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-markdown-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-lg, 8px);
  overflow: hidden;
  background: var(--ra-color-bg-surface, #fff);
}

.r-markdown-editor--dragging {
  user-select: none;
  cursor: col-resize;
}

.r-markdown-editor--dragging .rme-edit-area,
.r-markdown-editor--dragging .rme-preview-area {
  pointer-events: none;
}

.rme-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
  background: var(--ra-color-bg-surface-secondary, #f6f8fa);
  flex-shrink: 0;
  gap: 12px;
}

.rme-toolbar__left,
.rme-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rme-toolbar__right {
  margin-left: auto;
}

.rme-scale-control {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
}

.rme-scale-label {
  font-size: var(--ra-font-size-xs, 12px);
  color: var(--ra-color-text-tertiary, #656d76);
  white-space: nowrap;
}

.rme-scale-slider {
  width: 80px;
  accent-color: var(--ra-color-brand-primary, #0969da);
}

.rme-scale-value {
  font-size: var(--ra-font-size-xs, 12px);
  color: var(--ra-color-text-primary, #24292f);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.rme-toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--ra-color-border-light, #e5e7eb);
}

.rme-mode-toggle {
  display: flex;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 6px);
  overflow: hidden;
}

.rme-mode-btn {
  padding: 4px 12px;
  font-size: var(--ra-font-size-xs, 12px);
  font-weight: var(--ra-font-weight-medium, 500);
  border: none;
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all var(--ra-transition-fast, 0.15s ease);
  line-height: 1.5;
}

.rme-mode-btn:not(:last-child) {
  border-right: 1px solid var(--ra-color-border-default, #d0d7de);
}

.rme-mode-btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

.rme-mode-btn--active {
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
}

.rme-mode-btn--active:hover {
  background: var(--ra-color-brand-primary, #0969da);
  opacity: 0.9;
}

.rme-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.rme-edit-area,
.rme-preview-area {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.rme-split-handle {
  width: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  background: var(--ra-color-bg-surface-secondary, #f6f8fa);
  border-left: 1px solid var(--ra-color-border-light, #e5e7eb);
  border-right: 1px solid var(--ra-color-border-light, #e5e7eb);
  transition: background 0.15s ease;
  touch-action: none;
}

.rme-split-handle:hover,
.rme-split-handle:focus-visible,
.r-markdown-editor--dragging .rme-split-handle {
  background: var(--ra-color-brand-subtle, #dbeafe);
}

.rme-split-handle:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring, #0969da);
  outline-offset: -2px;
}

.rme-split-handle__line {
  width: 3px;
  height: 32px;
  border-radius: 2px;
  background: var(--ra-color-border-default, #d0d7de);
  transition: background 0.15s ease;
}

.rme-split-handle:hover .rme-split-handle__line,
.r-markdown-editor--dragging .rme-split-handle__line {
  background: var(--ra-color-brand-primary, #0969da);
}
</style>

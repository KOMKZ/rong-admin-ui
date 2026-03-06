<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import type { ICellEditorParams } from 'ag-grid-community'

const props = defineProps<{ params: ICellEditorParams }>()
const wrapRef = ref<HTMLDivElement | null>(null)
const selected = ref<string>('')
const options = ref<string[]>([])
const searchText = ref('')

onMounted(() => {
  options.value = props.params.colDef?.cellEditorParams?.values || []
  const v = props.params.value
  selected.value = Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
  nextTick(() => wrapRef.value?.focus())
})

const filteredOptions = computed(() => {
  if (!searchText.value) return options.value
  const q = searchText.value.toLowerCase()
  return options.value.filter((o) => o.toLowerCase().includes(q))
})

function selectOption(opt: string, event: Event) {
  event.preventDefault()
  event.stopPropagation()
  selected.value = opt
  props.params.stopEditing()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    props.params.stopEditing()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    props.params.stopEditing(true)
  }
}

function getValue(): string | null { return selected.value || null }
function isCancelBeforeStart() { return false }
function isCancelAfterEnd() { return false }

defineExpose({ getValue, isCancelBeforeStart, isCancelAfterEnd })
</script>

<template>
  <div
    ref="wrapRef"
    class="rdg-select-editor"
    tabindex="-1"
    @keydown="handleKeydown"
    @mousedown.stop
  >
    <input
      v-model="searchText"
      class="rdg-select-editor__search"
      placeholder="搜索..."
      @mousedown.stop
      @keydown="handleKeydown"
    />
    <div class="rdg-select-editor__list">
      <div
        v-for="opt in filteredOptions"
        :key="opt"
        class="rdg-select-editor__option"
        :class="{ 'rdg-select-editor__option--selected': selected === opt }"
        @mousedown.prevent.stop="selectOption(opt, $event)"
      >
        <span class="rdg-select-editor__check">{{ selected === opt ? '✓' : '' }}</span>
        <span>{{ opt }}</span>
      </div>
      <div v-if="filteredOptions.length === 0" class="rdg-select-editor__empty">无匹配选项</div>
    </div>
  </div>
</template>

<style>
.rdg-select-editor {
  display: flex;
  flex-direction: column;
  background: var(--ra-color-bg-surface, #fff);
  border: 2px solid var(--ra-color-brand-primary, #0969da);
  border-radius: 6px;
  min-width: 200px;
  max-height: 280px;
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 10;
}

.rdg-select-editor__search {
  margin: 8px 8px 4px;
  padding: 4px 8px;
  border: 1px solid var(--ra-color-border, #d0d7de);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.rdg-select-editor__search:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rdg-select-editor__list {
  flex: 1;
  overflow-y: auto;
  max-height: 220px;
  padding: 2px 0;
}

.rdg-select-editor__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}

.rdg-select-editor__option:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

.rdg-select-editor__option--selected {
  color: var(--ra-color-brand-primary, #0969da);
  font-weight: 500;
}

.rdg-select-editor__check {
  width: 16px;
  font-size: 12px;
  text-align: center;
  color: var(--ra-color-brand-primary, #0969da);
}

.rdg-select-editor__empty {
  color: var(--ra-color-text-muted, #8c959f);
  font-size: 12px;
  padding: 8px 12px;
  text-align: center;
}
</style>

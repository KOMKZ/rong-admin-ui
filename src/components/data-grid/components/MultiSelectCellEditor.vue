<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import type { ICellEditorParams } from 'ag-grid-community'

const props = defineProps<{ params: ICellEditorParams }>()
const wrapRef = ref<HTMLDivElement | null>(null)
const selected = ref<string[]>([])
const options = ref<string[]>([])
const searchText = ref('')

onMounted(() => {
  options.value = props.params.colDef?.cellEditorParams?.values || []
  const v = props.params.value
  if (Array.isArray(v)) selected.value = v.filter((s: any) => s != null && s !== '')
  else if (typeof v === 'string' && v) selected.value = v.split(',').map((s: string) => s.trim()).filter(Boolean)
  nextTick(() => wrapRef.value?.focus())
})

const filteredOptions = computed(() => {
  if (!searchText.value) return options.value
  const q = searchText.value.toLowerCase()
  return options.value.filter((o) => o.toLowerCase().includes(q))
})

function toggle(opt: string, event: Event) {
  event.preventDefault()
  event.stopPropagation()
  const idx = selected.value.indexOf(opt)
  if (idx >= 0) selected.value = selected.value.filter((s) => s !== opt)
  else selected.value = [...selected.value, opt]
}

function removeTag(opt: string, event: Event) {
  event.preventDefault()
  event.stopPropagation()
  selected.value = selected.value.filter((s) => s !== opt)
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

function getValue(): string[] { return selected.value }
function isCancelBeforeStart() { return false }
function isCancelAfterEnd() { return false }

defineExpose({ getValue, isCancelBeforeStart, isCancelAfterEnd })
</script>

<template>
  <div
    ref="wrapRef"
    class="rdg-multiselect-editor"
    tabindex="-1"
    @keydown="handleKeydown"
    @mousedown.stop
  >
    <div v-if="selected.length > 0" class="rdg-multiselect-editor__tags">
      <span
        v-for="val in selected"
        :key="val"
        class="rdg-multiselect-editor__tag"
      >
        {{ val }}
        <button
          class="rdg-multiselect-editor__tag-remove"
          @mousedown.prevent.stop="removeTag(val, $event)"
        >&times;</button>
      </span>
    </div>
    <input
      v-model="searchText"
      class="rdg-multiselect-editor__search"
      placeholder="搜索..."
      @mousedown.stop
      @keydown="handleKeydown"
    />
    <div class="rdg-multiselect-editor__list">
      <div
        v-for="opt in filteredOptions"
        :key="opt"
        class="rdg-multiselect-editor__option"
        :class="{ 'rdg-multiselect-editor__option--selected': selected.includes(opt) }"
        @mousedown.prevent.stop="toggle(opt, $event)"
      >
        <span class="rdg-multiselect-editor__check">{{ selected.includes(opt) ? '✓' : '' }}</span>
        <span>{{ opt }}</span>
      </div>
      <div v-if="filteredOptions.length === 0" class="rdg-multiselect-editor__empty">无匹配选项</div>
    </div>
    <div class="rdg-multiselect-editor__footer">
      <span class="rdg-multiselect-editor__count">已选 {{ selected.length }} 项</span>
      <button class="rdg-multiselect-editor__confirm" @mousedown.prevent.stop="params.stopEditing()">确定</button>
    </div>
  </div>
</template>

<style>
.ag-cell-inline-editing {
  overflow: visible !important;
  z-index: 2;
}

.rdg-multiselect-editor {
  display: flex;
  flex-direction: column;
  background: var(--ra-color-bg-surface, #fff);
  border: 2px solid var(--ra-color-brand-primary, #0969da);
  border-radius: 6px;
  min-width: 220px;
  max-height: 320px;
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 10;
}

.rdg-multiselect-editor__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 8px 4px;
}

.rdg-multiselect-editor__tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--ra-color-brand-subtle, #dbeafe);
  color: var(--ra-color-brand-primary, #0969da);
}

.rdg-multiselect-editor__tag-remove {
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  opacity: 0.7;
}

.rdg-multiselect-editor__tag-remove:hover { opacity: 1; }

.rdg-multiselect-editor__search {
  margin: 4px 8px;
  padding: 4px 8px;
  border: 1px solid var(--ra-color-border, #d0d7de);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.rdg-multiselect-editor__search:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rdg-multiselect-editor__list {
  flex: 1;
  overflow-y: auto;
  max-height: 180px;
  padding: 2px 0;
}

.rdg-multiselect-editor__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}

.rdg-multiselect-editor__option:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

.rdg-multiselect-editor__option--selected {
  color: var(--ra-color-brand-primary, #0969da);
}

.rdg-multiselect-editor__check {
  width: 16px;
  font-size: 12px;
  text-align: center;
  color: var(--ra-color-brand-primary, #0969da);
}

.rdg-multiselect-editor__empty {
  color: var(--ra-color-text-muted, #8c959f);
  font-size: 12px;
  padding: 8px 12px;
  text-align: center;
}

.rdg-multiselect-editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-top: 1px solid var(--ra-color-border, #e5e7eb);
}

.rdg-multiselect-editor__count {
  font-size: 12px;
  color: var(--ra-color-text-muted, #8c959f);
}

.rdg-multiselect-editor__confirm {
  padding: 3px 12px;
  border: none;
  border-radius: 4px;
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.rdg-multiselect-editor__confirm:hover { opacity: 0.9; }
</style>

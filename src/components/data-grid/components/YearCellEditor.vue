<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import type { ICellEditorParams } from 'ag-grid-community'

const props = defineProps<{ params: ICellEditorParams }>()
const inputRef = ref<HTMLInputElement | null>(null)
const yearValue = ref<string>('')

onMounted(() => {
  const v = props.params.value
  if (v) yearValue.value = typeof v === 'number' ? String(v) : String(parseInt(v) || '')
  setTimeout(() => { inputRef.value?.focus(); inputRef.value?.select() }, 0)
})

function getValue(): string {
  const y = parseInt(yearValue.value)
  return !isNaN(y) && y >= 1900 && y <= 2100 ? String(y) : ''
}

function isCancelBeforeStart() { return false }
function isCancelAfterEnd() { return false }

defineExpose({ getValue, isCancelBeforeStart, isCancelAfterEnd })
</script>

<template>
  <input
    ref="inputRef"
    v-model="yearValue"
    type="number"
    min="1900"
    max="2100"
    step="1"
    placeholder="YYYY"
    class="rdg-cell-editor rdg-cell-editor--year"
    @keydown.enter="params.stopEditing()"
    @keydown.escape="params.stopEditing(true)"
  />
</template>

<style>
.rdg-cell-editor--year {
  width: 100%;
  height: 100%;
  border: 2px solid var(--ra-color-brand-primary, #0969da);
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
</style>

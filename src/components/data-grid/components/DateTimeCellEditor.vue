<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import type { ICellEditorParams } from 'ag-grid-community'

const props = defineProps<{ params: ICellEditorParams }>()

const inputRef = ref<HTMLInputElement | null>(null)
const value = ref('')

onMounted(() => {
  const v = props.params.value
  if (v) {
    try {
      const d =
        typeof v === 'string'
          ? /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)
            ? new Date(v.replace(' ', 'T'))
            : new Date(v)
          : typeof v === 'number'
            ? new Date(v)
            : null
      if (d && !isNaN(d.getTime())) {
        value.value = d.toISOString().slice(0, 19)
      }
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => inputRef.value?.focus(), 0)
})

function getValue(): string {
  if (!value.value) return ''
  try {
    const d = new Date(value.value)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    }
  } catch {
    /* ignore */
  }
  return ''
}

function isCancelBeforeStart() {
  return false
}
function isCancelAfterEnd() {
  return false
}

defineExpose({ getValue, isCancelBeforeStart, isCancelAfterEnd })
</script>

<template>
  <input
    ref="inputRef"
    v-model="value"
    type="datetime-local"
    step="1"
    class="rdg-cell-editor rdg-cell-editor--datetime"
    @keydown.enter="params.stopEditing()"
    @keydown.escape="params.stopEditing(true)"
  />
</template>

<style>
.rdg-cell-editor--datetime {
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

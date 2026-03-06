<script lang="ts" setup>
import { computed } from 'vue'
import type { ICellRendererParams } from 'ag-grid-community'

const props = defineProps<{ params: ICellRendererParams }>()

const displayValue = computed(() => {
  const v = props.params.value
  if (v == null || v === '') return ''
  return String(v)
})
</script>

<template>
  <div class="rdg-select-renderer">
    <span v-if="displayValue" class="rdg-select-renderer__tag">{{ displayValue }}</span>
  </div>
</template>

<style>
.rdg-select-renderer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 4px 0;
  min-height: 24px;
}

.rdg-select-renderer__tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--ra-color-brand-subtle, #dbeafe);
  color: var(--ra-color-brand-primary, #0969da);
}
</style>

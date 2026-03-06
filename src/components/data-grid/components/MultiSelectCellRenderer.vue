<script lang="ts" setup>
import { computed } from 'vue'
import type { ICellRendererParams } from 'ag-grid-community'

const props = defineProps<{ params: ICellRendererParams }>()

const displayValues = computed(() => {
  const v = props.params.value
  if (Array.isArray(v)) return v.filter((s: any) => s != null && s !== '')
  if (typeof v === 'string' && v) return v.split(',').map((s: string) => s.trim()).filter(Boolean)
  return []
})
</script>

<template>
  <div class="rdg-multiselect-renderer">
    <span
      v-for="(val, idx) in displayValues"
      :key="idx"
      class="rdg-multiselect-renderer__tag"
    >{{ val }}</span>
  </div>
</template>

<style>
.rdg-multiselect-renderer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  padding: 4px 0;
  min-height: 24px;
}

.rdg-multiselect-renderer__tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--ra-color-brand-subtle, #dbeafe);
  color: var(--ra-color-brand-primary, #0969da);
}
</style>

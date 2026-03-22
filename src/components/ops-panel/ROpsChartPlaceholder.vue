<template>
  <div class="r-ops-chart-placeholder" :style="wrapStyle">
    <slot>
      <span v-if="label">{{ label }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 例如 `160px`、`140px` */
    height?: string
    label?: string
  }>(),
  {
    height: '160px',
    label: '',
  },
)

const wrapStyle = computed(() => ({ height: props.height }))
</script>

<style scoped>
.r-ops-chart-placeholder {
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-3);
  font-size: 13px;
  box-sizing: border-box;
}
</style>

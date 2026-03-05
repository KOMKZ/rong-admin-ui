<script lang="ts" setup>
import { computed } from 'vue'
import type { KpiItem, KpiGridCols } from './types'
import { RStatCard } from '../stat-card'

const props = withDefaults(
  defineProps<{
    items: KpiItem[]
    cols?: KpiGridCols
    loading?: boolean
    gap?: number
  }>(),
  {
    cols: 4,
    loading: false,
    gap: 16,
  },
)

const emit = defineEmits<{
  'item-click': [key: string]
}>()

const gridStyle = computed(() => ({
  '--kpi-grid-cols': props.cols,
  '--kpi-grid-gap': `${props.gap}px`,
}))

function handleItemClick(key: string): void {
  emit('item-click', key)
}
</script>

<template>
  <div class="r-kpi-grid" :style="gridStyle" data-testid="kpi-grid">
    <RStatCard
      v-for="item in items"
      :key="item.key"
      :title="item.title"
      :value="item.value"
      :prefix="item.prefix"
      :suffix="item.suffix"
      :trend="item.trend"
      :trend-value="item.trendValue"
      :trend-label="item.trendLabel"
      :icon="item.icon"
      :icon-color="item.iconColor"
      :description="item.description"
      :loading="loading || item.loading"
      :size="item.size"
      :variant="item.variant"
      :clickable="item.clickable"
      @click="handleItemClick(item.key)"
    />
  </div>
</template>

<style scoped>
.r-kpi-grid {
  display: grid;
  grid-template-columns: repeat(var(--kpi-grid-cols, 4), minmax(0, 1fr));
  gap: var(--kpi-grid-gap, 16px);
}

@media (max-width: 1280px) {
  .r-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .r-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .r-kpi-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

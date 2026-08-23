<script lang="ts" setup>
  import { type PropType } from 'vue'
  import {
    type ColumnPreset,
    type TableDensity,
    type TableToolbarAction,
  } from '../table-toolbar/types'
  import RTableToolbarPro from '../table-toolbar/RTableToolbarPro.vue'

  const props = defineProps({
    title: { type: String, default: undefined },
    loading: { type: Boolean, default: false },
    refreshable: { type: Boolean, default: true },
    exportable: { type: Boolean, default: false },
    exportLabel: { type: String, default: '导出全部' },
    exportConfirmMessage: { type: String, default: '确定导出全部数据？' },
    actions: { type: Array as PropType<TableToolbarAction[]>, default: () => [] },
    densitySwitchable: { type: Boolean, default: true },
    fullscreenable: { type: Boolean, default: false },
    columnConfigurable: { type: Boolean, default: false },
    currentDensity: { type: String as PropType<TableDensity>, default: 'default' },
    columnPresets: { type: Array as PropType<ColumnPreset[]>, default: () => [] },
    dataTestid: { type: String, default: undefined },
  })

  const emit = defineEmits<{
    refresh: []
    export: []
    action: [key: string]
    'update:density': [density: TableDensity]
    'update:fullscreen': [fullscreen: boolean]
    'update:columnPresets': [presets: ColumnPreset[]]
  }>()
</script>

<template>
  <div class="ra-card ra-card--flush r-table-card" :data-testid="dataTestid">
    <div class="r-table-card__header">
      <RTableToolbarPro
        :title="props.title"
        :loading="props.loading"
        :refreshable="props.refreshable"
        :exportable="props.exportable"
        :export-label="props.exportLabel"
        :export-confirm-message="props.exportConfirmMessage"
        :actions="props.actions"
        :density-switchable="props.densitySwitchable"
        :fullscreenable="props.fullscreenable"
        :column-configurable="props.columnConfigurable"
        :current-density="props.currentDensity"
        :column-presets="props.columnPresets"
        @refresh="emit('refresh')"
        @export="emit('export')"
        @action="emit('action', $event)"
        @update:density="emit('update:density', $event)"
        @update:fullscreen="emit('update:fullscreen', $event)"
        @update:column-presets="emit('update:columnPresets', $event)"
      >
        <template #prefix>
          <slot name="prefix" />
        </template>
        <template #title>
          <slot name="title">
            <span v-if="props.title" class="r-table-card__title">{{ props.title }}</span>
          </slot>
        </template>
        <template #extra>
          <slot name="extra" />
        </template>
      </RTableToolbarPro>
    </div>

    <div class="r-table-card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="r-table-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
  .r-table-card__header {
    padding: var(--ra-spacing-4, 16px) var(--ra-card-padding-x) var(--ra-spacing-3, 12px);
  }

  .r-table-card__body {
    padding: 0 var(--ra-card-padding-x) var(--ra-spacing-4, 16px);
  }

  .r-table-card__footer {
    padding: 0 var(--ra-card-padding-x) var(--ra-spacing-4, 16px);
  }

  /* ra-card--flush 下分页区贴边，统一在框架层补内边距 */
  .r-table-card :deep(.n-data-table__pagination) {
    padding: var(--ra-spacing-3, 12px) 0 0;
  }

  .r-table-card__title {
    font-size: var(--ra-font-size-base);
    font-weight: var(--ra-font-weight-semibold);
    color: var(--ra-color-text-primary);
  }
</style>

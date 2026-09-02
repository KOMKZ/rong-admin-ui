<script lang="ts" setup>
  import { type PropType } from 'vue'
  import RPage from './RPage.vue'
  import RTableCard from '../table-card/RTableCard.vue'
  import {
    type ColumnPreset,
    type TableDensity,
    type TableToolbarAction,
  } from '../table-toolbar/types'

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
    tableTestid: { type: String, default: undefined },
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
  <RPage class="r-list-page" :data-testid="props.dataTestid">
    <slot name="filters" />

    <RTableCard
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
      :data-testid="props.tableTestid"
      @refresh="emit('refresh')"
      @export="emit('export')"
      @action="emit('action', $event)"
      @update:density="emit('update:density', $event)"
      @update:fullscreen="emit('update:fullscreen', $event)"
      @update:column-presets="emit('update:columnPresets', $event)"
    >
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.extra" #extra>
        <slot name="extra" />
      </template>
      <slot />
      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </RTableCard>

    <slot name="overlays" />
  </RPage>
</template>

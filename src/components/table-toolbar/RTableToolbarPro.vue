<script lang="ts" setup>
  import { ref, type PropType } from 'vue'
  import { NButton, NSpace, NPopover, NCheckbox, NTooltip, useDialog } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import type {
    TableDensity,
    ColumnPreset,
    TableToolbarAction,
    TableToolbarProExpose,
  } from './types'

  const props = defineProps({
    title: { type: String, default: undefined },
    refreshable: { type: Boolean, default: true },
    exportable: { type: Boolean, default: false },
    exportLabel: { type: String, default: '导出全部' },
    exportConfirmMessage: { type: String, default: '确定导出全部数据？' },
    actions: { type: Array as PropType<TableToolbarAction[]>, default: () => [] },
    densitySwitchable: { type: Boolean, default: true },
    fullscreenable: { type: Boolean, default: true },
    columnConfigurable: { type: Boolean, default: false },
    currentDensity: { type: String as PropType<TableDensity>, default: 'default' },
    columnPresets: { type: Array as PropType<ColumnPreset[]>, default: () => [] },
    loading: { type: Boolean, default: false },
  })

  const emit = defineEmits<{
    refresh: []
    export: []
    action: [key: string]
    'update:density': [density: TableDensity]
    'update:fullscreen': [fullscreen: boolean]
    'update:columnPresets': [presets: ColumnPreset[]]
  }>()

  type DialogApi = ReturnType<typeof useDialog>

  let dialog: DialogApi | null = null
  try {
    dialog = useDialog()
  } catch {
    dialog = null
  }

  const isFullscreen = ref(false)
  const densityOptions: { value: TableDensity; label: string; icon: string }[] = [
    { value: 'compact', label: '紧凑', icon: 'minimize-2' },
    { value: 'default', label: '默认', icon: 'menu' },
    { value: 'comfortable', label: '宽松', icon: 'maximize-2' },
  ]

  function handleRefresh(): void {
    emit('refresh')
  }

  function handleExport(): void {
    confirmAction(
      {
        key: 'export',
        label: props.exportLabel,
        icon: 'download',
        confirmMessage: props.exportConfirmMessage,
      },
      () => emit('export'),
    )
  }

  function handleAction(action: TableToolbarAction): void {
    confirmAction(action, () => emit('action', action.key))
  }

  function confirmAction(action: TableToolbarAction, run: () => void): void {
    if (!action.confirmMessage) {
      run()
      return
    }
    if (!dialog) {
      if (typeof window === 'undefined' || window.confirm(action.confirmMessage)) {
        run()
      }
      return
    }
    dialog.warning({
      title: action.confirmTitle ?? '确认操作',
      content: action.confirmMessage,
      positiveText: action.positiveText ?? '确定',
      negativeText: action.negativeText ?? '取消',
      onPositiveClick: run,
    })
  }

  function handleDensityChange(density: TableDensity): void {
    emit('update:density', density)
  }

  function toggleFullscreen(): void {
    isFullscreen.value = !isFullscreen.value
    emit('update:fullscreen', isFullscreen.value)
  }

  function handleColumnToggle(key: string): void {
    const updated = props.columnPresets.map((p) =>
      p.key === key ? { ...p, visible: !p.visible } : p,
    )
    emit('update:columnPresets', updated)
  }

  function resetColumns(): void {
    const reset = props.columnPresets.map((p) => ({ ...p, visible: true }))
    emit('update:columnPresets', reset)
  }

  const expose: TableToolbarProExpose = {
    toggleFullscreen,
    resetColumns,
  }

  defineExpose(expose)
</script>

<template>
  <div class="r-table-toolbar-pro">
    <div class="r-table-toolbar-pro__left">
      <slot name="prefix" />
      <slot name="title">
        <span v-if="title" class="r-table-toolbar-pro__title">{{ title }}</span>
      </slot>
    </div>

    <div class="r-table-toolbar-pro__right">
      <NSpace size="small" align="center">
        <slot name="extra" />

        <NTooltip v-for="action in actions" :key="action.key">
          <template #trigger>
            <NButton
              quaternary
              :circle="Boolean(action.icon)"
              size="small"
              :type="action.danger ? 'error' : 'default'"
              :disabled="action.disabled"
              :data-testid="`toolbar-action-${action.key}`"
              @click="handleAction(action)"
            >
              <template v-if="action.icon" #icon>
                <RIcon :name="action.icon" :size="16" />
              </template>
              <span v-if="!action.icon" class="r-table-toolbar-pro__action-label">
                {{ action.label }}
              </span>
            </NButton>
          </template>
          {{ action.label }}
        </NTooltip>

        <!-- Refresh -->
        <NTooltip v-if="refreshable">
          <template #trigger>
            <NButton
              quaternary
              circle
              size="small"
              :loading="loading"
              data-testid="toolbar-refresh"
              @click="handleRefresh"
            >
              <template #icon><RIcon name="refresh" :size="16" /></template>
            </NButton>
          </template>
          刷新
        </NTooltip>

        <!-- Density -->
        <NPopover v-if="densitySwitchable" trigger="click" placement="bottom">
          <template #trigger>
            <NButton quaternary circle size="small" data-testid="toolbar-density">
              <template #icon><RIcon name="sliders" :size="16" /></template>
            </NButton>
          </template>
          <div class="r-table-toolbar-pro__density-panel" data-testid="density-panel">
            <NButton
              v-for="opt in densityOptions"
              :key="opt.value"
              :type="currentDensity === opt.value ? 'primary' : 'default'"
              size="small"
              block
              @click="handleDensityChange(opt.value)"
            >
              <template #icon><RIcon :name="opt.icon" :size="14" /></template>
              {{ opt.label }}
            </NButton>
          </div>
        </NPopover>

        <!-- Column Config -->
        <NPopover v-if="columnConfigurable" trigger="click" placement="bottom-end">
          <template #trigger>
            <NButton quaternary circle size="small" data-testid="toolbar-columns">
              <template #icon><RIcon name="settings" :size="16" /></template>
            </NButton>
          </template>
          <div class="r-table-toolbar-pro__column-panel" data-testid="column-panel">
            <div class="r-table-toolbar-pro__column-header">
              <span>列设置</span>
              <NButton text size="tiny" type="primary" @click="resetColumns">重置</NButton>
            </div>
            <div
              v-for="preset in columnPresets"
              :key="preset.key"
              class="r-table-toolbar-pro__column-item"
            >
              <NCheckbox
                :checked="preset.visible"
                :label="preset.label"
                @update:checked="handleColumnToggle(preset.key)"
              />
            </div>
          </div>
        </NPopover>

        <!-- Fullscreen -->
        <NTooltip v-if="fullscreenable">
          <template #trigger>
            <NButton
              quaternary
              circle
              size="small"
              data-testid="toolbar-fullscreen"
              @click="toggleFullscreen"
            >
              <template #icon>
                <RIcon :name="isFullscreen ? 'minimize-2' : 'maximize-2'" :size="16" />
              </template>
            </NButton>
          </template>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </NTooltip>

        <!-- Export -->
        <NTooltip v-if="exportable">
          <template #trigger>
            <NButton
              quaternary
              circle
              size="small"
              data-testid="toolbar-export"
              @click="handleExport"
            >
              <template #icon><RIcon name="download" :size="16" /></template>
            </NButton>
          </template>
          {{ exportLabel }}
        </NTooltip>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
  .r-table-toolbar-pro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ra-spacing-3) 0;
    gap: var(--ra-spacing-4);
  }
  .r-table-toolbar-pro__left {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-3);
  }
  .r-table-toolbar-pro__right {
    display: flex;
    align-items: center;
  }
  .r-table-toolbar-pro__title {
    font-size: var(--ra-font-size-base);
    font-weight: var(--ra-font-weight-semibold);
    color: var(--ra-color-text-primary);
  }
  .r-table-toolbar-pro__density-panel {
    display: flex;
    flex-direction: column;
    gap: var(--ra-spacing-1);
    min-width: 120px;
  }
  .r-table-toolbar-pro__column-panel {
    min-width: 180px;
    max-height: 300px;
    overflow-y: auto;
  }
  .r-table-toolbar-pro__column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--ra-spacing-2);
    border-bottom: 1px solid var(--ra-color-border-default);
    margin-bottom: var(--ra-spacing-2);
    font-size: var(--ra-font-size-sm);
    font-weight: var(--ra-font-weight-medium);
  }
  .r-table-toolbar-pro__column-item {
    padding: var(--ra-spacing-1) 0;
  }
</style>

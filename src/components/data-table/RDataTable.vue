<script lang="ts" setup generic="T extends Record<string, unknown> = Record<string, unknown>">
  import { computed, ref, watch, type PropType } from 'vue'
  import { NDataTable, NEmpty, NSpin, type DataTableColumns } from 'naive-ui'
  import RBatchActionBar from '../batch-action-bar/RBatchActionBar.vue'
  import type { BatchAction } from '../batch-action-bar/types'
  import type {
    DataTableColumn,
    DataTablePagination,
    DataTableRowKey,
    DataTableSortState,
    DataTableFilterState,
    DataTableExpose,
    ColumnConfigItem,
    ServerSideParams,
    DataTableBatchPayload,
    DataTableExportPayload,
  } from './types'

  const props = defineProps({
    columns: { type: Array as PropType<DataTableColumn<T>[]>, required: true },
    data: { type: Array as PropType<T[]>, required: true },
    loading: { type: Boolean, default: false },
    rowKey: {
      type: [String, Function] as PropType<string | ((row: T) => DataTableRowKey)>,
      default: 'id',
    },
    pagination: {
      type: [Object, Boolean] as PropType<DataTablePagination | false>,
      default: false,
    },
    bordered: { type: Boolean, default: true },
    striped: { type: Boolean, default: false },
    singleLine: { type: Boolean, default: true },
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
    maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
    scrollX: { type: [Number, String] as PropType<number | string>, default: undefined },
    selectable: { type: Boolean, default: false },
    checkedRowKeys: { type: Array as PropType<DataTableRowKey[]>, default: () => [] },
    defaultSort: { type: Object as PropType<DataTableSortState>, default: undefined },
    emptyText: { type: String, default: '暂无数据' },
    remote: { type: Boolean, default: undefined },
    columnConfigurable: { type: Boolean, default: false },
    columnStorageKey: { type: String, default: undefined },
    exportable: { type: Boolean, default: false },
    exportSelected: { type: Boolean, default: true },
    batchDeletable: { type: Boolean, default: false },
    batchActions: { type: Array as PropType<BatchAction[]>, default: () => [] },
    exportSelectedLabel: { type: String, default: '导出选中' },
    exportSelectedConfirmMessage: { type: String, default: '确定导出选中的数据？' },
    batchDeleteLabel: { type: String, default: '批量删除' },
    batchDeleteConfirmMessage: { type: String, default: '确定删除选中的数据？此操作不可恢复' },
    exportHandler: {
      type: Function as PropType<(payload: DataTableExportPayload<T>) => void | Promise<void>>,
      default: undefined,
    },
    batchDeleteHandler: {
      type: Function as PropType<(payload: DataTableBatchPayload<T>) => void | Promise<void>>,
      default: undefined,
    },
  })

  const emit = defineEmits<{
    'update:page': [page: number]
    'update:pageSize': [pageSize: number]
    'update:checkedRowKeys': [keys: DataTableRowKey[]]
    'update:sort': [sort: DataTableSortState]
    'update:filters': [filters: DataTableFilterState[]]
    'server-params-change': [params: ServerSideParams]
    rowClick: [row: T, index: number]
    export: [payload: DataTableExportPayload<T>]
    batchDelete: [payload: DataTableBatchPayload<T>]
    batchAction: [key: string, selectedKeys: DataTableRowKey[], selectedRows: T[]]
  }>()

  const tableRef = ref<InstanceType<typeof NDataTable> | null>(null)
  const showColumnConfig = ref(false)

  const columnConfig = ref<ColumnConfigItem[]>([])
  const activeFilters = ref<DataTableFilterState[]>([])
  const currentSort = ref<DataTableSortState | undefined>(props.defaultSort)

  function initColumnConfig(): void {
    if (props.columnStorageKey) {
      try {
        const stored = localStorage.getItem(`ra-col-cfg-${props.columnStorageKey}`)
        if (stored) {
          const parsed = JSON.parse(stored) as ColumnConfigItem[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            columnConfig.value = parsed
            return
          }
        }
      } catch {
        /* use defaults */
      }
    }

    columnConfig.value = props.columns.map((col, idx) => ({
      key: col.key,
      visible: col.defaultVisible !== false,
      order: idx,
    }))
  }

  initColumnConfig()

  function persistColumnConfig(): void {
    if (!props.columnStorageKey) return
    try {
      localStorage.setItem(
        `ra-col-cfg-${props.columnStorageKey}`,
        JSON.stringify(columnConfig.value),
      )
    } catch {
      /* noop */
    }
  }

  watch(
    () => props.columns,
    () => {
      const existingKeys = new Set(columnConfig.value.map((c) => c.key))
      for (const col of props.columns) {
        if (!existingKeys.has(col.key)) {
          columnConfig.value.push({
            key: col.key,
            visible: col.defaultVisible !== false,
            order: columnConfig.value.length,
          })
        }
      }
    },
    { deep: true },
  )

  const effectiveColumns = computed(() => {
    if (!props.columnConfigurable) return props.columns

    const configMap = new Map(columnConfig.value.map((c) => [c.key, c]))
    return [...props.columns]
      .filter((col) => {
        const cfg = configMap.get(col.key)
        return cfg ? cfg.visible : true
      })
      .sort((a, b) => {
        const oa = configMap.get(a.key)?.order ?? 999
        const ob = configMap.get(b.key)?.order ?? 999
        return oa - ob
      })
  })

  const naiveColumns = computed<DataTableColumns<T>>(() => {
    const cols: DataTableColumns<T> = []

    if (props.selectable) {
      cols.push({ type: 'selection' })
    }

    for (const col of effectiveColumns.value) {
      cols.push({
        key: col.key,
        title: col.title,
        width: col.width,
        minWidth: col.minWidth,
        fixed: col.fixed,
        ellipsis: col.ellipsis ? { tooltip: true } : undefined,
        align: col.align,
        sorter: col.sortable ? (col.sorter ?? true) : undefined,
        render: col.render
          ? (row: T, index: number) =>
              col.render!(row, index) as unknown as import('vue').VNodeChild
          : undefined,
      })
    }

    return cols
  })

  const naivePagination = computed(() => {
    if (props.pagination === false) return false
    return {
      page: props.pagination.page,
      pageSize: props.pagination.pageSize,
      itemCount: props.pagination.total,
      pageSizes: props.pagination.pageSizes ?? [10, 20, 50, 100],
      showSizePicker: true,
      showQuickJumper: true,
      onChange: (page: number) => {
        emit('update:page', page)
        emitServerParams()
      },
      onUpdatePageSize: (pageSize: number) => {
        emit('update:pageSize', pageSize)
        emitServerParams()
      },
    }
  })

  const isRemote = computed(() => {
    if (props.remote !== undefined) {
      return props.remote
    }
    return props.pagination !== false
  })

  const rowKeyFn = computed(() => {
    if (typeof props.rowKey === 'function') return props.rowKey
    const key = props.rowKey
    return (row: T) => row[key] as DataTableRowKey
  })

  const selectedCount = computed(() => props.checkedRowKeys.length)
  const selectedRows = computed(() => {
    const selected = new Set(props.checkedRowKeys)
    return props.data.filter((row) => selected.has(rowKeyFn.value(row)))
  })
  const builtInBatchActions = computed<BatchAction[]>(() => {
    const actions: BatchAction[] = []
    if (props.exportable && props.exportSelected) {
      actions.push({
        key: 'export-selected',
        label: props.exportSelectedLabel,
        icon: 'download',
        confirmMessage: props.exportSelectedConfirmMessage,
      })
    }
    if (props.batchDeletable) {
      actions.push({
        key: 'delete',
        label: props.batchDeleteLabel,
        icon: 'trash-2',
        danger: true,
        confirmMessage: props.batchDeleteConfirmMessage,
      })
    }
    return [...actions, ...props.batchActions]
  })
  const showBatchToolbar = computed<boolean>(
    (): boolean => props.selectable && selectedCount.value > 0,
  )

  function emitServerParams(): void {
    const params: ServerSideParams = {}
    if (currentSort.value) params.sort = currentSort.value
    if (activeFilters.value.length > 0) params.filters = activeFilters.value
    if (props.pagination && typeof props.pagination !== 'boolean') {
      params.pagination = { page: props.pagination.page, pageSize: props.pagination.pageSize }
    }
    emit('server-params-change', params)
  }

  function handleSorterChange(
    sorter: { columnKey: string; order: 'ascend' | 'descend' | false } | null,
  ): void {
    if (!sorter) return
    currentSort.value = { columnKey: sorter.columnKey, order: sorter.order }
    emit('update:sort', currentSort.value)
    emitServerParams()
  }

  function handleCheckedRowKeysChange(keys: DataTableRowKey[]): void {
    emit('update:checkedRowKeys', keys)
  }

  async function handleExport(scope: 'all' | 'selected'): Promise<void> {
    const payload: DataTableExportPayload<T> = {
      scope,
      rows: scope === 'selected' ? selectedRows.value : props.data,
      selectedKeys: [...props.checkedRowKeys],
      columns: effectiveColumns.value,
    }
    emit('export', payload)
    if (props.exportHandler) {
      await props.exportHandler(payload)
    }
  }

  async function handleBatchAction(key: string, selectedKeys: DataTableRowKey[]): Promise<void> {
    if (key === 'export-selected') {
      await handleExport('selected')
      return
    }

    const payload: DataTableBatchPayload<T> = {
      selectedKeys: [...selectedKeys],
      selectedRows: selectedRows.value,
    }

    if (key === 'delete') {
      emit('batchDelete', payload)
      if (props.batchDeleteHandler) {
        await props.batchDeleteHandler(payload)
      }
      emit('update:checkedRowKeys', [])
      return
    }

    emit('batchAction', key, [...selectedKeys], selectedRows.value)
  }

  function handleRowProps(row: T, index: number): Record<string, unknown> {
    return {
      onClick: () => emit('rowClick', row, index),
    }
  }

  function toggleColumnVisibility(key: string): void {
    const item = columnConfig.value.find((c) => c.key === key)
    if (item) {
      item.visible = !item.visible
      persistColumnConfig()
    }
  }

  function isColumnVisible(key: string): boolean {
    return columnConfig.value.find((item) => item.key === key)?.visible ?? true
  }

  function resetColumnConfigToDefaults(): void {
    columnConfig.value = props.columns.map((col, idx) => ({
      key: col.key,
      visible: col.defaultVisible !== false,
      order: idx,
    }))
    persistColumnConfig()
  }

  const expose: DataTableExpose = {
    clearSelection: () => emit('update:checkedRowKeys', []),
    clearSort: () => {
      currentSort.value = undefined
      emit('update:sort', { columnKey: '', order: false })
    },
    scrollTo: (options) => {
      tableRef.value?.scrollTo(options)
    },
    getColumnConfig: () => [...columnConfig.value],
    setColumnConfig: (config) => {
      columnConfig.value = config
      persistColumnConfig()
    },
    resetColumnConfig: resetColumnConfigToDefaults,
  }

  defineExpose(expose)
</script>

<template>
  <div class="r-data-table" role="region" aria-label="data table" :aria-busy="loading">
    <div v-if="$slots.toolbar || columnConfigurable" class="r-data-table__toolbar">
      <div class="r-data-table__toolbar-left">
        <slot name="toolbar" />
      </div>
      <button
        v-if="columnConfigurable"
        class="r-data-table__config-btn"
        aria-label="Configure columns"
        title="Configure columns"
        @click="showColumnConfig = !showColumnConfig"
      >
        ⚙
      </button>
    </div>

    <div
      v-if="showColumnConfig && columnConfigurable"
      class="r-data-table__config-panel"
      role="dialog"
      aria-label="Column configuration"
    >
      <div class="r-data-table__config-header">
        <span>Column Settings</span>
        <button class="r-data-table__config-reset" @click="resetColumnConfigToDefaults">
          Reset
        </button>
      </div>
      <label
        v-for="col in columns"
        :key="col.key"
        class="r-data-table__config-item"
        :class="{ disabled: col.configurable === false }"
      >
        <input
          type="checkbox"
          :checked="isColumnVisible(col.key)"
          :disabled="col.configurable === false"
          @change="toggleColumnVisibility(col.key)"
        />
        {{ col.title }}
      </label>
    </div>

    <div v-if="showBatchToolbar" class="r-data-table__batch-toolbar" data-testid="batch-toolbar">
      <slot name="batchToolbar" :selected-count="selectedCount" :selected-keys="checkedRowKeys">
        <RBatchActionBar
          :selected-count="selectedCount"
          :selected-keys="checkedRowKeys"
          :actions="builtInBatchActions"
          count-template="{count} item(s) selected"
          @clear="emit('update:checkedRowKeys', [])"
          @action="handleBatchAction"
        />
      </slot>
    </div>

    <NDataTable
      ref="tableRef"
      :columns="naiveColumns"
      :data="data"
      :loading="loading"
      :bordered="bordered"
      :striped="striped"
      :single-line="singleLine"
      :size="size"
      :max-height="maxHeight"
      :scroll-x="scrollX"
      :row-key="rowKeyFn"
      :checked-row-keys="selectable ? checkedRowKeys : undefined"
      :remote="isRemote"
      :pagination="naivePagination"
      :row-props="handleRowProps"
      @update:sorter="handleSorterChange"
      @update:checked-row-keys="handleCheckedRowKeysChange"
    >
      <template #empty>
        <slot name="empty">
          <NEmpty :description="emptyText" />
        </slot>
      </template>
      <template #loading>
        <slot name="loading">
          <NSpin :size="24" />
        </slot>
      </template>
    </NDataTable>
    <slot name="summary" />
  </div>
</template>

<style scoped>
  .r-data-table__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--ra-spacing-2, 8px);
    gap: var(--ra-spacing-2, 8px);
  }
  .r-data-table__toolbar-left,
  .r-data-table__toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-2, 8px);
  }
  .r-data-table__config-btn {
    padding: 4px 8px;
    border: 1px solid var(--ra-color-border-default, #e0e0e0);
    border-radius: var(--ra-radius-sm, 4px);
    background: var(--ra-color-bg-surface, #fff);
    cursor: pointer;
    font-size: 14px;
    color: var(--ra-color-text-secondary, #666);
    transition: all 0.15s;
  }
  .r-data-table__config-btn:hover {
    border-color: var(--ra-color-brand-primary, #2080f0);
    color: var(--ra-color-brand-primary, #2080f0);
  }
  .r-data-table__config-btn:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring, #2080f0);
    outline-offset: 2px;
  }
  .r-data-table__config-panel {
    border: 1px solid var(--ra-color-border-default, #e0e0e0);
    border-radius: var(--ra-radius-sm, 4px);
    background: var(--ra-color-bg-surface, #fff);
    padding: var(--ra-spacing-3, 12px);
    margin-bottom: var(--ra-spacing-2, 8px);
  }
  .r-data-table__config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--ra-spacing-2, 8px);
    font-weight: 600;
    font-size: var(--ra-font-size-sm, 13px);
    color: var(--ra-color-text-primary, #333);
  }
  .r-data-table__config-reset {
    padding: 2px 8px;
    border: 1px solid var(--ra-color-border-default, #e0e0e0);
    border-radius: var(--ra-radius-sm, 4px);
    background: none;
    cursor: pointer;
    font-size: var(--ra-font-size-xs, 12px);
    color: var(--ra-color-text-secondary, #666);
  }
  .r-data-table__config-reset:hover {
    color: var(--ra-color-brand-primary, #2080f0);
  }
  .r-data-table__config-item {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-2, 8px);
    padding: var(--ra-spacing-1, 4px) 0;
    font-size: var(--ra-font-size-sm, 13px);
    color: var(--ra-color-text-primary, #333);
    cursor: pointer;
  }
  .r-data-table__config-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .r-data-table__batch-toolbar {
    margin-bottom: var(--ra-spacing-2, 8px);
  }
  .r-data-table__batch-info {
    font-size: var(--ra-font-size-sm, 13px);
    color: var(--ra-color-brand-primary, #2080f0);
    font-weight: 500;
  }
</style>

<script lang="ts" setup generic="T extends Record<string, unknown> = Record<string, unknown>">
  import { computed, ref, watch, type PropType, useSlots } from 'vue'
  import { NButton, NDataTable, NEmpty, NPopover, NSpin, type DataTableColumns } from 'naive-ui'
  import RBatchActionBar from '../batch-action-bar/RBatchActionBar.vue'
  import RIcon from '../icon/RIcon.vue'
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
    DataTableDensity,
    DataTableOverflowPolicy,
    DataTableSlots,
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
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: undefined },
    density: {
      type: String as PropType<DataTableDensity>,
      default: 'default',
    },
    refreshable: { type: Boolean, default: false },
    densitySwitchable: { type: Boolean, default: false },
    maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
    scrollX: { type: [Number, String] as PropType<number | string>, default: undefined },
    overflowPolicy: {
      type: String as PropType<DataTableOverflowPolicy>,
      default: 'visible',
    },
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
    refresh: []
    'update:density': [density: DataTableDensity]
    rowClick: [row: any, index: number]
    export: [payload: DataTableExportPayload<T>]
    batchDelete: [payload: DataTableBatchPayload<T>]
    batchAction: [key: string, selectedKeys: DataTableRowKey[], selectedRows: T[]]
  }>()

  defineSlots<DataTableSlots<T>>()

  const tableRef = ref<InstanceType<typeof NDataTable> | null>(null)
  const showColumnConfig = ref(false)
  const slots = useSlots() as DataTableSlots<T>

  const columnConfig = ref<ColumnConfigItem[]>([])
  const activeFilters = ref<DataTableFilterState[]>([])
  const currentSort = ref<DataTableSortState | undefined>(props.defaultSort)
  const densityOptions: { value: DataTableDensity; label: string; icon: string }[] = [
    { value: 'operations', label: '运维', icon: 'sliders' },
    { value: 'compact', label: '紧凑', icon: 'minimize-2' },
    { value: 'default', label: '默认', icon: 'menu' },
    { value: 'comfortable', label: '宽松', icon: 'maximize-2' },
  ]

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

  const computedSize = computed<'small' | 'medium' | 'large'>(() => {
    if (props.size) return props.size
    if (props.density === 'compact' || props.density === 'operations') return 'small'
    if (props.density === 'comfortable') return 'large'
    return 'medium'
  })

  const effectiveOverflowPolicy = computed<DataTableOverflowPolicy>(() => {
    if (props.density === 'operations' && props.overflowPolicy === 'visible') return 'auto'
    return props.overflowPolicy
  })

  const hasFixedColumn = computed(() => effectiveColumns.value.some((col) => Boolean(col.fixed)))

  const estimatedScrollX = computed(() => {
    const selectionWidth = props.selectable ? 48 : 0
    const columnsWidth = effectiveColumns.value.reduce((total, col) => {
      if (typeof col.width === 'number') return total + col.width
      if (typeof col.width === 'string') {
        const numeric = Number.parseInt(col.width, 10)
        if (Number.isFinite(numeric)) return total + numeric
      }
      return total + (col.minWidth ?? 120)
    }, selectionWidth)
    return Math.max(columnsWidth, 960)
  })

  const computedScrollX = computed<number | string | undefined>(() => {
    if (props.scrollX !== undefined) return props.scrollX
    if (effectiveOverflowPolicy.value === 'horizontal') return estimatedScrollX.value
    if (effectiveOverflowPolicy.value !== 'auto') return undefined
    if (
      hasFixedColumn.value ||
      effectiveColumns.value.length >= 7 ||
      estimatedScrollX.value > 960
    ) {
      return estimatedScrollX.value
    }
    return undefined
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
  const hasTableToolbar = computed(() =>
    Boolean(
      props.refreshable || props.densitySwitchable || props.columnConfigurable || !!slots.toolbar,
    ),
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

  function handleRefresh(): void {
    emit('refresh')
  }

  function handleDensityChange(density: DataTableDensity): void {
    emit('update:density', density)
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
void [NButton, NEmpty, NPopover, NSpin, RBatchActionBar, RIcon, builtInBatchActions, computedScrollX, computedSize, densityOptions, handleBatchAction, handleCheckedRowKeysChange, handleDensityChange, handleRefresh, handleRowProps, handleSorterChange, hasTableToolbar, isColumnVisible, isRemote, naiveColumns, naivePagination, showBatchToolbar, showColumnConfig, toggleColumnVisibility]
</script>

<template src="./RDataTable.template.html"></template>

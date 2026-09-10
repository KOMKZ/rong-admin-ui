<template src="./RDataGrid.template.html"></template>

<script lang="ts" setup>
import './RDataGrid.css'
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { AgGridVue } from 'ag-grid-vue3'
  import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
  import type { ColDef, GridOptions, GridApi } from 'ag-grid-community'
  import 'ag-grid-community/styles/ag-grid.css'
  import 'ag-grid-community/styles/ag-theme-alpine.css'
  import type {
    RDataGridProps,
    RDataGridEmits,
    DataGridLocale,
    DataGridColumn,
    DataGridColumnType,
    RDataGridExpose,
  } from './types'
  import { DEFAULT_LOCALE } from './types'
  import { useColumnTypes } from './composables/useColumnTypes'
  import ColumnEditDrawer from './components/ColumnEditDrawer.vue'
  import FilterDrawer from './components/FilterDrawer.vue'
  import type { FilterCondition } from './components/FilterDrawer.vue'
  import type { ColumnEditForm } from './components/ColumnEditDrawer.vue'

  ModuleRegistry.registerModules([AllCommunityModule])

  const props = withDefaults(defineProps<RDataGridProps>(), {
    height: '600px',
    readonly: false,
    hideToolbar: false,
    allowAddColumn: true,
    allowAddRow: true,
    allowDelete: true,
    allowExport: true,
    allowColumnDrag: true,
    allowRowDrag: true,
  })

  const emit = defineEmits<RDataGridEmits>()

  const { toAgColDef, getDefaultValue } = useColumnTypes()

  const mergedLocale = computed<Required<DataGridLocale>>(
    () =>
      ({
        ...DEFAULT_LOCALE,
        ...props.locale,
      }) as Required<DataGridLocale>,
  )

  const gridApi = ref<GridApi | null>(null)
  const searchText = ref('')
  const localRows = ref<Record<string, unknown>[]>([...props.rows])
  const localColumns = ref<DataGridColumn[]>([...props.columns])

  const columnEditVisible = ref(false)
  const editingColumnDef = ref<ColDef | undefined>(undefined)
  const editingField = ref<string | undefined>(undefined)

  const filterVisible = ref(false)
  const filterConditions = ref<FilterCondition[]>([])

  const columnMenuOpen = ref(false)
  const columnMenuRef = ref<HTMLElement | null>(null)
  const columnMenuStyle = ref<Record<string, string>>({})

  const columnSelectVisible = ref(false)
  const columnSelectAction = ref<'insert-before' | 'insert-after' | 'edit' | 'delete'>('edit')
  const columnSelectTitle = ref('')

  const batchAddVisible = ref(false)
  const batchAddNames = ref('')
  const batchAddType = ref('text')

  const agColumnDefs = computed<ColDef[]>(() =>
    localColumns.value.map((col) => {
      const def = toAgColDef(col, props.readonly, !props.readonly)
      return def
    }),
  )

  const currentAgColDefs = computed<ColDef[]>(() => agColumnDefs.value)

  const defaultColDef = reactive<ColDef>({
    sortable: true,
    filter: true,
    resizable: true,
    editable: !props.readonly,
    flex: 1,
    minWidth: 100,
  })

  const gridOptions = reactive<GridOptions>({
    theme: 'legacy' as unknown as undefined,
    rowDragManaged: !props.readonly && props.allowRowDrag,
    animateRows: true,
    suppressMovableColumns: props.readonly || !props.allowColumnDrag,
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      enableClickSelection: false,
    },
    singleClickEdit: false,
    stopEditingWhenCellsLoseFocus: true,
    enableCellTextSelection: true,
    getRowId: (params) => String(params.data.id),
    context: {
      editColumn: (field: string) => openColumnEdit(field),
      deleteColumn: (field: string) => handleDeleteColumn(field),
    },
    localeText: {
      noRowsToShow: mergedLocale.value.noRowsToShow,
      loadingOoo: mergedLocale.value.loading,
      page: '页',
      more: '更多',
      to: '至',
      of: '共',
      next: '下一页',
      last: '最后一页',
      first: '第一页',
      previous: '上一页',
    },
  })

  const normalizedHeight = computed(() =>
    typeof props.height === 'number' ? `${props.height}px` : props.height,
  )

  const isFillMode = computed(() => normalizedHeight.value === '100%')

  const rootStyle = computed(() => {
    if (isFillMode.value) return { height: '100%' }
    return {}
  })

  const containerStyle = computed(() => {
    if (isFillMode.value) return { flex: '1', minHeight: '0' }
    return { height: normalizedHeight.value }
  })

  function onGridReady(params: { api: GridApi }) {
    gridApi.value = params.api
    if (localRows.value.length > 0) {
      gridApi.value.setGridOption('rowData', localRows.value)
    }
    setTimeout(() => params.api.sizeColumnsToFit(), 100)
  }

  function getAllRows(): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = []
    gridApi.value?.forEachNode((node) => rows.push(node.data))
    return rows
  }

  function onCellValueChanged(event: { colDef: ColDef; newValue: unknown; rowIndex: number }) {
    emit('cellChange', {
      rowIndex: event.rowIndex,
      field: event.colDef.field ?? '',
      value: event.newValue,
    })
    emit('update:rows', getAllRows())
  }

  function onRowDragEnd() {
    emit('update:rows', getAllRows())
  }

  function handleAddRow() {
    if (!props.allowAddRow) return
    const maxId = localRows.value.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0)
    const newRow: Record<string, unknown> = { id: maxId + 1 }
    for (const col of localColumns.value) {
      if (col.field !== 'id') {
        newRow[col.field] = getDefaultValue(col.type)
      }
    }
    const res = gridApi.value?.applyTransaction({ add: [newRow], addIndex: 0 })
    if (res) {
      localRows.value = [newRow, ...localRows.value]
      emit('rowAdd', newRow)
      emit('update:rows', getAllRows())
    }
  }

  function addColumnAt(index?: number) {
    if (!props.allowAddColumn) return
    const idx = localColumns.value.length
    const field = `col_${Date.now()}`
    const newCol: DataGridColumn = {
      field,
      headerName: `新列 ${idx}`,
      type: 'text',
    }
    if (index !== undefined && index >= 0) {
      localColumns.value = [
        ...localColumns.value.slice(0, index),
        newCol,
        ...localColumns.value.slice(index),
      ]
    } else {
      localColumns.value = [...localColumns.value, newCol]
    }
    for (const row of localRows.value) {
      row[field] = ''
    }
    refreshGrid()
    emit('columnAdd', newCol)
    emit('update:columns', localColumns.value)
  }

  function handleAddColumn() {
    addColumnAt()
  }

  function handleBatchAddColumns() {
    batchAddNames.value = ''
    batchAddType.value = 'text'
    batchAddVisible.value = true
  }

  function confirmBatchAdd() {
    const names = batchAddNames.value
      .split(/[\n,，;；]/)
      .map((n) => n.trim())
      .filter(Boolean)
    if (names.length === 0) return

    const newCols: DataGridColumn[] = names.map((name) => ({
      field: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      headerName: name,
      type: batchAddType.value as DataGridColumnType,
    }))

    localColumns.value = [...localColumns.value, ...newCols]
    for (const row of localRows.value) {
      for (const col of newCols) {
        row[col.field] = getDefaultValue(col.type)
      }
    }
    refreshGrid()
    for (const col of newCols) {
      emit('columnAdd', col)
    }
    emit('update:columns', localColumns.value)
    batchAddVisible.value = false
  }

  function selectColumnAndInsert(position: 'before' | 'after') {
    const nonIdCols = localColumns.value.filter((c) => c.field !== 'id')
    if (nonIdCols.length === 0) {
      addColumnAt()
      return
    }
    columnSelectAction.value = position === 'before' ? 'insert-before' : 'insert-after'
    columnSelectTitle.value = position === 'before' ? '在指定列前插入' : '在指定列后插入'
    columnSelectVisible.value = true
  }

  function selectColumnAndEdit() {
    const nonIdCols = localColumns.value.filter((c) => c.field !== 'id')
    if (nonIdCols.length === 0) return
    columnSelectAction.value = 'edit'
    columnSelectTitle.value = '选择要编辑的列'
    columnSelectVisible.value = true
  }

  function selectColumnAndDelete() {
    const nonIdCols = localColumns.value.filter((c) => c.field !== 'id')
    if (nonIdCols.length === 0) return
    columnSelectAction.value = 'delete'
    columnSelectTitle.value = '选择要删除的列'
    columnSelectVisible.value = true
  }

  function handleColumnSelect(field: string) {
    columnSelectVisible.value = false
    const idx = localColumns.value.findIndex((c) => c.field === field)
    if (idx < 0) return

    switch (columnSelectAction.value) {
      case 'insert-before':
        addColumnAt(idx)
        break
      case 'insert-after':
        addColumnAt(idx + 1)
        break
      case 'edit':
        openColumnEdit(field)
        break
      case 'delete':
        handleDeleteColumn(field)
        break
    }
  }

  function handleColumnMenuSelect(key: string) {
    columnMenuOpen.value = false
    switch (key) {
      case 'add':
        handleAddColumn()
        break
      case 'batch-add':
        handleBatchAddColumns()
        break
      case 'insert-before':
        selectColumnAndInsert('before')
        break
      case 'insert-after':
        selectColumnAndInsert('after')
        break
      case 'edit':
        selectColumnAndEdit()
        break
      case 'delete':
        selectColumnAndDelete()
        break
    }
  }

  function handleDeleteColumn(field: string) {
    if (field === 'id') return
    const idx = localColumns.value.findIndex((c) => c.field === field)
    if (idx < 0) return
    const removed = localColumns.value[idx]
    localColumns.value = localColumns.value.filter((c) => c.field !== field)
    for (const row of localRows.value) {
      delete row[field]
    }
    refreshGrid()
    emit('columnDelete', removed)
    emit('update:columns', localColumns.value)
  }

  function openColumnEdit(field: string) {
    const colDef = agColumnDefs.value.find((c) => c.field === field)
    editingColumnDef.value = colDef
    editingField.value = field
    columnEditVisible.value = true
  }

  function refreshGrid() {
    nextTick(() => {
      gridApi.value?.setGridOption('columnDefs', agColumnDefs.value)
      gridApi.value?.setGridOption('rowData', localRows.value)
      setTimeout(() => gridApi.value?.sizeColumnsToFit(), 50)
    })
  }

  function handleColumnEditSave(form: ColumnEditForm) {
    const idx = localColumns.value.findIndex((c) => c.field === form.field)
    if (idx < 0) return
    const updated: DataGridColumn = {
      ...localColumns.value[idx],
      headerName: form.headerName,
      type: form.type as DataGridColumnType,
      options:
        form.type === 'select' || form.type === 'multiselect'
          ? form.options
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    }
    localColumns.value = localColumns.value.map((c, i) => (i === idx ? updated : c))
    gridApi.value?.setGridOption('columnDefs', agColumnDefs.value)
    emit('update:columns', localColumns.value)
  }

  function handleDeleteSelectedRows() {
    if (!props.allowDelete) return
    const selected = gridApi.value?.getSelectedRows()
    if (!selected?.length) return
    const res = gridApi.value?.applyTransaction({ remove: selected })
    if (res) {
      const ids = new Set(selected.map((r: Record<string, unknown>) => r.id))
      localRows.value = localRows.value.filter((r) => !ids.has(r.id))
      emit('rowDelete', selected)
      emit('update:rows', getAllRows())
    }
  }

  function handleSearch() {
    gridApi.value?.setGridOption('quickFilterText', searchText.value)
  }

  function handleExport() {
    if (!props.allowExport) return
    gridApi.value?.exportDataAsCsv({
      fileName: `data_${Date.now()}.csv`,
      columnSeparator: ',',
    })
  }

  function applyFilters(conditions: FilterCondition[]) {
    if (!gridApi.value) return
    if (conditions.length === 0) {
      agColumnDefs.value.forEach((col) => {
        if (col.field) gridApi.value!.destroyFilter(col.field)
      })
      return
    }
    gridApi.value.setGridOption('isExternalFilterPresent', () => conditions.length > 0)
    gridApi.value.setGridOption('doesExternalFilterPass', (node: any) => {
      return conditions.every((c) => {
        if (!c.field || !c.operator) return true
        const val = node.data[c.field]
        const strVal = val != null ? String(val).toLowerCase() : ''
        const filterVal = c.value != null ? String(c.value).toLowerCase() : ''
        switch (c.operator) {
          case 'equals':
            return strVal === filterVal
          case 'notEqual':
            return strVal !== filterVal
          case 'contains':
            return strVal.includes(filterVal)
          case 'notContains':
            return !strVal.includes(filterVal)
          case 'startsWith':
            return strVal.startsWith(filterVal)
          case 'endsWith':
            return strVal.endsWith(filterVal)
          case 'greaterThan':
            return Number(val) > Number(c.value)
          case 'lessThan':
            return Number(val) < Number(c.value)
          case 'greaterThanOrEqual':
            return Number(val) >= Number(c.value)
          case 'lessThanOrEqual':
            return Number(val) <= Number(c.value)
          case 'blank':
            return val == null || val === ''
          case 'notBlank':
            return val != null && val !== ''
          default:
            return true
        }
      })
    })
    gridApi.value.onFilterChanged()
  }

  watch(
    () => props.rows,
    (newRows) => {
      localRows.value = [...newRows]
      gridApi.value?.setGridOption('rowData', localRows.value)
    },
    { deep: true },
  )

  watch(
    () => props.columns,
    (newCols) => {
      localColumns.value = [...newCols]
      gridApi.value?.setGridOption('columnDefs', agColumnDefs.value)
    },
    { deep: true },
  )

  watch(columnMenuOpen, (open) => {
    if (!open) return
    nextTick(() => {
      const btn = document.querySelector('.rdg-dropdown-wrap .rdg-btn--ghost')
      if (btn) {
        const rect = btn.getBoundingClientRect()
        columnMenuStyle.value = {
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          zIndex: '3000',
        }
      }
    })
  })

  defineExpose<RDataGridExpose>({
    getGridApi: () => gridApi.value,
    getAllRows,
    addRow: handleAddRow,
    addColumn: handleAddColumn,
    deleteSelectedRows: handleDeleteSelectedRows,
    exportCsv: handleExport,
    getTableData: () => ({
      columns: localColumns.value,
      rows: getAllRows(),
    }),
  })
void [AgGridVue, ColumnEditDrawer, FilterDrawer, applyFilters, columnMenuRef, confirmBatchAdd, containerStyle, currentAgColDefs, defaultColDef, filterConditions, filterVisible, gridOptions, handleColumnEditSave, handleColumnMenuSelect, handleColumnSelect, handleSearch, onCellValueChanged, onGridReady, onRowDragEnd, rootStyle]
</script>


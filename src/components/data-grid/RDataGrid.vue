<template>
  <div
    class="r-data-grid"
    :class="{ 'r-data-grid--readonly': readonly }"
    :style="rootStyle"
    data-testid="data-grid"
  >
    <!-- Toolbar -->
    <div v-if="!hideToolbar" class="rdg-toolbar">
      <div class="rdg-toolbar__left">
        <template v-if="!readonly">
          <button
            v-if="allowAddRow"
            class="rdg-btn rdg-btn--primary"
            :aria-label="mergedLocale.addRow"
            @click="handleAddRow"
          >
            <svg
              class="rdg-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {{ mergedLocale.addRow }}
          </button>
          <div v-if="allowAddColumn" class="rdg-dropdown-wrap">
            <button
              class="rdg-btn rdg-btn--ghost"
              :aria-label="mergedLocale.addColumn"
              @click="columnMenuOpen = !columnMenuOpen"
            >
              <svg
                class="rdg-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              列操作
              <svg class="rdg-icon rdg-icon--caret" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4z" />
              </svg>
            </button>
            <Teleport to="body">
              <div
                v-if="columnMenuOpen"
                class="rdg-dropdown-backdrop"
                @click="columnMenuOpen = false"
              />
              <div
                v-if="columnMenuOpen"
                ref="columnMenuRef"
                class="rdg-dropdown-menu"
                :style="columnMenuStyle"
              >
                <button class="rdg-dropdown-item" @click="handleColumnMenuSelect('add')">
                  <span class="rdg-dropdown-item__icon">+</span> 新增列（末尾）
                </button>
                <button class="rdg-dropdown-item" @click="handleColumnMenuSelect('batch-add')">
                  <span class="rdg-dropdown-item__icon">++</span> 批量新增列
                </button>
                <button class="rdg-dropdown-item" @click="handleColumnMenuSelect('insert-before')">
                  <span class="rdg-dropdown-item__icon">⬅</span> 在指定列前插入
                </button>
                <button class="rdg-dropdown-item" @click="handleColumnMenuSelect('insert-after')">
                  <span class="rdg-dropdown-item__icon">➡</span> 在指定列后插入
                </button>
                <div class="rdg-dropdown-divider" />
                <button class="rdg-dropdown-item" @click="handleColumnMenuSelect('edit')">
                  <span class="rdg-dropdown-item__icon">✏</span> 编辑列配置
                </button>
                <div class="rdg-dropdown-divider" />
                <button
                  class="rdg-dropdown-item rdg-dropdown-item--danger"
                  @click="handleColumnMenuSelect('delete')"
                >
                  <span class="rdg-dropdown-item__icon">🗑</span> 删除指定列
                </button>
              </div>
            </Teleport>
          </div>
          <button
            v-if="allowDelete"
            class="rdg-btn rdg-btn--ghost"
            :aria-label="mergedLocale.deleteRow"
            @click="handleDeleteSelectedRows"
          >
            <svg
              class="rdg-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {{ mergedLocale.deleteRow }}
          </button>
        </template>
        <slot name="toolbar-left" />
      </div>
      <div class="rdg-toolbar__right">
        <div class="rdg-search-wrap">
          <svg
            class="rdg-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchText"
            class="rdg-search"
            type="text"
            :placeholder="mergedLocale.search"
            aria-label="搜索"
            @input="handleSearch"
          />
        </div>
        <button
          class="rdg-btn rdg-btn--ghost"
          :class="{ 'rdg-btn--active': filterConditions.length > 0 }"
          :aria-label="mergedLocale.filter"
          @click="filterVisible = true"
        >
          <svg
            class="rdg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {{ mergedLocale.filter }}
          <span v-if="filterConditions.length > 0" class="rdg-badge">{{
            filterConditions.length
          }}</span>
        </button>
        <button
          v-if="allowExport"
          class="rdg-btn rdg-btn--ghost"
          :aria-label="mergedLocale.export"
          @click="handleExport"
        >
          <svg
            class="rdg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ mergedLocale.export }}
        </button>
        <slot name="toolbar-right" />
      </div>
    </div>

    <!-- Grid -->
    <div class="rdg-grid-container" :style="containerStyle">
      <ag-grid-vue
        class="ag-theme-alpine"
        :column-defs="agColumnDefs"
        :row-data="localRows"
        :default-col-def="defaultColDef"
        :grid-options="gridOptions"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
        @row-drag-end="onRowDragEnd"
      />
    </div>

    <!-- Drawers -->
    <ColumnEditDrawer
      :visible="columnEditVisible"
      :column="editingColumnDef"
      :field="editingField"
      @update:visible="columnEditVisible = $event"
      @save="handleColumnEditSave"
    />
    <FilterDrawer
      :visible="filterVisible"
      :conditions="filterConditions"
      :columns="currentAgColDefs"
      @update:visible="filterVisible = $event"
      @update:conditions="filterConditions = $event"
      @apply="applyFilters"
    />

    <!-- Column Select Dialog -->
    <Teleport to="body">
      <Transition name="rdg-fade">
        <div
          v-if="columnSelectVisible"
          class="rdg-modal-overlay"
          @click.self="columnSelectVisible = false"
        >
          <div class="rdg-modal" style="max-width: 360px">
            <div class="rdg-modal__header">
              <span class="rdg-modal__title">{{ columnSelectTitle }}</span>
              <button class="rdg-modal__close" @click="columnSelectVisible = false">&times;</button>
            </div>
            <div class="rdg-modal__body">
              <button
                v-for="col in localColumns.filter((c) => c.field !== 'id')"
                :key="col.field"
                class="rdg-column-select-item"
                @click="handleColumnSelect(col.field)"
              >
                {{ col.headerName || col.field }}
              </button>
              <div
                v-if="localColumns.filter((c) => c.field !== 'id').length === 0"
                class="rdg-empty-text"
              >
                暂无可操作的列
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Batch Add Dialog -->
    <Teleport to="body">
      <Transition name="rdg-fade">
        <div v-if="batchAddVisible" class="rdg-modal-overlay" @click.self="batchAddVisible = false">
          <div class="rdg-modal" style="max-width: 420px">
            <div class="rdg-modal__header">
              <span class="rdg-modal__title">批量新增列</span>
              <button class="rdg-modal__close" @click="batchAddVisible = false">&times;</button>
            </div>
            <div class="rdg-modal__body">
              <label class="rdg-form-item">
                <span class="rdg-form-label">列名列表（每行一个）</span>
                <textarea
                  v-model="batchAddNames"
                  class="rdg-textarea"
                  rows="6"
                  placeholder="姓名&#10;年龄&#10;地址"
                />
              </label>
              <label class="rdg-form-item">
                <span class="rdg-form-label">默认类型</span>
                <select v-model="batchAddType" class="rdg-select">
                  <option value="text">文本</option>
                  <option value="number">数字</option>
                  <option value="date">日期</option>
                  <option value="select">单选</option>
                  <option value="multiselect">多选</option>
                </select>
              </label>
            </div>
            <div class="rdg-modal__footer">
              <button class="rdg-btn" @click="batchAddVisible = false">取消</button>
              <button class="rdg-btn rdg-btn--primary" @click="confirmBatchAdd">确定</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
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

defineExpose({
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
</script>

<style>
.r-data-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-lg, 8px);
  overflow: hidden;
  background: var(--ra-color-bg, #fff);
}

/* Toolbar */
.rdg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-bg-soft, #f9fafb);
  flex-wrap: wrap;
}

.rdg-toolbar__left,
.rdg-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Buttons */
.rdg-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: var(--ra-radius-md, 6px);
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
  background: var(--ra-color-bg, #fff);
  color: var(--ra-color-text, #374151);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.rdg-btn:hover {
  border-color: var(--ra-color-primary, #6366f1);
  color: var(--ra-color-primary, #6366f1);
}

.rdg-btn--primary {
  background: var(--ra-color-primary, #6366f1);
  border-color: var(--ra-color-primary, #6366f1);
  color: #fff;
}

.rdg-btn--primary:hover {
  opacity: 0.9;
  color: #fff;
}

.rdg-btn--ghost {
  background: transparent;
  border-color: transparent;
}

.rdg-btn--ghost:hover {
  background: var(--ra-color-bg-hover, #f3f4f6);
  border-color: transparent;
}

.rdg-btn--active {
  color: var(--ra-color-primary, #6366f1);
}

/* Badge */
.rdg-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  background: var(--ra-color-primary, #6366f1);
  color: #fff;
}

/* Icon */
.rdg-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Search */
.rdg-search-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.rdg-search-icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--ra-color-text-muted, #9ca3af);
  pointer-events: none;
}

.rdg-search {
  padding: 6px 12px 6px 30px;
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: 20px;
  font-size: 13px;
  outline: none;
  width: 200px;
  background: var(--ra-color-bg, #fff);
  color: var(--ra-color-text, #374151);
  transition: border-color 0.15s ease;
}

.rdg-search:focus {
  border-color: var(--ra-color-primary, #6366f1);
  box-shadow: 0 0 0 2px var(--ra-color-primary-alpha, rgba(99, 102, 241, 0.15));
}

/* Grid container */
.rdg-grid-container {
  width: 100%;
  min-height: 200px;
  position: relative;
}

.rdg-grid-container .ag-theme-alpine {
  width: 100%;
  height: 100%;
}

/* Dropdown Menu */
.rdg-dropdown-wrap {
  position: relative;
  display: inline-flex;
}

.rdg-icon--caret {
  width: 12px;
  height: 12px;
  margin-left: 2px;
}

.rdg-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2999;
}

.rdg-dropdown-menu {
  background: var(--ra-color-bg, #fff);
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 200px;
  z-index: 3000;
}

.rdg-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--ra-color-text, #374151);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.rdg-dropdown-item:hover {
  background: var(--ra-color-bg-hover, #f3f4f6);
}

.rdg-dropdown-item--danger {
  color: var(--ra-color-danger, #cf222e);
}

.rdg-dropdown-item__icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
}

.rdg-dropdown-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--ra-color-border, #e5e7eb);
}

/* Modal */
.rdg-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rdg-modal {
  background: var(--ra-color-bg, #fff);
  border-radius: var(--ra-radius-lg, 8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.rdg-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
}

.rdg-modal__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ra-color-text, #374151);
}

.rdg-modal__close {
  border: none;
  background: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--ra-color-text-muted, #9ca3af);
  line-height: 1;
  padding: 0 4px;
}

.rdg-modal__close:hover {
  color: var(--ra-color-text, #374151);
}

.rdg-modal__body {
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rdg-modal__footer {
  padding: 12px 20px;
  border-top: 1px solid var(--ra-color-border, #e5e7eb);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.rdg-column-select-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-bg, #fff);
  font-size: 14px;
  color: var(--ra-color-text, #374151);
  cursor: pointer;
  transition: all 0.12s;
}

.rdg-column-select-item:hover {
  border-color: var(--ra-color-primary, #6366f1);
  background: var(--ra-color-bg-hover, #f3f4f6);
}

.rdg-empty-text {
  color: var(--ra-color-text-muted, #9ca3af);
  font-size: 13px;
  padding: 12px;
  text-align: center;
}

.rdg-form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rdg-form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ra-color-text-muted, #6b7280);
}

.rdg-select,
.rdg-textarea {
  padding: 6px 10px;
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: var(--ra-radius-md, 6px);
  font-size: 14px;
  outline: none;
  background: var(--ra-color-bg, #fff);
  color: var(--ra-color-text, #374151);
  transition: border-color 0.15s;
}

.rdg-select:focus,
.rdg-textarea:focus {
  border-color: var(--ra-color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.rdg-textarea {
  resize: vertical;
  min-height: 60px;
  font-family: monospace;
}

.rdg-fade-enter-active,
.rdg-fade-leave-active {
  transition: opacity 0.15s;
}
.rdg-fade-enter-from,
.rdg-fade-leave-to {
  opacity: 0;
}
</style>

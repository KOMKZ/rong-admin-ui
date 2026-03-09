<script lang="ts" setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'
import { Pencil, Trash2, X, Save } from 'lucide-vue-next'
import { defineAsyncComponent, type Component } from 'vue'
import { defaultGridTableData } from '../extensions/grid'

let _dataGridComponent: Component | null = null
function getDataGridComponent(): Component | null {
  if (!_dataGridComponent) {
    try {
      _dataGridComponent = defineAsyncComponent(() => import('../../data-grid/RDataGrid.vue'))
    } catch {
      _dataGridComponent = null
    }
  }
  return _dataGridComponent
}

type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'year'
  | 'select'
  | 'multiselect'
  | 'boolean'

interface GridTableStructure {
  field: string
  headerName?: string
  width?: number
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
  type?: ColumnType
  options?: any[]
}

interface GridTableData {
  structure: GridTableStructure[]
  data: any[]
  columnOrder?: string[]
  meta?: Record<string, any>
}

function safeClone<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    /* ignore */
  }
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

const props = defineProps(nodeViewProps)
const isEditable = computed(() => props.editor?.isEditable ?? true)

const drawerVisible = ref(false)
const title = ref(props.node.attrs.title || '数据表格')
const tableData = ref<GridTableData>(safeClone(defaultGridTableData as unknown as GridTableData))
const saving = ref(false)

const tableRef = ref<any>(null)

function parseTableData(value?: string | null): GridTableData {
  if (!value) return safeClone(defaultGridTableData as unknown as GridTableData)
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        structure: Array.isArray(parsed.structure) ? parsed.structure : [],
        data: Array.isArray(parsed.data) ? parsed.data : [],
        columnOrder: Array.isArray(parsed.columnOrder) ? parsed.columnOrder : [],
        meta: typeof parsed.meta === 'object' && parsed.meta !== null ? parsed.meta : {},
      }
    }
  } catch {
    /* ignore */
  }
  return safeClone(defaultGridTableData as unknown as GridTableData)
}

function normalizeOptions(options?: any[]) {
  if (!Array.isArray(options)) return []
  return options
    .map((o) => {
      if (typeof o === 'string') return { label: o, value: o }
      if (typeof o === 'object' && o !== null) {
        const v = o.value ?? o.label ?? ''
        return { label: String(o.label ?? v), value: String(v) }
      }
      return { label: String(o), value: String(o) }
    })
    .filter((o) => o.value !== '')
}

function loadTableData() {
  tableData.value = parseTableData(props.node.attrs.tableData)
}

function persistTableData() {
  props.updateAttributes({ title: title.value, tableData: JSON.stringify(tableData.value) })
}

function handleSaveTable() {
  if (!tableRef.value?.getTableData) return
  saving.value = true
  try {
    const snapshot = tableRef.value.getTableData()
    if (!snapshot) return
    tableData.value = {
      structure: (snapshot.columns || []).map((c: any) => ({
        field: c.field,
        headerName: c.headerName || c.field,
        width: c.width,
        editable: c.editable !== false,
        sortable: c.sortable !== false,
        filterable: c.filterable !== false,
        type: c.type || 'text',
        options: c.options,
      })),
      data: snapshot.rows || [],
      columnOrder: (snapshot.columns || []).map((c: any) => c.field),
      meta: { totalRows: snapshot.rows?.length || 0, totalColumns: snapshot.columns?.length || 0 },
    }
    persistTableData()
    drawerVisible.value = false
  } finally {
    saving.value = false
  }
}

const displayColumns = computed(() => tableData.value.structure || [])
const displayRows = computed(() => tableData.value.data || [])
const hasColumns = computed(() => displayColumns.value.length > 0)
const metaText = computed(
  () => `${displayRows.value.length} 行 · ${displayColumns.value.length} 列`,
)

function getSelectLabel(value: any, col: GridTableStructure) {
  if (value == null || value === '') return ''
  const opts = normalizeOptions(col.options)
  if (!opts.length) return String(value)
  const m = opts.find((o) => o.value === value || o.label === value)
  return m ? m.label : String(value)
}

function getMultiSelectTags(value: any, col: GridTableStructure): string[] {
  const vals = Array.isArray(value)
    ? value.map(String)
    : typeof value === 'string' && value
      ? value
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
  if (!vals.length) return []
  const opts = normalizeOptions(col.options)
  if (!opts.length) return vals
  return vals.map((v) => {
    const m = opts.find((o) => o.value === v || o.label === v)
    return m ? m.label : v
  })
}

function formatCell(value: any) {
  if (value == null || value === '') return '-'
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const editorColumns = computed(() =>
  displayColumns.value.map((c) => ({
    field: c.field,
    headerName: c.headerName || c.field,
    type: c.type || 'text',
    width: c.width,
    editable: c.editable !== false,
    sortable: c.sortable !== false,
    filterable: c.filterable !== false,
    options: c.options?.map((o: any) =>
      typeof o === 'string' ? o : o.label || o.value || String(o),
    ),
  })),
)

watch(
  () => props.node.attrs.tableData,
  () => loadTableData(),
)
watch(
  () => props.node.attrs.title,
  (v) => {
    if (v !== undefined) title.value = v
  },
)
watch(
  isEditable,
  (v) => {
    if (!v) drawerVisible.value = false
  },
  { immediate: true },
)

loadTableData()
</script>

<template>
  <NodeViewWrapper class="rte-grid-node">
    <div class="rte-grid-card">
      <div class="rte-grid-card__header">
        <div class="rte-grid-card__title-section">
          <input
            v-if="isEditable"
            v-model="title"
            class="rte-grid-card__title-input"
            placeholder="输入表格标题"
            @blur="persistTableData"
          />
          <div v-else class="rte-grid-card__title-text">{{ title }}</div>
          <div class="rte-grid-card__meta">{{ metaText }}</div>
        </div>
        <div v-if="isEditable" class="rte-grid-card__actions">
          <button class="rte-grid-card__btn" @click="drawerVisible = true">
            <Pencil :size="14" />
            <span>编辑表格</span>
          </button>
          <button class="rte-grid-card__btn rte-grid-card__btn--danger" @click="deleteNode">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <div v-if="!hasColumns" class="rte-grid-empty">
        <p>尚未配置表格</p>
        <button v-if="isEditable" class="rte-grid-card__btn" @click="drawerVisible = true">
          立即配置
        </button>
      </div>

      <div v-else class="rte-grid-table-wrap">
        <table class="rte-grid-preview-table">
          <thead>
            <tr>
              <th
                v-for="col in displayColumns"
                :key="col.field"
                :style="{ minWidth: (col.width || 120) + 'px' }"
              >
                {{ col.headerName || col.field }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in displayRows" :key="ri">
              <td v-for="col in displayColumns" :key="col.field">
                <template v-if="col.type === 'multiselect'">
                  <span
                    v-for="(tag, ti) in getMultiSelectTags(row[col.field], col)"
                    :key="ti"
                    class="rte-grid-tag"
                    >{{ tag }}</span
                  >
                </template>
                <template v-else-if="col.type === 'select'">
                  <span v-if="getSelectLabel(row[col.field], col)" class="rte-grid-tag">{{
                    getSelectLabel(row[col.field], col)
                  }}</span>
                  <span v-else>-</span>
                </template>
                <template v-else>{{ formatCell(row[col.field]) }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rte-grid-card__footer">双击编辑，可在正文中移动或复制</div>
    </div>

    <Teleport to="body">
      <Transition name="rte-drawer">
        <div
          v-if="drawerVisible && isEditable"
          class="rte-grid-drawer-backdrop"
          @click.self="drawerVisible = false"
        >
          <div class="rte-grid-drawer">
            <div class="rte-grid-drawer__header">
              <div class="rte-grid-drawer__title">
                表格编辑器
                <span class="rte-grid-drawer__badge">{{ displayRows.length }} 行</span>
              </div>
              <div class="rte-grid-drawer__header-actions">
                <button
                  class="rte-grid-drawer__btn rte-grid-drawer__btn--primary"
                  :disabled="saving"
                  @click="handleSaveTable"
                >
                  <Save :size="14" />
                  <span>保存</span>
                </button>
                <button class="rte-grid-drawer__btn" @click="drawerVisible = false">
                  <X :size="14" />
                </button>
              </div>
            </div>
            <div class="rte-grid-drawer__body">
              <component
                :is="getDataGridComponent()"
                v-if="getDataGridComponent()"
                ref="tableRef"
                :columns="editorColumns"
                :rows="displayRows"
                height="100%"
              />
              <div v-else class="rte-grid-drawer__fallback">RDataGrid 组件未找到</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </NodeViewWrapper>
</template>

<style>
.rte-grid-node {
  width: 100%;
  user-select: text;
}

.rte-grid-card {
  border: 1px solid var(--ra-color-border-default, rgba(148, 163, 184, 0.4));
  border-radius: var(--ra-radius-lg, 12px);
  padding: 12px;
  background: var(--ra-color-bg-surface, #fff);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  margin: 16px 0;
}

.rte-grid-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.rte-grid-card__title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rte-grid-card__title-input {
  font-size: 15px;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: var(--ra-radius-sm, 4px);
  padding: 2px 6px;
  background: transparent;
  color: var(--ra-color-text-primary, #0f172a);
  outline: none;
  transition: border-color 0.15s;
}

.rte-grid-card__title-input:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rte-grid-card__title-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--ra-color-text-primary, #0f172a);
}

.rte-grid-card__meta {
  font-size: 12px;
  color: var(--ra-color-text-quaternary, #94a3b8);
}

.rte-grid-card__actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.rte-grid-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 4px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.15s ease;
}

.rte-grid-card__btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.rte-grid-card__btn--danger {
  border: none;
}

.rte-grid-card__btn--danger:hover {
  color: var(--ra-color-danger, #cf222e);
}

.rte-grid-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--ra-color-text-quaternary, #94a3b8);
  font-size: 14px;
}

.rte-grid-table-wrap {
  margin-top: 8px;
  border-radius: var(--ra-radius-md, 8px);
  overflow-x: auto;
  background: var(--ra-color-bg-muted, #f8fafc);
}

.rte-grid-preview-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rte-grid-preview-table th {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ra-color-text-secondary, #475569);
  background: var(--ra-color-bg-muted, #f1f5f9);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--ra-color-border-light, #e2e8f0);
}

.rte-grid-preview-table td {
  padding: 8px 12px;
  color: var(--ra-color-text-primary, #0f172a);
  vertical-align: top;
  border-bottom: 1px solid var(--ra-color-border-light, #f1f5f9);
  white-space: normal;
  word-break: break-word;
}

.rte-grid-tag {
  display: inline-block;
  padding: 1px 8px;
  margin: 1px 2px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--ra-color-brand-subtle, #dbeafe);
  color: var(--ra-color-brand-primary, #0969da);
}

.rte-grid-card__footer {
  font-size: 12px;
  color: var(--ra-color-text-quaternary, #94a3b8);
  margin-top: 8px;
}

/* Drawer */
.rte-grid-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
}

.rte-grid-drawer {
  width: min(80vw, 1200px);
  height: 100%;
  background: var(--ra-color-bg-surface, #fff);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
}

.rte-grid-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
}

.rte-grid-drawer__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.rte-grid-drawer__badge {
  font-size: 12px;
  font-weight: 400;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ra-color-brand-subtle, #dbeafe);
  color: var(--ra-color-brand-primary, #0969da);
}

.rte-grid-drawer__header-actions {
  display: flex;
  gap: 6px;
}

.rte-grid-drawer__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.15s ease;
}

.rte-grid-drawer__btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}

.rte-grid-drawer__btn--primary {
  background: var(--ra-color-brand-primary, #0969da);
  border-color: var(--ra-color-brand-primary, #0969da);
  color: #fff;
}

.rte-grid-drawer__btn--primary:hover {
  opacity: 0.9;
  color: #fff;
}

.rte-grid-drawer__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rte-grid-drawer__body {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.rte-grid-drawer__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ra-color-text-quaternary, #94a3b8);
}

/* Drawer transition */
.rte-drawer-enter-active,
.rte-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.rte-drawer-enter-active .rte-grid-drawer,
.rte-drawer-leave-active .rte-grid-drawer {
  transition: transform 0.25s ease;
}

.rte-drawer-enter-from,
.rte-drawer-leave-to {
  opacity: 0;
}

.rte-drawer-enter-from .rte-grid-drawer,
.rte-drawer-leave-to .rte-grid-drawer {
  transform: translateX(100%);
}
</style>

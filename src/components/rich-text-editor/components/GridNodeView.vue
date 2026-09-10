<script lang="ts" setup>
import './GridNodeView.css'
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
        meta: {
          totalRows: snapshot.rows?.length || 0,
          totalColumns: snapshot.columns?.length || 0,
        },
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


<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import type { ColDef } from 'ag-grid-community'

export interface FilterCondition {
  field: string
  operator: string
  value: any
  logic: 'AND' | 'OR'
}

const props = defineProps<{
  visible: boolean
  conditions: FilterCondition[]
  columns: ColDef[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'update:conditions', c: FilterCondition[]): void
  (e: 'apply', c: FilterCondition[]): void
}>()

const local = ref<FilterCondition[]>([])

watch(
  () => props.conditions,
  (v) => {
    local.value = JSON.parse(JSON.stringify(v))
  },
  { immediate: true, deep: true },
)
watch(
  () => props.visible,
  (v) => {
    if (v && local.value.length === 0) addFilter()
  },
)

const filterableColumns = computed(() =>
  props.columns
    .filter((c) => c.field && c.field !== 'id' && c.filter !== false)
    .map((c) => ({ label: c.headerName || c.field || '', value: c.field! })),
)

function getColumnType(field: string): string {
  const col = props.columns.find((c) => c.field === field)
  if (!col) return 'text'
  const ctx = (col as any).context || {}
  if (col.cellDataType === 'number' || col.filter === 'agNumberColumnFilter') return 'number'
  if (ctx.__columnType === 'datetime') return 'datetime'
  if (ctx.__columnType === 'year') return 'year'
  if (ctx.__columnType === 'select' || ctx.__columnType === 'multiselect') return 'select'
  return 'text'
}

interface OpDef {
  label: string
  value: string
}

const TEXT_OPS: OpDef[] = [
  { label: '等于', value: 'equals' },
  { label: '不等于', value: 'notEqual' },
  { label: '包含', value: 'contains' },
  { label: '不包含', value: 'notContains' },
  { label: '开始于', value: 'startsWith' },
  { label: '结束于', value: 'endsWith' },
  { label: '为空', value: 'blank' },
  { label: '不为空', value: 'notBlank' },
]

const NUM_OPS: OpDef[] = [
  { label: '等于', value: 'equals' },
  { label: '不等于', value: 'notEqual' },
  { label: '大于', value: 'greaterThan' },
  { label: '小于', value: 'lessThan' },
  { label: '≥', value: 'greaterThanOrEqual' },
  { label: '≤', value: 'lessThanOrEqual' },
  { label: '为空', value: 'blank' },
  { label: '不为空', value: 'notBlank' },
]

const SELECT_OPS: OpDef[] = [
  { label: '等于', value: 'equals' },
  { label: '不等于', value: 'notEqual' },
  { label: '为空', value: 'blank' },
  { label: '不为空', value: 'notBlank' },
]

function getOps(field: string): OpDef[] {
  const t = getColumnType(field)
  if (t === 'number' || t === 'year') return NUM_OPS
  if (t === 'datetime') return NUM_OPS
  if (t === 'select') return SELECT_OPS
  return TEXT_OPS
}

function getInputType(field: string): string {
  const t = getColumnType(field)
  if (t === 'number' || t === 'year') return 'number'
  if (t === 'datetime') return 'datetime-local'
  return 'text'
}

function getSelectOptions(field: string): string[] {
  const col = props.columns.find((c) => c.field === field)
  return col?.cellEditorParams?.values || []
}

function needsValue(op: string) {
  return op !== 'blank' && op !== 'notBlank'
}

function addFilter() {
  local.value.push({ field: '', operator: '', value: null, logic: 'AND' })
}

function removeFilter(i: number) {
  local.value.splice(i, 1)
}
function clearAll() {
  local.value = []
  emit('update:conditions', [])
  emit('apply', [])
  emit('update:visible', false)
}
function onFieldChange(i: number) {
  local.value[i].operator = ''
  local.value[i].value = null
}

function handleApply() {
  const c = JSON.parse(JSON.stringify(local.value))
  emit('update:conditions', c)
  emit('apply', c)
  emit('update:visible', false)
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="rdg-drawer">
      <div v-if="visible" class="rdg-drawer-overlay" @click.self="handleClose">
        <div class="rdg-drawer rdg-drawer--right" style="width: 600px">
          <div class="rdg-drawer__header">
            <span class="rdg-drawer__title">过滤器</span>
            <button class="rdg-drawer__close" @click="handleClose">&times;</button>
          </div>
          <div class="rdg-drawer__body">
            <table class="rdg-filter-table">
              <thead>
                <tr>
                  <th style="width: 70px">逻辑</th>
                  <th style="width: 140px">字段</th>
                  <th style="width: 110px">操作符</th>
                  <th>值</th>
                  <th style="width: 40px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(f, i) in local" :key="i">
                  <td>
                    <select v-if="i > 0" v-model="f.logic" class="rdg-select rdg-select--sm">
                      <option value="AND">且</option>
                      <option value="OR">或</option>
                    </select>
                    <span v-else class="rdg-filter-where">Where</span>
                  </td>
                  <td>
                    <select
                      v-model="f.field"
                      class="rdg-select rdg-select--sm"
                      @change="onFieldChange(i)"
                    >
                      <option value="">选择字段</option>
                      <option v-for="c in filterableColumns" :key="c.value" :value="c.value">
                        {{ c.label }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select v-model="f.operator" class="rdg-select rdg-select--sm">
                      <option value="">操作符</option>
                      <option v-for="o in getOps(f.field)" :key="o.value" :value="o.value">
                        {{ o.label }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <template v-if="needsValue(f.operator)">
                      <select
                        v-if="getColumnType(f.field) === 'select'"
                        v-model="f.value"
                        class="rdg-select rdg-select--sm"
                      >
                        <option :value="null">选择值</option>
                        <option v-for="o in getSelectOptions(f.field)" :key="o" :value="o">
                          {{ o }}
                        </option>
                      </select>
                      <input
                        v-else
                        v-model="f.value"
                        :type="getInputType(f.field)"
                        class="rdg-input rdg-input--sm"
                        placeholder="输入值"
                      />
                    </template>
                    <span v-else class="rdg-filter-no-val">无需输入值</span>
                  </td>
                  <td>
                    <button class="rdg-icon-btn rdg-icon-btn--danger" @click="removeFilter(i)">
                      <X :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="rdg-filter-actions">
              <button class="rdg-btn rdg-btn--sm" @click="addFilter">
                <Plus :size="14" /> 添加条件
              </button>
              <button class="rdg-btn rdg-btn--sm rdg-btn--warning" @click="clearAll">
                清空所有
              </button>
            </div>
          </div>
          <div class="rdg-drawer__footer">
            <button class="rdg-btn" @click="handleClose">取消</button>
            <button class="rdg-btn rdg-btn--primary" @click="handleApply">应用过滤</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.rdg-filter-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rdg-filter-table th {
  text-align: left;
  padding: 6px 4px;
  font-weight: 500;
  color: var(--ra-color-text-secondary, #57606a);
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
}

.rdg-filter-table td {
  padding: 4px;
  vertical-align: middle;
}

.rdg-filter-where {
  font-weight: 500;
  color: var(--ra-color-text-tertiary, #656d76);
  font-size: 13px;
}

.rdg-filter-no-val {
  font-size: 12px;
  color: var(--ra-color-text-quaternary, #8c959f);
}

.rdg-filter-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ra-color-border-light, #e5e7eb);
  display: flex;
  gap: 8px;
}

.rdg-select--sm,
.rdg-input--sm {
  padding: 4px 6px;
  font-size: 13px;
  width: 100%;
}

.rdg-btn--sm {
  padding: 4px 10px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rdg-btn--warning {
  color: var(--ra-color-warning, #bf8700);
  border-color: var(--ra-color-warning, #bf8700);
}

.rdg-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--ra-color-text-tertiary, #656d76);
  transition: all 0.12s;
  padding: 0;
}

.rdg-icon-btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}
.rdg-icon-btn--danger {
  color: var(--ra-color-danger, #cf222e);
}
</style>

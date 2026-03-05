<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import { NButton } from 'naive-ui'
import { RIcon } from '../icon'
import type { FormTableColumn, FormTableRow, FormTableValidateResult } from './types'

const props = defineProps({
  columns: { type: Array as PropType<FormTableColumn[]>, required: true },
  modelValue: { type: Array as PropType<FormTableRow[]>, required: true },
  maxRows: { type: Number, default: Infinity },
  minRows: { type: Number, default: 0 },
  addable: { type: Boolean, default: true },
  removable: { type: Boolean, default: true },
  sortable: { type: Boolean, default: false },
  addLabel: { type: String, default: '+ 添加一行' },
  emptyText: { type: String, default: '暂无数据，点击下方按钮添加' },
  disabled: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: true },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
})

const emit = defineEmits<{
  'update:modelValue': [rows: FormTableRow[]]
  add: []
  remove: [index: number, row: FormTableRow]
  validate: [results: FormTableValidateResult[]]
}>()

const canAdd = computed(
  () => props.addable && !props.disabled && props.modelValue.length < props.maxRows,
)
const canRemove = computed(
  () => props.removable && !props.disabled && props.modelValue.length > props.minRows,
)

function generateKey(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function buildDefaultRow(): FormTableRow {
  const row: FormTableRow = { _key: generateKey() }
  for (const col of props.columns) {
    row[col.key] = col.schema.defaultValue ?? null
  }
  return row
}

function addRow(defaults?: Record<string, unknown>): void {
  if (!canAdd.value) return
  const row = buildDefaultRow()
  if (defaults) Object.assign(row, defaults)
  emit('update:modelValue', [...props.modelValue, row])
  emit('add')
}

function removeRow(index: number): void {
  if (!canRemove.value) return
  const row = props.modelValue[index]
  const next = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', next)
  emit('remove', index, row)
}

function updateCell(rowIndex: number, key: string, value: unknown): void {
  const rows = props.modelValue.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r))
  emit('update:modelValue', rows)
}

async function validate(): Promise<FormTableValidateResult[]> {
  const results: FormTableValidateResult[] = []
  for (let ri = 0; ri < props.modelValue.length; ri++) {
    const row = props.modelValue[ri]
    for (const col of props.columns) {
      const rules = col.schema.rules || []
      for (const rule of rules) {
        if (rule.required && (row[col.key] == null || row[col.key] === '')) {
          results.push({
            rowIndex: ri,
            field: col.key,
            valid: false,
            message: rule.message || `${col.title} 必填`,
          })
          break
        }
      }
    }
  }
  emit('validate', results)
  return results
}

function clearAll(): void {
  emit('update:modelValue', [])
}

function resetRow(index: number): void {
  const defaultRow = buildDefaultRow()
  const rows = props.modelValue.map((r, i) =>
    i === index ? { ...r, ...defaultRow, _key: r._key } : r,
  )
  emit('update:modelValue', rows)
}

defineExpose({
  validate,
  addRow,
  removeRow,
  getRows: () => [...props.modelValue],
  clearAll,
  resetRow,
})
</script>

<template>
  <div class="r-form-table" :class="[`r-form-table--${size}`]" data-testid="form-table">
    <table class="r-form-table__table">
      <thead>
        <tr>
          <th v-if="showIndex" class="r-form-table__th r-form-table__th--index">#</th>
          <th
            v-for="col in columns"
            :key="col.key"
            class="r-form-table__th"
            :style="
              col.width
                ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width }
                : undefined
            "
          >
            {{ col.title }}
            <span
              v-if="col.schema.rules?.some((r) => 'required' in r && r.required)"
              class="r-form-table__required"
              >*</span
            >
          </th>
          <th v-if="removable" class="r-form-table__th r-form-table__th--actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="modelValue.length === 0">
          <td
            :colspan="columns.length + (showIndex ? 1 : 0) + (removable ? 1 : 0)"
            class="r-form-table__empty"
          >
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-for="(row, ri) in modelValue"
          :key="row._key"
          class="r-form-table__row"
          :data-testid="`form-table-row-${ri}`"
        >
          <td v-if="showIndex" class="r-form-table__td r-form-table__td--index">{{ ri + 1 }}</td>
          <td v-for="col in columns" :key="col.key" class="r-form-table__td">
            <slot
              :name="`cell-${col.key}`"
              :row="row"
              :index="ri"
              :value="row[col.key]"
              :update="(v: unknown) => updateCell(ri, col.key, v)"
            >
              <input
                v-if="col.schema.type === 'input'"
                class="r-form-table__input"
                :value="(row[col.key] as string) ?? ''"
                :placeholder="col.schema.placeholder || ''"
                :disabled="disabled"
                :data-testid="`form-table-input-${ri}-${col.key}`"
                @input="(e: Event) => updateCell(ri, col.key, (e.target as HTMLInputElement).value)"
              />
              <select
                v-else-if="col.schema.type === 'select'"
                class="r-form-table__select"
                :value="(row[col.key] as string) ?? ''"
                :disabled="disabled"
                :data-testid="`form-table-select-${ri}-${col.key}`"
                @change="
                  (e: Event) => updateCell(ri, col.key, (e.target as HTMLSelectElement).value)
                "
              >
                <option value="" disabled>{{ col.schema.placeholder || '请选择' }}</option>
                <option
                  v-for="opt in col.schema.options"
                  :key="String(opt.value)"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <span v-else class="r-form-table__text">{{ row[col.key] ?? '-' }}</span>
            </slot>
          </td>
          <td v-if="removable" class="r-form-table__td r-form-table__td--actions">
            <button
              type="button"
              class="r-form-table__remove-btn"
              :disabled="!canRemove"
              :aria-label="`删除第 ${ri + 1} 行`"
              :data-testid="`form-table-remove-${ri}`"
              @click="removeRow(ri)"
            >
              <RIcon name="trash" size="sm" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="canAdd" class="r-form-table__footer">
      <NButton
        :disabled="!canAdd"
        dashed
        block
        :size="size"
        data-testid="form-table-add-btn"
        @click="addRow()"
      >
        {{ addLabel }}
      </NButton>
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.r-form-table {
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  overflow: hidden;
  background: var(--ra-color-bg-surface);
}
.r-form-table__table {
  width: 100%;
  border-collapse: collapse;
}
.r-form-table__th {
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  text-align: left;
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-secondary);
  background: var(--ra-color-bg-muted);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-form-table__th--index {
  width: 48px;
  text-align: center;
}
.r-form-table__th--actions {
  width: 64px;
  text-align: center;
}
.r-form-table__required {
  color: var(--ra-color-danger-text);
  margin-left: 2px;
}
.r-form-table__td {
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  border-bottom: 1px solid var(--ra-color-border-light);
  vertical-align: middle;
}
.r-form-table__td--index {
  text-align: center;
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-tertiary);
}
.r-form-table__td--actions {
  text-align: center;
}
.r-form-table__empty {
  padding: var(--ra-spacing-6);
  text-align: center;
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-sm);
}
.r-form-table__input,
.r-form-table__select {
  width: 100%;
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  font-size: var(--ra-font-size-sm);
  font-family: inherit;
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-primary);
  transition: border-color var(--ra-transition-fast);
  outline: none;
}
.r-form-table__input:focus,
.r-form-table__select:focus {
  border-color: var(--ra-color-brand-primary);
  box-shadow: 0 0 0 2px var(--ra-color-focus-ring);
}
.r-form-table__input:disabled,
.r-form-table__select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.r-form-table__remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--ra-spacing-1);
  border: none;
  border-radius: var(--ra-radius-sm);
  background: transparent;
  color: var(--ra-color-text-tertiary);
  cursor: pointer;
  transition: all var(--ra-transition-fast);
}
.r-form-table__remove-btn:hover:not(:disabled) {
  color: var(--ra-color-danger-text);
  background: var(--ra-color-danger-bg);
}
.r-form-table__remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.r-form-table__footer {
  padding: var(--ra-spacing-3);
}
.r-form-table--small .r-form-table__th,
.r-form-table--small .r-form-table__td {
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
}
.r-form-table--large .r-form-table__th,
.r-form-table--large .r-form-table__td {
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
}
</style>

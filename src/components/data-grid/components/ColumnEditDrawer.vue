<script lang="ts" setup>
import { reactive, watch } from 'vue'
import type { ColDef } from 'ag-grid-community'

export interface ColumnEditForm {
  headerName: string
  field: string
  type: string
  options: string
}

const props = defineProps<{
  visible: boolean
  column?: ColDef
  field?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'save', form: ColumnEditForm): void
}>()

const form = reactive<ColumnEditForm>({
  headerName: '',
  field: '',
  type: 'text',
  options: '',
})

const COLUMN_TYPES = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '时间', value: 'datetime' },
  { label: '年', value: 'year' },
  { label: '单选', value: 'select' },
  { label: '多选', value: 'multiselect' },
  { label: '布尔值', value: 'boolean' },
]

watch(
  [() => props.visible, () => props.column, () => props.field],
  ([vis]) => {
    if (!vis) return
    const col = props.column
    form.headerName = col?.headerName || ''
    form.field = props.field || col?.field || ''
    form.options = ''

    const ctx = (col as any)?.context || {}
    if (col?.cellDataType === 'number' || col?.filter === 'agNumberColumnFilter') {
      form.type = 'number'
    } else if (ctx.__columnType === 'datetime') {
      form.type = 'datetime'
    } else if (ctx.__columnType === 'year') {
      form.type = 'year'
    } else if (ctx.__columnType === 'multiselect') {
      form.type = 'multiselect'
      form.options = (col?.cellEditorParams?.values || []).join(',')
    } else if (ctx.__columnType === 'select') {
      form.type = 'select'
      form.options = (col?.cellEditorParams?.values || []).join(',')
    } else if (col?.cellEditor === 'agCheckboxCellEditor') {
      form.type = 'boolean'
    } else {
      form.type = 'text'
    }
  },
  { immediate: true },
)

function handleSave() {
  if (!form.headerName.trim()) return
  emit('save', { ...form })
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
        <div class="rdg-drawer rdg-drawer--right" style="width: 380px">
          <div class="rdg-drawer__header">
            <span class="rdg-drawer__title">编辑列配置</span>
            <button class="rdg-drawer__close" @click="handleClose">&times;</button>
          </div>
          <div class="rdg-drawer__body">
            <label class="rdg-form-item">
              <span class="rdg-form-label">列名 <span class="rdg-required">*</span></span>
              <input v-model="form.headerName" class="rdg-input" placeholder="请输入列名" />
            </label>
            <label class="rdg-form-item">
              <span class="rdg-form-label">字段名</span>
              <input :value="form.field" class="rdg-input" disabled />
            </label>
            <label class="rdg-form-item">
              <span class="rdg-form-label">列类型 <span class="rdg-required">*</span></span>
              <select v-model="form.type" class="rdg-select">
                <option v-for="t in COLUMN_TYPES" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
            </label>
            <label
              v-if="form.type === 'select' || form.type === 'multiselect'"
              class="rdg-form-item"
            >
              <span class="rdg-form-label">选项（逗号分隔）</span>
              <textarea
                v-model="form.options"
                class="rdg-textarea"
                rows="3"
                placeholder="选项1,选项2,选项3"
              />
            </label>
          </div>
          <div class="rdg-drawer__footer">
            <button class="rdg-btn" @click="handleClose">取消</button>
            <button class="rdg-btn rdg-btn--primary" @click="handleSave">保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.rdg-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
}

.rdg-drawer {
  background: var(--ra-color-bg-surface, #fff);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
}

.rdg-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
}

.rdg-drawer__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ra-color-text-primary, #24292f);
}

.rdg-drawer__close {
  border: none;
  background: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--ra-color-text-tertiary, #656d76);
  line-height: 1;
  padding: 0 4px;
}

.rdg-drawer__close:hover {
  color: var(--ra-color-text-primary, #24292f);
}

.rdg-drawer__body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rdg-drawer__footer {
  padding: 12px 20px;
  border-top: 1px solid var(--ra-color-border-light, #e5e7eb);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.rdg-form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rdg-form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ra-color-text-secondary, #57606a);
}
.rdg-required {
  color: var(--ra-color-danger, #cf222e);
}

.rdg-input,
.rdg-select,
.rdg-textarea {
  padding: 6px 10px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 6px);
  font-size: 14px;
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-primary, #24292f);
  outline: none;
  transition: border-color 0.15s;
}

.rdg-input:focus,
.rdg-select:focus,
.rdg-textarea:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
  box-shadow: 0 0 0 3px var(--ra-color-brand-subtle, rgba(9, 105, 218, 0.15));
}

.rdg-input:disabled {
  background: var(--ra-color-bg-muted, #f6f8fa);
  color: var(--ra-color-text-tertiary, #656d76);
  cursor: not-allowed;
}

.rdg-textarea {
  resize: vertical;
  min-height: 60px;
}

.rdg-btn {
  padding: 6px 16px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-primary, #24292f);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.rdg-btn:hover {
  background: var(--ra-color-bg-muted, #f6f8fa);
}

.rdg-btn--primary {
  background: var(--ra-color-brand-primary, #0969da);
  color: #fff;
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rdg-btn--primary:hover {
  opacity: 0.9;
}

.rdg-drawer-enter-active,
.rdg-drawer-leave-active {
  transition: opacity 0.2s;
}
.rdg-drawer-enter-active .rdg-drawer,
.rdg-drawer-leave-active .rdg-drawer {
  transition: transform 0.25s ease;
}
.rdg-drawer-enter-from,
.rdg-drawer-leave-to {
  opacity: 0;
}
.rdg-drawer-enter-from .rdg-drawer {
  transform: translateX(100%);
}
.rdg-drawer-leave-to .rdg-drawer {
  transform: translateX(100%);
}
</style>

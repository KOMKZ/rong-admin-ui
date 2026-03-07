<script lang="ts" setup>
import { computed, ref, watch, type PropType } from 'vue'
import { NButton, NSpace, NTag, NPopover, NInput } from 'naive-ui'
import RFormRenderer from '../form-renderer/RFormRenderer.vue'
import RIcon from '../icon/RIcon.vue'
import type { FormFieldSchema } from '../form-renderer/types'
import type { FilterBarProExpose, FilterScheme, QuickFilter } from './types'

const props = defineProps({
  schema: { type: Array as PropType<FormFieldSchema[]>, required: true },
  modelValue: { type: Object as PropType<Record<string, unknown>>, required: true },
  collapsible: { type: Boolean, default: true },
  defaultCollapsed: { type: Boolean, default: true },
  quickFilters: { type: Array as PropType<QuickFilter[]>, default: () => [] },
  storageKey: { type: String, default: undefined },
  savedSchemes: { type: Array as PropType<FilterScheme[]>, default: () => [] },
  maxVisibleFields: { type: Number, default: 3 },
  cols: { type: Number, default: 4 },
  resetLabel: { type: String, default: '重置' },
  searchLabel: { type: String, default: '搜索' },
  advancedLabel: { type: String, default: '高级筛选' },
  saveSchemeLabel: { type: String, default: '保存方案' },
})

const emit = defineEmits<{
  'update:modelValue': [values: Record<string, unknown>]
  search: [values: Record<string, unknown>]
  reset: []
  toggleAdvanced: [expanded: boolean]
  saveScheme: [scheme: Omit<FilterScheme, 'id' | 'createdAt'>]
  deleteScheme: [id: string]
  loadScheme: [scheme: FilterScheme]
}>()

const collapsed = ref(props.defaultCollapsed)
const schemeNameInput = ref('')
const showSchemeSave = ref(false)
const localModel = ref<Record<string, unknown>>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (v) => {
    localModel.value = { ...v }
  },
  { deep: true },
)

const visibleSchema = computed(() => {
  if (!props.collapsible || !collapsed.value) return props.schema
  return props.schema.slice(0, props.maxVisibleFields)
})

const hasAdvanced = computed(
  () => props.collapsible && props.schema.length > props.maxVisibleFields,
)

const activeQuickFilters = computed(() => {
  return props.quickFilters.filter((qf) => localModel.value[qf.key] === qf.value)
})

const activeFilterChips = computed(() => {
  return Object.entries(localModel.value)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, value]) => {
      const field = props.schema.find((s) => s.key === key)
      return { key, label: field?.label ?? key, value: String(value) }
    })
})

function handleModelUpdate(values: Record<string, unknown>): void {
  localModel.value = values
  emit('update:modelValue', values)
}

function handleSearch(): void {
  emit('update:modelValue', { ...localModel.value })
  emit('search', { ...localModel.value })
}

function handleReset(): void {
  const empty: Record<string, unknown> = {}
  props.schema.forEach((s) => {
    empty[s.key] = undefined
  })
  localModel.value = empty
  emit('update:modelValue', empty)
  emit('reset')
}

function toggleAdvanced(): void {
  collapsed.value = !collapsed.value
  emit('toggleAdvanced', !collapsed.value)
}

function applyQuickFilter(qf: QuickFilter): void {
  const isActive = localModel.value[qf.key] === qf.value
  const newVal = isActive ? undefined : qf.value
  localModel.value = { ...localModel.value, [qf.key]: newVal }
  emit('update:modelValue', { ...localModel.value })
  emit('search', { ...localModel.value })
}

function removeChip(key: string): void {
  localModel.value = { ...localModel.value, [key]: undefined }
  emit('update:modelValue', { ...localModel.value })
  emit('search', { ...localModel.value })
}

function handleSaveScheme(): void {
  if (!schemeNameInput.value.trim()) return
  emit('saveScheme', { name: schemeNameInput.value.trim(), values: { ...localModel.value } })
  schemeNameInput.value = ''
  showSchemeSave.value = false
  persistSchemes()
}

function loadScheme(scheme: FilterScheme): void {
  localModel.value = { ...scheme.values }
  emit('update:modelValue', { ...scheme.values })
  emit('loadScheme', scheme)
  emit('search', { ...scheme.values })
}

function deleteScheme(id: string): void {
  emit('deleteScheme', id)
}

function persistSchemes(): void {
  if (!props.storageKey) return
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(props.savedSchemes))
  } catch {
    /* quota exceeded, ignore */
  }
}

const expose: FilterBarProExpose = {
  reset: handleReset,
  search: handleSearch,
  getValues: () => ({ ...localModel.value }),
  setValues: (values) => {
    localModel.value = { ...values }
    emit('update:modelValue', { ...values })
  },
  toggleAdvanced: (expanded) => {
    collapsed.value = expanded !== undefined ? !expanded : !collapsed.value
    emit('toggleAdvanced', !collapsed.value)
  },
}

defineExpose(expose)
</script>

<template>
  <div class="r-filter-bar-pro">
    <!-- Quick Filters -->
    <div v-if="quickFilters.length > 0" class="r-filter-bar-pro__quick" data-testid="quick-filters">
      <NSpace size="small">
        <NTag
          v-for="qf in quickFilters"
          :key="qf.key + '-' + String(qf.value)"
          :type="
            activeQuickFilters.some((a) => a.key === qf.key && a.value === qf.value)
              ? 'primary'
              : 'default'
          "
          :checkable="true"
          :checked="activeQuickFilters.some((a) => a.key === qf.key && a.value === qf.value)"
          size="small"
          round
          :data-testid="`quick-filter-${qf.key}`"
          @update:checked="applyQuickFilter(qf)"
        >
          <template v-if="qf.icon" #icon>
            <RIcon :name="qf.icon" :size="14" />
          </template>
          {{ qf.label }}
        </NTag>
      </NSpace>
    </div>

    <!-- Main Filter Form -->
    <div class="r-filter-bar-pro__form" data-testid="filter-form">
      <RFormRenderer
        :schema="visibleSchema"
        :model="localModel"
        :cols="cols"
        :label-width="80"
        @update:model="handleModelUpdate"
      />
    </div>

    <!-- Actions Row -->
    <div class="r-filter-bar-pro__actions" data-testid="filter-actions">
      <NSpace size="small" align="center">
        <slot name="beforeActions" />
        <NButton type="primary" size="small" data-testid="filter-search-btn" @click="handleSearch">
          <template #icon><RIcon name="search" :size="14" /></template>
          {{ searchLabel }}
        </NButton>
        <NButton size="small" data-testid="filter-reset-btn" @click="handleReset">
          <template #icon><RIcon name="rotate-ccw" :size="14" /></template>
          {{ resetLabel }}
        </NButton>
        <NButton
          v-if="hasAdvanced"
          text
          size="small"
          data-testid="filter-toggle-btn"
          @click="toggleAdvanced"
        >
          {{ collapsed ? advancedLabel : '收起' }}
          <template #icon>
            <RIcon :name="collapsed ? 'chevron-down' : 'chevron-up'" :size="14" />
          </template>
        </NButton>

        <!-- Saved Schemes -->
        <NPopover v-if="storageKey" trigger="click" placement="bottom-start">
          <template #trigger>
            <NButton text size="small" data-testid="filter-schemes-btn">
              <template #icon><RIcon name="bookmark" :size="14" /></template>
              筛选方案
            </NButton>
          </template>
          <div class="r-filter-bar-pro__schemes" data-testid="filter-schemes-panel">
            <div
              v-for="scheme in savedSchemes"
              :key="scheme.id"
              class="r-filter-bar-pro__scheme-item"
            >
              <NButton text size="small" @click="loadScheme(scheme)">{{ scheme.name }}</NButton>
              <NButton text size="tiny" type="error" @click="deleteScheme(scheme.id)">
                <RIcon name="x" :size="12" />
              </NButton>
            </div>
            <div v-if="!showSchemeSave" class="r-filter-bar-pro__scheme-add">
              <NButton text size="small" type="primary" @click="showSchemeSave = true">
                <template #icon><RIcon name="plus" :size="12" /></template>
                {{ saveSchemeLabel }}
              </NButton>
            </div>
            <div v-else class="r-filter-bar-pro__scheme-input">
              <NInput
                v-model:value="schemeNameInput"
                size="small"
                placeholder="方案名称"
                data-testid="scheme-name-input"
                @keydown.enter="handleSaveScheme"
              />
              <NButton
                size="tiny"
                type="primary"
                data-testid="scheme-save-confirm"
                @click="handleSaveScheme"
                >保存</NButton
              >
            </div>
            <div
              v-if="savedSchemes.length === 0 && !showSchemeSave"
              class="r-filter-bar-pro__scheme-empty"
            >
              暂无保存的方案
            </div>
          </div>
        </NPopover>

        <slot name="afterActions" />
      </NSpace>
    </div>

    <!-- Active Filter Chips -->
    <div
      v-if="activeFilterChips.length > 0"
      class="r-filter-bar-pro__chips"
      data-testid="filter-chips"
    >
      <NSpace size="small">
        <NTag
          v-for="chip in activeFilterChips"
          :key="chip.key"
          closable
          size="small"
          :data-testid="`chip-${chip.key}`"
          @close="removeChip(chip.key)"
        >
          {{ chip.label }}: {{ chip.value }}
        </NTag>
        <NButton text size="tiny" type="warning" data-testid="clear-all-chips" @click="handleReset">
          清除全部
        </NButton>
      </NSpace>
    </div>

    <slot name="extra" />
  </div>
</template>

<style scoped>
.r-filter-bar-pro {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
  padding: var(--ra-card-padding-y) var(--ra-card-padding-x);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
}
.r-filter-bar-pro__quick {
  padding-bottom: var(--ra-spacing-2);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-filter-bar-pro__form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ra-spacing-3);
}
.r-filter-bar-pro__actions {
  display: flex;
  align-items: center;
}
.r-filter-bar-pro__chips {
  padding-top: var(--ra-spacing-2);
  border-top: 1px solid var(--ra-color-border-default);
}
.r-filter-bar-pro__schemes {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
}
.r-filter-bar-pro__scheme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ra-spacing-2);
}
.r-filter-bar-pro__scheme-input {
  display: flex;
  gap: var(--ra-spacing-2);
  align-items: center;
}
.r-filter-bar-pro__scheme-empty {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
  text-align: center;
  padding: var(--ra-spacing-2);
}
</style>

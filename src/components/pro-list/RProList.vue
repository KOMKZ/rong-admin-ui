<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue'
import { NButton, NSpace, NCheckbox, NPagination, NEmpty } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import type { ProListViewMode, ProListAction, ProListPagination, ProListExpose } from './types'

const props = defineProps({
  data: { type: Array as PropType<Record<string, unknown>[]>, required: true },
  loading: { type: Boolean, default: false },
  viewMode: { type: String as PropType<ProListViewMode>, default: 'card' },
  pagination: {
    type: [Object, Boolean] as PropType<ProListPagination | false>,
    default: false,
  },
  rowKey: {
    type: [String, Function] as PropType<string | ((row: Record<string, unknown>) => string | number)>,
    default: 'id',
  },
  selectable: { type: Boolean, default: false },
  checkedKeys: { type: Array as PropType<(string | number)[]>, default: () => [] },
  actions: { type: Array as PropType<ProListAction[]>, default: () => [] },
  emptyText: { type: String, default: '暂无数据' },
  emptyIcon: { type: String, default: 'inbox' },
  grid: {
    type: Object as PropType<{ xs?: number; sm?: number; md?: number; lg?: number; xl?: number }>,
    default: () => ({ xs: 1, sm: 2, md: 3, lg: 4 }),
  },
  cardMinWidth: { type: Number, default: 280 },
})

const emit = defineEmits<{
  'update:viewMode': [mode: ProListViewMode]
  'update:page': [page: number]
  'update:pageSize': [size: number]
  'update:checkedKeys': [keys: (string | number)[]]
  action: [key: string, item: Record<string, unknown>]
  itemClick: [item: Record<string, unknown>]
}>()

const localViewMode = ref(props.viewMode)

function getRowKey(row: Record<string, unknown>): string | number {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  return row[props.rowKey] as string | number
}

function isChecked(row: Record<string, unknown>): boolean {
  return props.checkedKeys.includes(getRowKey(row))
}

function toggleCheck(row: Record<string, unknown>): void {
  const key = getRowKey(row)
  const next = isChecked(row)
    ? props.checkedKeys.filter((k) => k !== key)
    : [...props.checkedKeys, key]
  emit('update:checkedKeys', next)
}

function switchView(mode: ProListViewMode): void {
  localViewMode.value = mode
  emit('update:viewMode', mode)
}

function handleAction(key: string, item: Record<string, unknown>): void {
  emit('action', key, item)
}

function handleItemClick(item: Record<string, unknown>): void {
  emit('itemClick', item)
}

function isActionDisabled(action: ProListAction, item: Record<string, unknown>): boolean {
  if (typeof action.disabled === 'function') return action.disabled(item)
  return !!action.disabled
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fill, minmax(${props.cardMinWidth}px, 1fr))`,
}))

const clearSelection = (): void => { emit('update:checkedKeys', []) }
const toggleViewMode = (): void => {
  switchView(localViewMode.value === 'card' ? 'list' : 'card')
}

const expose: ProListExpose = { clearSelection, toggleViewMode }
defineExpose(expose)
</script>

<template>
  <div class="r-pro-list" data-testid="pro-list">
    <!-- Header -->
    <div class="r-pro-list__header">
      <div class="r-pro-list__header-left">
        <slot name="header" />
      </div>
      <div class="r-pro-list__header-right">
        <slot name="headerExtra" />
        <NSpace size="small">
          <NButton
            :type="localViewMode === 'card' ? 'primary' : 'default'"
            quaternary
            size="small"
            data-testid="view-card-btn"
            @click="switchView('card')"
          >
            <template #icon><RIcon name="layout-grid" :size="16" /></template>
          </NButton>
          <NButton
            :type="localViewMode === 'list' ? 'primary' : 'default'"
            quaternary
            size="small"
            data-testid="view-list-btn"
            @click="switchView('list')"
          >
            <template #icon><RIcon name="layout-list" :size="16" /></template>
          </NButton>
        </NSpace>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="data.length === 0 && !loading" class="r-pro-list__empty" data-testid="pro-list-empty">
      <slot name="empty">
        <NEmpty :description="emptyText">
          <template #icon>
            <RIcon :name="emptyIcon" :size="48" />
          </template>
        </NEmpty>
      </slot>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="r-pro-list__loading" data-testid="pro-list-loading">
      <RIcon name="loader" :size="24" class="r-pro-list__spinner" />
    </div>

    <!-- Card View -->
    <div
      v-else-if="localViewMode === 'card'"
      class="r-pro-list__grid"
      :style="gridStyle"
      data-testid="pro-list-grid"
    >
      <div
        v-for="(item, idx) in data"
        :key="getRowKey(item)"
        class="r-pro-list__card"
        :data-testid="`pro-list-card-${idx}`"
        @click="handleItemClick(item)"
      >
        <NCheckbox
          v-if="selectable"
          :checked="isChecked(item)"
          class="r-pro-list__card-check"
          @update:checked="toggleCheck(item)"
          @click.stop
        />
        <div class="r-pro-list__card-body">
          <slot name="card" :item="item" :index="idx">
            <pre class="r-pro-list__default-content">{{ JSON.stringify(item, null, 2) }}</pre>
          </slot>
        </div>
        <div v-if="actions.length > 0 || $slots.actions" class="r-pro-list__card-actions" @click.stop>
          <slot name="actions" :item="item">
            <NSpace size="small">
              <NButton
                v-for="act in actions"
                :key="act.key"
                :type="act.danger ? 'error' : 'default'"
                text
                size="small"
                :disabled="isActionDisabled(act, item)"
                :data-testid="`action-${act.key}`"
                @click="handleAction(act.key, item)"
              >
                <template v-if="act.icon" #icon>
                  <RIcon :name="act.icon" :size="14" />
                </template>
                {{ act.label }}
              </NButton>
            </NSpace>
          </slot>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="r-pro-list__list" data-testid="pro-list-list">
      <div
        v-for="(item, idx) in data"
        :key="getRowKey(item)"
        class="r-pro-list__list-item"
        :data-testid="`pro-list-item-${idx}`"
        @click="handleItemClick(item)"
      >
        <NCheckbox
          v-if="selectable"
          :checked="isChecked(item)"
          @update:checked="toggleCheck(item)"
          @click.stop
        />
        <div class="r-pro-list__list-body">
          <slot name="listItem" :item="item" :index="idx">
            <pre class="r-pro-list__default-content">{{ JSON.stringify(item, null, 2) }}</pre>
          </slot>
        </div>
        <div v-if="actions.length > 0 || $slots.actions" class="r-pro-list__list-actions" @click.stop>
          <slot name="actions" :item="item">
            <NSpace size="small">
              <NButton
                v-for="act in actions"
                :key="act.key"
                :type="act.danger ? 'error' : 'default'"
                text
                size="small"
                :disabled="isActionDisabled(act, item)"
                @click="handleAction(act.key, item)"
              >
                <template v-if="act.icon" #icon>
                  <RIcon :name="act.icon" :size="14" />
                </template>
                {{ act.label }}
              </NButton>
            </NSpace>
          </slot>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination" class="r-pro-list__pagination" data-testid="pro-list-pagination">
      <NPagination
        :page="pagination.page"
        :page-size="pagination.pageSize"
        :item-count="pagination.total"
        :page-sizes="pagination.pageSizes || [12, 24, 48]"
        show-size-picker
        @update:page="(p: number) => emit('update:page', p)"
        @update:page-size="(s: number) => emit('update:pageSize', s)"
      />
    </div>
  </div>
</template>

<style scoped>
.r-pro-list {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-4);
}
.r-pro-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.r-pro-list__header-left,
.r-pro-list__header-right {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
.r-pro-list__grid {
  display: grid;
  gap: var(--ra-spacing-4);
}
.r-pro-list__card {
  position: relative;
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  padding: var(--ra-spacing-4);
  transition: box-shadow var(--ra-transition-fast), border-color var(--ra-transition-fast);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
}
.r-pro-list__card:hover {
  border-color: var(--ra-color-brand-primary);
  box-shadow: var(--ra-shadow-sm);
}
.r-pro-list__card-check {
  position: absolute;
  top: var(--ra-spacing-3);
  right: var(--ra-spacing-3);
}
.r-pro-list__card-body {
  flex: 1;
}
.r-pro-list__card-actions {
  border-top: 1px solid var(--ra-color-border-default);
  padding-top: var(--ra-spacing-3);
}
.r-pro-list__list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  overflow: hidden;
}
.r-pro-list__list-item {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-4);
  background: var(--ra-color-bg-surface);
  border-bottom: 1px solid var(--ra-color-border-default);
  transition: background var(--ra-transition-fast);
  cursor: pointer;
}
.r-pro-list__list-item:last-child {
  border-bottom: none;
}
.r-pro-list__list-item:hover {
  background: var(--ra-color-bg-page);
}
.r-pro-list__list-body {
  flex: 1;
  min-width: 0;
}
.r-pro-list__list-actions {
  flex-shrink: 0;
}
.r-pro-list__empty {
  padding: var(--ra-spacing-12) 0;
  text-align: center;
}
.r-pro-list__loading {
  display: flex;
  justify-content: center;
  padding: var(--ra-spacing-12) 0;
}
.r-pro-list__spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.r-pro-list__pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--ra-spacing-4);
}
.r-pro-list__default-content {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

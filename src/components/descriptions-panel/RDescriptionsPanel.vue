<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue'
import { NButton, NTooltip } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import type {
  DescriptionItem,
  DescriptionGroup,
  DescriptionsPanelExpose,
} from './types'

const props = defineProps({
  items: { type: Array as PropType<DescriptionItem[]>, default: () => [] },
  groups: { type: Array as PropType<DescriptionGroup[]>, default: () => [] },
  columns: {
    type: [Number, Object] as PropType<number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }>,
    default: 3,
  },
  bordered: { type: Boolean, default: false },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
  title: { type: String, default: undefined },
  colon: { type: Boolean, default: true },
  labelWidth: { type: [Number, String] as PropType<number | string>, default: 120 },
  layout: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
  emptyText: { type: String, default: '-' },
})

const collapsedGroups = ref<Set<number>>(new Set(
  (props.groups || [])
    .map((g, i) => (g.defaultCollapsed ? i : -1))
    .filter((i) => i >= 0),
))

const columnCount = computed(() => {
  if (typeof props.columns === 'number') return props.columns
  return props.columns.md ?? 3
})

const labelStyle = computed(() => {
  const w = typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth
  return { width: w, minWidth: w }
})

function formatValue(item: DescriptionItem): string {
  if (item.value === null || item.value === undefined || item.value === '') {
    return item.emptyText ?? props.emptyText
  }
  return String(item.value)
}

function isGroupCollapsed(index: number): boolean {
  return collapsedGroups.value.has(index)
}

function toggleGroup(index: number): void {
  const next = new Set(collapsedGroups.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  collapsedGroups.value = next
}

function expandAll(): void {
  collapsedGroups.value = new Set()
}

function collapseAll(): void {
  collapsedGroups.value = new Set(props.groups.map((_, i) => i))
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch { /* fallback silent */ }
}

const expose: DescriptionsPanelExpose = { toggleGroup, expandAll, collapseAll }
defineExpose(expose)
</script>

<template>
  <div
    class="r-descriptions-panel"
    :class="[`r-descriptions-panel--${size}`, { 'r-descriptions-panel--bordered': bordered }]"
    data-testid="descriptions-panel"
  >
    <!-- Header -->
    <div v-if="title || $slots.title || $slots.extra" class="r-descriptions-panel__header">
      <slot name="title">
        <h3 v-if="title" class="r-descriptions-panel__title">{{ title }}</h3>
      </slot>
      <slot name="extra" />
    </div>

    <!-- Flat items -->
    <div
      v-if="items.length > 0"
      class="r-descriptions-panel__grid"
      :style="{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }"
      data-testid="descriptions-items"
    >
      <div
        v-for="item in items"
        :key="item.key"
        class="r-descriptions-panel__item"
        :class="{ 'r-descriptions-panel__item--vertical': layout === 'vertical' }"
        :style="item.span ? { gridColumn: `span ${item.span}` } : {}"
        :data-testid="`desc-item-${item.key}`"
      >
        <div class="r-descriptions-panel__label" :style="layout === 'horizontal' ? labelStyle : {}">
          {{ item.label }}{{ colon ? '：' : '' }}
        </div>
        <div class="r-descriptions-panel__value">
          <slot :name="`item-${item.key}`" :item="item">
            <template v-if="item.render">
              <component :is="{ render: item.render }" />
            </template>
            <span v-else :class="{ 'r-descriptions-panel__empty': !item.value && item.value !== 0 }">
              {{ formatValue(item) }}
            </span>
          </slot>
          <NTooltip v-if="item.copyable && item.value">
            <template #trigger>
              <NButton text size="tiny" class="r-descriptions-panel__copy" @click="copyToClipboard(String(item.value))">
                <RIcon name="copy" :size="12" />
              </NButton>
            </template>
            复制
          </NTooltip>
        </div>
      </div>
    </div>

    <!-- Grouped items -->
    <div v-for="(group, gIdx) in groups" :key="gIdx" class="r-descriptions-panel__group" :data-testid="`desc-group-${gIdx}`">
      <div v-if="group.title" class="r-descriptions-panel__group-header">
        <div class="r-descriptions-panel__group-title">
          <RIcon v-if="group.icon" :name="group.icon" :size="16" />
          <span>{{ group.title }}</span>
        </div>
        <NButton
          v-if="group.collapsible"
          text
          size="tiny"
          @click="toggleGroup(gIdx)"
        >
          <RIcon :name="isGroupCollapsed(gIdx) ? 'chevron-down' : 'chevron-up'" :size="14" />
        </NButton>
      </div>
      <div
        v-show="!isGroupCollapsed(gIdx)"
        class="r-descriptions-panel__grid"
        :style="{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }"
      >
        <div
          v-for="item in group.items"
          :key="item.key"
          class="r-descriptions-panel__item"
          :class="{ 'r-descriptions-panel__item--vertical': layout === 'vertical' }"
          :style="item.span ? { gridColumn: `span ${item.span}` } : {}"
          :data-testid="`desc-item-${item.key}`"
        >
          <div class="r-descriptions-panel__label" :style="layout === 'horizontal' ? labelStyle : {}">
            {{ item.label }}{{ colon ? '：' : '' }}
          </div>
          <div class="r-descriptions-panel__value">
            <slot :name="`item-${item.key}`" :item="item">
              <template v-if="item.render">
                <component :is="{ render: item.render }" />
              </template>
              <span v-else :class="{ 'r-descriptions-panel__empty': !item.value && item.value !== 0 }">
                {{ formatValue(item) }}
              </span>
            </slot>
            <NTooltip v-if="item.copyable && item.value">
              <template #trigger>
                <NButton text size="tiny" class="r-descriptions-panel__copy" @click="copyToClipboard(String(item.value))">
                  <RIcon name="copy" :size="12" />
                </NButton>
              </template>
              复制
            </NTooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-descriptions-panel {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-4);
}
.r-descriptions-panel--bordered {
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  padding: var(--ra-spacing-5);
}
.r-descriptions-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.r-descriptions-panel__title {
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
  margin: 0;
}
.r-descriptions-panel__grid {
  display: grid;
  gap: var(--ra-spacing-3) var(--ra-spacing-6);
}
.r-descriptions-panel__item {
  display: flex;
  gap: var(--ra-spacing-2);
}
.r-descriptions-panel__item--vertical {
  flex-direction: column;
  gap: var(--ra-spacing-1);
}
.r-descriptions-panel__label {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-secondary);
  flex-shrink: 0;
  line-height: 1.6;
}
.r-descriptions-panel__value {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-primary);
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  word-break: break-all;
}
.r-descriptions-panel__empty {
  color: var(--ra-color-text-tertiary);
}
.r-descriptions-panel__copy {
  opacity: 0;
  transition: opacity var(--ra-transition-fast);
}
.r-descriptions-panel__value:hover .r-descriptions-panel__copy {
  opacity: 1;
}
.r-descriptions-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
}
.r-descriptions-panel__group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--ra-spacing-2);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-descriptions-panel__group-title {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  font-size: var(--ra-font-size-base);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-primary);
}
.r-descriptions-panel--small .r-descriptions-panel__label,
.r-descriptions-panel--small .r-descriptions-panel__value {
  font-size: var(--ra-font-size-xs);
}
.r-descriptions-panel--large .r-descriptions-panel__label,
.r-descriptions-panel--large .r-descriptions-panel__value {
  font-size: var(--ra-font-size-base);
}
</style>

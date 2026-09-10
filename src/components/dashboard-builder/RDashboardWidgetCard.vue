<script setup lang="ts">
import { REmptyState } from '../empty-state'
import { RIcon } from '../icon'
import type { Component } from 'vue'
import type { DashboardWidgetDefinition } from './types'
import type { PlacedLayoutItem } from './layout-core'

defineProps<{
  item: PlacedLayoutItem
  index: number
  definition?: DashboardWidgetDefinition
  renderer?: Component
  title: string
  description: string
  sizeLabel: string
  editing: boolean
  readonly: boolean
  dragging: boolean
  hasEditor: boolean
}>()

const emit = defineEmits<{
  beginDrag: [event: PointerEvent, item: PlacedLayoutItem]
  beginResize: [event: PointerEvent, item: PlacedLayoutItem, axis: 'x' | 'y' | 'both']
  edit: [item: PlacedLayoutItem]
  move: [index: number, direction: 'up' | 'down']
  cycleSize: [id: string]
  remove: [id: string]
}>()
</script>

<template>
  <article
    class="r-dashboard-builder__item"
    :class="{ 'r-dashboard-builder__item--dragging': dragging }"
    :style="{
      gridColumnStart: String(item.x),
      gridColumnEnd: `span ${item.w}`,
      gridRowStart: String(item.y),
      gridRowEnd: `span ${item.h}`,
    }"
    data-testid="dashboard-widget"
  >
    <header
      class="r-dashboard-builder__item-header"
      :class="{ 'r-dashboard-builder__item-header--draggable': editing && !readonly }"
      @pointerdown="emit('beginDrag', $event, item)"
    >
      <div class="r-dashboard-builder__item-title">
        <RIcon :name="definition?.icon || 'layout-grid'" :size="16" />
        <div class="r-dashboard-builder__item-texts">
          <span>{{ title }}</span>
          <small v-if="description" class="r-dashboard-builder__item-description">
            {{ description }}
          </small>
        </div>
      </div>
      <div class="r-dashboard-builder__item-actions" @pointerdown.stop>
        <span
          v-if="editing && !readonly"
          class="r-dashboard-builder__size-chip"
          data-testid="dashboard-widget-size"
        >
          {{ sizeLabel }}
        </span>
        <template v-if="editing && !readonly">
          <button
            v-if="hasEditor"
            class="r-dashboard-builder__icon-btn"
            type="button"
            data-testid="dashboard-widget-edit"
            @click="emit('edit', item)"
          >
            <RIcon name="settings" :size="14" />
          </button>
          <button
            class="r-dashboard-builder__icon-btn"
            type="button"
            data-testid="dashboard-widget-move-up"
            @click="emit('move', index, 'up')"
          >
            <RIcon name="arrow-up" :size="14" />
          </button>
          <button
            class="r-dashboard-builder__icon-btn"
            type="button"
            data-testid="dashboard-widget-move-down"
            @click="emit('move', index, 'down')"
          >
            <RIcon name="arrow-down" :size="14" />
          </button>
          <button
            class="r-dashboard-builder__icon-btn"
            type="button"
            data-testid="dashboard-widget-cycle-size"
            @click="emit('cycleSize', item.id)"
          >
            <RIcon name="expand" :size="14" />
          </button>
          <button
            class="r-dashboard-builder__icon-btn r-dashboard-builder__icon-btn--danger"
            type="button"
            data-testid="dashboard-widget-remove"
            @click="emit('remove', item.id)"
          >
            <RIcon name="trash" :size="14" />
          </button>
        </template>
      </div>
    </header>

    <div class="r-dashboard-builder__item-content">
      <slot name="widget" :item="item" :definition="definition">
        <component
          :is="renderer"
          v-if="renderer"
          :item="item"
          :definition="definition"
          :config="item.config"
          :fallback-title="definition?.title"
          :fallback-description="definition?.description"
        />
        <REmptyState
          v-else
          icon="layout-grid"
          title="组件未注册"
          description="请为该组件类型提供渲染器。"
          size="small"
        />
      </slot>
    </div>

    <template v-if="editing && !readonly">
      <button
        class="r-dashboard-builder__resize-handle r-dashboard-builder__resize-handle--x"
        type="button"
        data-testid="dashboard-widget-resize-x"
        @pointerdown.stop="emit('beginResize', $event, item, 'x')"
      >
        <RIcon name="chevrons-right" :size="12" />
      </button>
      <button
        class="r-dashboard-builder__resize-handle r-dashboard-builder__resize-handle--y"
        type="button"
        data-testid="dashboard-widget-resize-y"
        @pointerdown.stop="emit('beginResize', $event, item, 'y')"
      >
        <RIcon name="chevrons-down" :size="12" />
      </button>
      <button
        class="r-dashboard-builder__resize-handle r-dashboard-builder__resize-handle--both"
        type="button"
        data-testid="dashboard-widget-resize-both"
        @pointerdown.stop="emit('beginResize', $event, item, 'both')"
      >
        <RIcon name="maximize-2" :size="12" />
      </button>
    </template>
  </article>
</template>

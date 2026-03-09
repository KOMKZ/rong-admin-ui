<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NInput, NSelect } from 'naive-ui'
import type { DashboardWidgetDefinition } from '../../types'
import {
  normalizeRouteQuickActionsConfig,
  type RouteQuickActionItem,
  type RouteQuickActionsEditorOptions,
  type RouteQuickActionsWidgetConfig,
} from './types'

const props = defineProps<{
  modelValue?: Record<string, unknown>
  definition?: DashboardWidgetDefinition
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const config = computed<RouteQuickActionsWidgetConfig>(() =>
  normalizeRouteQuickActionsConfig(props.modelValue),
)

const routeOptions = computed<
  Array<{ label: string; value: string; openMode: 'in_app' | 'new_tab' }>
>(() => {
  const editorOptions = props.definition?.editorOptions as
    | RouteQuickActionsEditorOptions
    | undefined
  return (
    editorOptions?.routeOptions?.map((item) => ({
      openMode: item.openMode === 'new_tab' ? 'new_tab' : 'in_app',
      label: item.description ? `${item.label} (${item.description})` : item.label,
      value: item.value,
    })) || []
  )
})

const openModeOptions = [
  { label: '应用内', value: 'in_app' },
  { label: '新标签', value: 'new_tab' },
]

function emitConfig(next: RouteQuickActionsWidgetConfig): void {
  emit('update:modelValue', {
    title: next.title || '',
    description: next.description || '',
    actions: next.actions,
  })
}

function updateField(field: 'title' | 'description', value: string): void {
  emitConfig({
    ...config.value,
    [field]: value,
  })
}

function updateAction(index: number, patch: Partial<RouteQuickActionItem>): void {
  const next = config.value.actions.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          ...patch,
        }
      : item,
  )
  emitConfig({ ...config.value, actions: next })
}

function addAction(): void {
  const firstRoute = routeOptions.value[0]
  const next: RouteQuickActionItem = {
    id: `action-${Date.now()}`,
    label: '新按钮',
    route: firstRoute?.value || '/dashboard',
    openMode: firstRoute?.openMode || 'in_app',
  }
  emitConfig({
    ...config.value,
    actions: [...config.value.actions, next],
  })
}

function removeAction(index: number): void {
  emitConfig({
    ...config.value,
    actions: config.value.actions.filter((_, itemIndex) => itemIndex !== index),
  })
}

function fillActionRoute(index: number, value: string | null): void {
  if (!value) return
  const matched = routeOptions.value.find((item) => item.value === value)
  updateAction(index, {
    route: value,
    openMode: matched?.openMode || 'in_app',
  })
}
</script>

<template>
  <div class="route-quick-actions-editor" data-testid="route-quick-actions-editor">
    <div class="route-quick-actions-editor__group">
      <label class="route-quick-actions-editor__label">组件标题</label>
      <NInput
        :value="config.title || ''"
        placeholder="例如：运营快捷入口"
        size="small"
        data-testid="route-widget-title-input"
        @update:value="(value) => updateField('title', value)"
      />
    </div>

    <div class="route-quick-actions-editor__group">
      <label class="route-quick-actions-editor__label">组件描述</label>
      <NInput
        :value="config.description || ''"
        placeholder="例如：常用页面一键跳转"
        size="small"
        data-testid="route-widget-description-input"
        @update:value="(value) => updateField('description', value)"
      />
    </div>

    <div class="route-quick-actions-editor__section-header">
      <span>按钮编排</span>
      <NButton size="tiny" tertiary data-testid="route-widget-action-add" @click="addAction"
        >添加按钮</NButton
      >
    </div>

    <div v-if="config.actions.length" class="route-quick-actions-editor__actions">
      <div
        v-for="(item, index) in config.actions"
        :key="item.id"
        class="route-quick-actions-editor__action-row"
      >
        <NInput
          :value="item.label"
          size="small"
          placeholder="按钮文案"
          data-testid="route-widget-action-label"
          @update:value="(value) => updateAction(index, { label: value })"
        />
        <NInput
          :value="item.route"
          size="small"
          placeholder="请输入路径或完整 URL，例如 /admin/list?status=active"
          data-testid="route-widget-action-route"
          @update:value="(value) => updateAction(index, { route: value })"
        />
        <NSelect
          :value="item.openMode || 'in_app'"
          size="small"
          :options="openModeOptions"
          placeholder="打开方式"
          data-testid="route-widget-action-open-mode"
          @update:value="
            (value) => updateAction(index, { openMode: value === 'new_tab' ? 'new_tab' : 'in_app' })
          "
        />
        <NSelect
          :value="null"
          size="small"
          filterable
          :options="routeOptions"
          placeholder="从路由清单快速填充"
          data-testid="route-widget-action-route-select"
          @update:value="(value) => fillActionRoute(index, String(value || ''))"
        />
        <NButton
          size="tiny"
          quaternary
          type="error"
          data-testid="route-widget-action-remove"
          @click="removeAction(index)"
        >
          删除
        </NButton>
      </div>
    </div>

    <div v-else class="route-quick-actions-editor__empty" data-testid="route-widget-actions-empty">
      还没有配置任何按钮，请点击“添加按钮”。
    </div>
  </div>
</template>

<style scoped>
.route-quick-actions-editor {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
}

.route-quick-actions-editor__group {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1);
}

.route-quick-actions-editor__label {
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}

.route-quick-actions-editor__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
}

.route-quick-actions-editor__actions {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
}

.route-quick-actions-editor__action-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 0.9fr 1.1fr auto;
  gap: var(--ra-spacing-2);
}

.route-quick-actions-editor__empty {
  border-radius: var(--ra-radius-md);
  border: 1px dashed var(--ra-color-border-default);
  padding: var(--ra-spacing-3);
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}

@media (max-width: 900px) {
  .route-quick-actions-editor__action-row {
    grid-template-columns: 1fr;
  }
}
</style>

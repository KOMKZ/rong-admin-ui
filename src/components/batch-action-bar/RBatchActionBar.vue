<script lang="ts" setup>
import { type PropType } from 'vue'
import { NButton, NSpace, NPopconfirm } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import type { BatchAction, BatchActionBarExpose } from './types'

const props = defineProps({
  selectedCount: { type: Number, required: true },
  selectedKeys: { type: Array as PropType<(string | number)[]>, default: () => [] },
  actions: { type: Array as PropType<BatchAction[]>, required: true },
  visible: { type: Boolean, default: undefined },
  clearLabel: { type: String, default: '取消选择' },
  countTemplate: { type: String, default: '已选择 {count} 项' },
})

const emit = defineEmits<{
  action: [key: string, selectedKeys: (string | number)[]]
  clear: []
}>()

function handleAction(key: string): void {
  emit('action', key, [...props.selectedKeys])
}

function handleClear(): void {
  emit('clear')
}

function formatCount(): string {
  return props.countTemplate.replace('{count}', String(props.selectedCount))
}

const clear = handleClear
const expose: BatchActionBarExpose = { clear }
defineExpose(expose)
</script>

<template>
  <Transition name="r-batch-bar">
    <div
      v-if="selectedCount > 0"
      class="r-batch-action-bar"
      data-testid="batch-action-bar"
      role="toolbar"
      :aria-label="`批量操作：${formatCount()}`"
    >
      <div class="r-batch-action-bar__info">
        <slot name="prefix" />
        <span class="r-batch-action-bar__count" data-testid="batch-count">
          {{ formatCount() }}
        </span>
        <NButton text size="small" data-testid="batch-clear" @click="handleClear">
          {{ clearLabel }}
        </NButton>
      </div>

      <div class="r-batch-action-bar__actions">
        <NSpace size="small">
          <template v-for="action in actions" :key="action.key">
            <!-- Danger action with confirm -->
            <NPopconfirm
              v-if="action.danger && action.confirmMessage"
              @positive-click="handleAction(action.key)"
            >
              <template #trigger>
                <NButton
                  type="error"
                  size="small"
                  :disabled="action.disabled"
                  :data-testid="`batch-action-${action.key}`"
                >
                  <template v-if="action.icon" #icon>
                    <RIcon :name="action.icon" :size="14" />
                  </template>
                  {{ action.label }}
                </NButton>
              </template>
              {{ action.confirmMessage }}
            </NPopconfirm>

            <!-- Normal action -->
            <NButton
              v-else
              :type="action.danger ? 'error' : 'default'"
              size="small"
              :disabled="action.disabled"
              :data-testid="`batch-action-${action.key}`"
              @click="handleAction(action.key)"
            >
              <template v-if="action.icon" #icon>
                <RIcon :name="action.icon" :size="14" />
              </template>
              {{ action.label }}
            </NButton>
          </template>
        </NSpace>

        <slot name="extra" :selected-count="selectedCount" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.r-batch-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ra-spacing-4);
  padding: var(--ra-spacing-2) var(--ra-spacing-4);
  background: var(--ra-color-brand-subtle, #f0f6ff);
  color: var(--ra-color-text-primary);
  border-radius: var(--ra-radius-md);
  border: 1px solid var(--ra-color-brand-light, #d6e4ff);
}
.r-batch-action-bar__info {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
.r-batch-action-bar__count {
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-brand-primary, #2080f0);
}
.r-batch-action-bar__actions {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
.r-batch-bar-enter-active,
.r-batch-bar-leave-active {
  transition: all var(--ra-transition-base);
}
.r-batch-bar-enter-from,
.r-batch-bar-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

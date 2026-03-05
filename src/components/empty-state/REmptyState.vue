<script lang="ts" setup>
import type { EmptyStateSize } from './types'
import { RIcon } from '../icon'
import { NButton } from 'naive-ui'

withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
    actionLabel?: string
    actionType?: 'primary' | 'default'
    size?: EmptyStateSize
  }>(),
  {
    icon: 'inbox',
    title: 'No data',
    description: '',
    actionLabel: '',
    actionType: 'primary',
    size: 'medium',
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="r-empty-state" :class="`r-empty-state--${size}`" data-testid="empty-state">
    <div class="r-empty-state__icon-wrapper">
      <RIcon
        :name="icon"
        :size="size === 'small' ? 'lg' : size === 'large' ? '2xl' : 'xl'"
        color="tertiary"
      />
    </div>

    <h3 v-if="title" class="r-empty-state__title">{{ title }}</h3>

    <p v-if="description" class="r-empty-state__description">{{ description }}</p>

    <div v-if="actionLabel || $slots.actions" class="r-empty-state__actions">
      <slot name="actions">
        <NButton
          v-if="actionLabel"
          :type="actionType"
          data-testid="empty-state-action"
          @click="emit('action')"
        >
          {{ actionLabel }}
        </NButton>
      </slot>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.r-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--ra-spacing-8);
}

.r-empty-state--small {
  padding: var(--ra-spacing-6);
}

.r-empty-state--large {
  padding: var(--ra-spacing-12);
}

.r-empty-state__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: var(--ra-color-bg-muted);
  border-radius: var(--ra-radius-xl);
  margin-bottom: var(--ra-spacing-4);
}

.r-empty-state--small .r-empty-state__icon-wrapper {
  width: 48px;
  height: 48px;
  margin-bottom: var(--ra-spacing-3);
}

.r-empty-state--large .r-empty-state__icon-wrapper {
  width: 80px;
  height: 80px;
  margin-bottom: var(--ra-spacing-5);
}

.r-empty-state__title {
  margin: 0 0 var(--ra-spacing-2);
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
}

.r-empty-state--small .r-empty-state__title {
  font-size: var(--ra-font-size-base);
}

.r-empty-state--large .r-empty-state__title {
  font-size: var(--ra-font-size-xl);
}

.r-empty-state__description {
  margin: 0 0 var(--ra-spacing-4);
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-secondary);
  max-width: 360px;
  line-height: var(--ra-line-height-relaxed);
}

.r-empty-state--small .r-empty-state__description {
  font-size: var(--ra-font-size-xs);
  max-width: 280px;
}

.r-empty-state__actions {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
</style>

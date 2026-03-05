<script lang="ts" setup>
import { computed } from 'vue'
import type { ResultStatus } from './types'
import { RIcon } from '../icon'

const props = withDefaults(
  defineProps<{
    status: ResultStatus
    title?: string
    description?: string
    showIcon?: boolean
  }>(),
  {
    title: '',
    description: '',
    showIcon: true,
  },
)

const statusConfig = computed(() => {
  const configs: Record<ResultStatus, { icon: string; color: string; defaultTitle: string; defaultDesc: string }> = {
    success: {
      icon: 'check-circle-2',
      color: 'success',
      defaultTitle: 'Success',
      defaultDesc: 'Operation completed successfully.',
    },
    error: {
      icon: 'x-circle',
      color: 'danger',
      defaultTitle: 'Error',
      defaultDesc: 'Something went wrong. Please try again.',
    },
    warning: {
      icon: 'alert-triangle',
      color: 'warning',
      defaultTitle: 'Warning',
      defaultDesc: 'Please review the information and proceed with caution.',
    },
    info: {
      icon: 'info',
      color: 'info',
      defaultTitle: 'Information',
      defaultDesc: 'Here is some important information.',
    },
    '403': {
      icon: 'shield',
      color: 'danger',
      defaultTitle: '403 Forbidden',
      defaultDesc: 'You do not have permission to access this resource.',
    },
    '404': {
      icon: 'file-search',
      color: 'warning',
      defaultTitle: '404 Not Found',
      defaultDesc: 'The page you are looking for does not exist.',
    },
    '500': {
      icon: 'alert-circle',
      color: 'danger',
      defaultTitle: '500 Server Error',
      defaultDesc: 'An unexpected error occurred. Please try again later.',
    },
  }
  return configs[props.status]
})

const displayTitle = computed(() => props.title || statusConfig.value.defaultTitle)
const displayDescription = computed(() => props.description || statusConfig.value.defaultDesc)
</script>

<template>
  <div
    class="r-result-state"
    :class="`r-result-state--${statusConfig.color}`"
    data-testid="result-state"
  >
    <div v-if="showIcon" class="r-result-state__icon-wrapper">
      <RIcon :name="statusConfig.icon" size="2xl" />
    </div>

    <h2 class="r-result-state__title">{{ displayTitle }}</h2>

    <p class="r-result-state__description">{{ displayDescription }}</p>

    <div v-if="$slots.actions || $slots.default" class="r-result-state__actions">
      <slot name="actions" />
      <slot />
    </div>

    <div v-if="$slots.extra" class="r-result-state__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.r-result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--ra-spacing-12) var(--ra-spacing-6);
  max-width: 480px;
  margin: 0 auto;
}

.r-result-state__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: var(--ra-radius-full);
  margin-bottom: var(--ra-spacing-5);
}

.r-result-state--success .r-result-state__icon-wrapper {
  background: var(--ra-color-success-bg);
  color: var(--ra-color-success);
}

.r-result-state--danger .r-result-state__icon-wrapper {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger);
}

.r-result-state--warning .r-result-state__icon-wrapper {
  background: var(--ra-color-warning-bg);
  color: var(--ra-color-warning);
}

.r-result-state--info .r-result-state__icon-wrapper {
  background: var(--ra-color-info-bg);
  color: var(--ra-color-info);
}

.r-result-state__title {
  margin: 0 0 var(--ra-spacing-2);
  font-size: var(--ra-font-size-2xl);
  font-weight: var(--ra-font-weight-bold);
  color: var(--ra-color-text-primary);
  letter-spacing: var(--ra-letter-spacing-tight);
}

.r-result-state__description {
  margin: 0 0 var(--ra-spacing-6);
  font-size: var(--ra-font-size-base);
  color: var(--ra-color-text-secondary);
  line-height: var(--ra-line-height-relaxed);
}

.r-result-state__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-3);
  flex-wrap: wrap;
}

.r-result-state__extra {
  margin-top: var(--ra-spacing-6);
  padding-top: var(--ra-spacing-6);
  border-top: 1px solid var(--ra-color-border-light);
  width: 100%;
}
</style>

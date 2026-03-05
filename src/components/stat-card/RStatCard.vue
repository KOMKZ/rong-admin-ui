<script lang="ts" setup>
import { computed } from 'vue'
import type { StatCardTrend, StatCardSize, StatCardVariant, StatCardCompare } from './types'
import { RIcon } from '../icon'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    prefix?: string
    suffix?: string
    trend?: StatCardTrend
    trendValue?: string
    trendLabel?: string
    compare?: StatCardCompare
    icon?: string
    iconColor?: string
    description?: string
    loading?: boolean
    size?: StatCardSize
    variant?: StatCardVariant
    clickable?: boolean
  }>(),
  {
    prefix: '',
    suffix: '',
    trend: undefined,
    trendValue: '',
    trendLabel: '',
    compare: undefined,
    icon: '',
    iconColor: '',
    description: '',
    loading: false,
    size: 'medium',
    variant: 'default',
    clickable: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

const compareResult = computed(() => {
  if (!props.compare) return null
  const { previousValue, currentValue, period, periodLabel } = props.compare
  if (previousValue === 0) {
    return {
      percent: currentValue > 0 ? '+100%' : '0%',
      direction: 'up' as const,
      label: periodLabel ?? periodLabelMap[period],
    }
  }
  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100
  const rounded = Math.abs(change) < 0.01 ? '0%' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  return {
    percent: rounded,
    direction: direction as 'up' | 'down' | 'flat',
    label: periodLabel ?? periodLabelMap[period],
  }
})

const periodLabelMap: Record<string, string> = {
  day: 'vs yesterday',
  week: 'vs last week',
  month: 'vs last month',
  quarter: 'vs last quarter',
  year: 'vs last year',
  custom: '',
}

const effectiveTrend = computed(() => props.trend ?? compareResult.value?.direction)
const effectiveTrendValue = computed(() => props.trendValue || compareResult.value?.percent || '')
const effectiveTrendLabel = computed(() => props.trendLabel || compareResult.value?.label || '')

const trendIcon = computed(() => {
  if (effectiveTrend.value === 'up') return 'trending-up'
  if (effectiveTrend.value === 'down') return 'trending-down'
  return 'minus'
})

const trendClass = computed(() => {
  if (effectiveTrend.value === 'up') return 'r-stat-card__trend--up'
  if (effectiveTrend.value === 'down') return 'r-stat-card__trend--down'
  return 'r-stat-card__trend--flat'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

function handleClick(): void {
  if (props.clickable && !props.loading) {
    emit('click')
  }
}
</script>

<template>
  <div
    class="r-stat-card"
    :class="[
      `r-stat-card--${size}`,
      `r-stat-card--${variant}`,
      { 'r-stat-card--clickable': clickable, 'r-stat-card--loading': loading },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    data-testid="stat-card"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div v-if="loading" class="r-stat-card__skeleton">
      <div class="r-stat-card__skeleton-title" />
      <div class="r-stat-card__skeleton-value" />
      <div class="r-stat-card__skeleton-trend" />
    </div>

    <template v-else>
      <div class="r-stat-card__header">
        <span class="r-stat-card__title">{{ title }}</span>
        <div
          v-if="icon"
          class="r-stat-card__icon"
          :style="iconColor ? { '--stat-icon-color': iconColor } : undefined"
        >
          <RIcon :name="icon" :size="size === 'small' ? 'sm' : 'md'" />
        </div>
      </div>

      <div class="r-stat-card__body">
        <div class="r-stat-card__value-wrapper">
          <span v-if="prefix" class="r-stat-card__prefix">{{ prefix }}</span>
          <span class="r-stat-card__value">{{ formattedValue }}</span>
          <span v-if="suffix" class="r-stat-card__suffix">{{ suffix }}</span>
        </div>

        <div
          v-if="effectiveTrend || effectiveTrendValue"
          class="r-stat-card__trend"
          :class="trendClass"
        >
          <RIcon v-if="effectiveTrend" :name="trendIcon" size="xs" />
          <span v-if="effectiveTrendValue" class="r-stat-card__trend-value">{{
            effectiveTrendValue
          }}</span>
          <span v-if="effectiveTrendLabel" class="r-stat-card__trend-label">{{
            effectiveTrendLabel
          }}</span>
        </div>

        <div v-if="compare" class="r-stat-card__compare" data-testid="stat-card-compare">
          <span class="r-stat-card__compare-prev">
            Previous: {{ compare.previousValue.toLocaleString() }}
          </span>
        </div>
      </div>

      <p v-if="description" class="r-stat-card__description">{{ description }}</p>

      <slot />
    </template>
  </div>
</template>

<style scoped>
.r-stat-card {
  position: relative;
  background: var(--ra-color-bg-surface);
  border-radius: var(--ra-radius-lg);
  padding: var(--ra-spacing-5);
  transition: all var(--ra-transition-fast);
}

.r-stat-card--default {
  border: 1px solid var(--ra-color-border-light);
  box-shadow: var(--ra-shadow-sm);
}

.r-stat-card--outlined {
  border: 1px solid var(--ra-color-border-default);
  box-shadow: none;
}

.r-stat-card--filled {
  border: none;
  background: var(--ra-color-bg-surface-secondary);
}

.r-stat-card--clickable {
  cursor: pointer;
}

.r-stat-card--clickable:hover {
  border-color: var(--ra-color-border-interactive);
  box-shadow: var(--ra-shadow-md);
  transform: translateY(-1px);
}

.r-stat-card--clickable:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}

.r-stat-card--clickable:active {
  transform: translateY(0);
}

.r-stat-card--small {
  padding: var(--ra-spacing-4);
}

.r-stat-card--large {
  padding: var(--ra-spacing-6);
}

.r-stat-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ra-spacing-3);
  margin-bottom: var(--ra-spacing-3);
}

.r-stat-card__title {
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-secondary);
  line-height: var(--ra-line-height-tight);
}

.r-stat-card--small .r-stat-card__title {
  font-size: var(--ra-font-size-xs);
}

.r-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--stat-icon-color, var(--ra-color-brand-subtle));
  color: var(--stat-icon-color, var(--ra-color-brand-primary));
  border-radius: var(--ra-radius-md);
  flex-shrink: 0;
}

.r-stat-card--small .r-stat-card__icon {
  width: 32px;
  height: 32px;
}

.r-stat-card__body {
  display: flex;
  align-items: baseline;
  gap: var(--ra-spacing-3);
  flex-wrap: wrap;
}

.r-stat-card__value-wrapper {
  display: flex;
  align-items: baseline;
  gap: var(--ra-spacing-1);
}

.r-stat-card__prefix,
.r-stat-card__suffix {
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-secondary);
}

.r-stat-card__value {
  font-size: var(--ra-font-size-3xl);
  font-weight: var(--ra-font-weight-bold);
  color: var(--ra-color-text-primary);
  line-height: var(--ra-line-height-none);
  letter-spacing: var(--ra-letter-spacing-tight);
}

.r-stat-card--small .r-stat-card__value {
  font-size: var(--ra-font-size-2xl);
}

.r-stat-card--large .r-stat-card__value {
  font-size: var(--ra-font-size-4xl);
}

.r-stat-card__trend {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  padding: var(--ra-spacing-0-5) var(--ra-spacing-2);
  border-radius: var(--ra-radius-full);
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-medium);
}

.r-stat-card__trend--up {
  background: var(--ra-color-success-bg);
  color: var(--ra-color-success-text);
}

.r-stat-card__trend--down {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger-text);
}

.r-stat-card__trend--flat {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-tertiary);
}

.r-stat-card__trend-label {
  color: var(--ra-color-text-tertiary);
  font-weight: var(--ra-font-weight-normal);
}

.r-stat-card__compare {
  margin-top: var(--ra-spacing-2);
  padding-top: var(--ra-spacing-2);
  border-top: 1px solid var(--ra-color-border-light);
}

.r-stat-card__compare-prev {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-quaternary);
}

.r-stat-card__description {
  margin: var(--ra-spacing-3) 0 0;
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-tertiary);
  line-height: var(--ra-line-height-relaxed);
}

.r-stat-card__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
}

.r-stat-card__skeleton-title,
.r-stat-card__skeleton-value,
.r-stat-card__skeleton-trend {
  background: linear-gradient(
    90deg,
    var(--ra-color-bg-muted) 25%,
    var(--ra-color-bg-surface-secondary) 50%,
    var(--ra-color-bg-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--ra-radius-sm);
}

.r-stat-card__skeleton-title {
  width: 60%;
  height: 16px;
}

.r-stat-card__skeleton-value {
  width: 80%;
  height: 32px;
}

.r-stat-card__skeleton-trend {
  width: 40%;
  height: 20px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>

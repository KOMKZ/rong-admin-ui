<script lang="ts" setup>
import type { PropType } from 'vue'
import type { QualityPanelItem } from './types'

defineProps({
  title: { type: String, default: 'Quality Gates' },
  items: { type: Array as PropType<QualityPanelItem[]>, required: true },
})

function statusIcon(s: QualityPanelItem['status']): string {
  const map: Record<string, string> = {
    pass: '\u2713',
    fail: '\u2717',
    warn: '!',
    skip: '-',
  }
  return map[s] ?? '?'
}
</script>

<template>
  <section class="r-quality" data-testid="quality-panel">
    <h3 class="r-quality__title">{{ title }}</h3>
    <ul class="r-quality__list" role="list">
      <li
        v-for="item in items"
        :key="item.label"
        class="r-quality__item"
        :class="`r-quality__item--${item.status}`"
      >
        <span class="r-quality__icon" :aria-label="item.status">{{ statusIcon(item.status) }}</span>
        <span class="r-quality__label">{{ item.label }}</span>
        <span v-if="item.detail" class="r-quality__detail">{{ item.detail }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.r-quality {
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  overflow: hidden;
}
.r-quality__title {
  font-size: var(--ra-font-size-base);
  font-weight: 600;
  color: var(--ra-color-text-primary);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  margin: 0;
  background: var(--ra-color-bg-muted);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-quality__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.r-quality__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px var(--ra-spacing-4);
  border-bottom: 1px solid var(--ra-color-border-light);
  font-size: var(--ra-font-size-sm);
}
.r-quality__item:last-child {
  border-bottom: none;
}
.r-quality__icon {
  width: 22px;
  height: 22px;
  border-radius: var(--ra-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ra-font-size-xs);
  font-weight: 700;
  flex-shrink: 0;
}
.r-quality__item--pass .r-quality__icon {
  background: var(--ra-color-success-bg);
  color: var(--ra-color-success);
}
.r-quality__item--fail .r-quality__icon {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger);
}
.r-quality__item--warn .r-quality__icon {
  background: var(--ra-color-warning-bg);
  color: var(--ra-color-warning);
}
.r-quality__item--skip .r-quality__icon {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-tertiary);
}
.r-quality__label {
  font-weight: 500;
  color: var(--ra-color-text-primary);
}
.r-quality__detail {
  margin-left: auto;
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-secondary);
  font-family: var(--ra-font-family-mono);
}
</style>

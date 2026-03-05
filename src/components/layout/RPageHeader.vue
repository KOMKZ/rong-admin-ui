<script lang="ts" setup>
import type { PropType } from 'vue'
import { RIcon } from '../icon'
import type { BreadcrumbItem } from '../../app-layout/types'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  breadcrumbs: { type: Array as PropType<BreadcrumbItem[]>, default: () => [] },
  backUrl: { type: String, default: '' },
  status: { type: String as PropType<'draft' | 'active' | 'archived' | 'error' | ''>, default: '' },
  statusLabel: { type: String, default: '' },
  sticky: { type: Boolean, default: false },
})

const emit = defineEmits<{
  back: []
  navigate: [path: string]
}>()

const statusConfig = {
  draft: { color: 'warning', icon: 'edit' },
  active: { color: 'success', icon: 'check-circle' },
  archived: { color: 'secondary', icon: 'archive' },
  error: { color: 'danger', icon: 'alert-circle' },
}
</script>

<template>
  <header
    class="r-page-header"
    :class="{ 'r-page-header--sticky': sticky }"
    data-testid="page-header"
  >
    <div class="r-page-header__top">
      <nav v-if="breadcrumbs.length > 0" class="r-page-header__breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li v-for="(item, index) in breadcrumbs" :key="index">
            <RIcon v-if="index > 0" name="chevron-right" size="xs" class="r-page-header__breadcrumb-sep" />
            <a
              v-if="item.path && index < breadcrumbs.length - 1"
              :href="item.path"
              class="r-page-header__breadcrumb-link"
              @click.prevent="emit('navigate', item.path!)"
            >
              {{ item.label }}
            </a>
            <span v-else class="r-page-header__breadcrumb-current">
              {{ item.label }}
            </span>
          </li>
        </ol>
      </nav>
    </div>

    <div class="r-page-header__main">
      <div class="r-page-header__content">
        <button
          v-if="backUrl"
          class="r-page-header__back"
          aria-label="Go back"
          @click="emit('back')"
        >
          <RIcon name="arrow-left" size="sm" />
        </button>

        <div class="r-page-header__text">
          <div class="r-page-header__title-row">
            <h1 class="r-page-header__title">{{ title }}</h1>
            <span
              v-if="status && statusConfig[status]"
              class="r-page-header__status"
              :class="`r-page-header__status--${statusConfig[status].color}`"
            >
              <RIcon :name="statusConfig[status].icon" size="xs" />
              {{ statusLabel || status }}
            </span>
          </div>
          <p v-if="description" class="r-page-header__description">{{ description }}</p>
        </div>
      </div>

      <div class="r-page-header__actions">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.tabs" class="r-page-header__tabs">
      <slot name="tabs" />
    </div>
  </header>
</template>

<style scoped>
.r-page-header {
  background: var(--ra-color-bg-surface);
  padding: var(--ra-spacing-4) var(--ra-spacing-6);
  border-bottom: 1px solid var(--ra-color-border-light);
}

.r-page-header--sticky {
  position: sticky;
  top: 0;
  z-index: var(--ra-z-sticky);
  backdrop-filter: blur(8px);
  background: var(--ra-color-bg-elevated-soft);
}

.r-page-header__top {
  margin-bottom: var(--ra-spacing-2);
}

.r-page-header__breadcrumb ol {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.r-page-header__breadcrumb-sep {
  color: var(--ra-color-text-quaternary);
}

.r-page-header__breadcrumb-link {
  color: var(--ra-color-text-tertiary);
  text-decoration: none;
  font-size: var(--ra-font-size-sm);
  transition: color var(--ra-transition-fast);
}

.r-page-header__breadcrumb-link:hover {
  color: var(--ra-color-text-link-hover);
}

.r-page-header__breadcrumb-current {
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-sm);
}

.r-page-header__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ra-spacing-4);
}

.r-page-header__content {
  display: flex;
  align-items: flex-start;
  gap: var(--ra-spacing-3);
  min-width: 0;
}

.r-page-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-top: var(--ra-spacing-0-5);
  background: transparent;
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-md);
  cursor: pointer;
  color: var(--ra-color-text-secondary);
  transition: all var(--ra-transition-fast);
  flex-shrink: 0;
}

.r-page-header__back:hover {
  background: var(--ra-color-bg-hover);
  border-color: var(--ra-color-border-default);
  color: var(--ra-color-text-primary);
}

.r-page-header__back:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}

.r-page-header__text {
  min-width: 0;
}

.r-page-header__title-row {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  flex-wrap: wrap;
}

.r-page-header__title {
  font-size: var(--ra-font-size-2xl);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
  line-height: var(--ra-line-height-tight);
  margin: 0;
  letter-spacing: var(--ra-letter-spacing-tight);
}

.r-page-header__status {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-medium);
  border-radius: var(--ra-radius-full);
  text-transform: capitalize;
}

.r-page-header__status--success {
  background: var(--ra-color-success-bg);
  color: var(--ra-color-success-text);
}

.r-page-header__status--warning {
  background: var(--ra-color-warning-bg);
  color: var(--ra-color-warning-text);
}

.r-page-header__status--danger {
  background: var(--ra-color-danger-bg);
  color: var(--ra-color-danger-text);
}

.r-page-header__status--secondary {
  background: var(--ra-color-bg-muted);
  color: var(--ra-color-text-tertiary);
}

.r-page-header__description {
  margin: var(--ra-spacing-1) 0 0;
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-secondary);
  line-height: var(--ra-line-height-relaxed);
}

.r-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  flex-shrink: 0;
}

.r-page-header__tabs {
  margin-top: var(--ra-spacing-4);
  margin-left: calc(-1 * var(--ra-spacing-6));
  margin-right: calc(-1 * var(--ra-spacing-6));
  margin-bottom: calc(-1 * var(--ra-spacing-4));
  padding: 0 var(--ra-spacing-6);
  border-top: 1px solid var(--ra-color-border-light);
}

@media (max-width: 768px) {
  .r-page-header {
    padding: var(--ra-spacing-3) var(--ra-spacing-4);
  }

  .r-page-header__main {
    flex-direction: column;
    gap: var(--ra-spacing-3);
  }

  .r-page-header__title {
    font-size: var(--ra-font-size-xl);
  }

  .r-page-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

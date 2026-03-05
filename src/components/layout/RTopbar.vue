<script lang="ts" setup>
import type { PropType } from 'vue'
import type { BreadcrumbItem } from '../../app-layout/types'
import { RIcon } from '../icon'

defineProps({
  title: { type: String, default: '' },
  logo: { type: String, default: '' },
  breadcrumbs: { type: Array as PropType<BreadcrumbItem[]>, default: () => [] },
  showBreadcrumb: { type: Boolean, default: true },
  height: { type: Number, default: 56 },
  showMenuButton: { type: Boolean, default: true },
})

const emit = defineEmits<{
  'toggle-sidebar': []
  navigate: [path: string]
  search: []
}>()
</script>

<template>
  <header class="r-topbar" :style="{ height: `${height}px` }" data-testid="topbar" role="banner">
    <div class="r-topbar__left">
      <button
        v-if="showMenuButton"
        class="r-topbar__menu-btn"
        aria-label="Toggle sidebar"
        data-testid="topbar-menu-btn"
        @click="emit('toggle-sidebar')"
      >
        <RIcon name="menu" size="sm" />
      </button>

      <nav
        v-if="showBreadcrumb && breadcrumbs.length > 0"
        class="r-topbar__breadcrumb"
        aria-label="Breadcrumb"
      >
        <ol>
          <li v-for="(item, index) in breadcrumbs" :key="index">
            <RIcon
              v-if="index > 0"
              name="chevron-right"
              size="xs"
              class="r-topbar__breadcrumb-sep"
            />
            <a
              v-if="item.path && index < breadcrumbs.length - 1"
              :href="item.path"
              class="r-topbar__breadcrumb-link"
              @click.prevent="emit('navigate', item.path!)"
            >
              {{ item.label }}
            </a>
            <span
              v-else
              class="r-topbar__breadcrumb-current"
              :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
            >
              {{ item.label }}
            </span>
          </li>
        </ol>
      </nav>

      <slot name="left" />
    </div>

    <div class="r-topbar__center">
      <slot name="search">
        <button class="r-topbar__search-btn" aria-label="Search" @click="emit('search')">
          <RIcon name="search" size="sm" />
          <span class="r-topbar__search-text">Search...</span>
          <kbd class="r-topbar__search-kbd">⌘K</kbd>
        </button>
      </slot>
    </div>

    <div class="r-topbar__right">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.r-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ra-spacing-4);
  padding: 0 var(--ra-spacing-5);
  background: var(--ra-color-bg-surface);
  border-bottom: 1px solid var(--ra-color-border-light);
  flex-shrink: 0;
}

.r-topbar__left {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  flex-shrink: 0;
}

.r-topbar__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 480px;
  margin: 0 auto;
}

.r-topbar__right {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  flex-shrink: 0;
}

.r-topbar__menu-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--ra-radius-md);
  cursor: pointer;
  color: var(--ra-color-text-secondary);
  transition: all var(--ra-transition-fast);
}

.r-topbar__menu-btn:hover {
  background: var(--ra-color-bg-hover);
  color: var(--ra-color-text-primary);
}

.r-topbar__menu-btn:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}

.r-topbar__search-btn {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  width: 100%;
  min-width: 200px;
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  background: var(--ra-color-bg-surface-secondary);
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-lg);
  cursor: pointer;
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-sm);
  transition: all var(--ra-transition-fast);
}

.r-topbar__search-btn:hover {
  background: var(--ra-color-bg-hover);
  border-color: var(--ra-color-border-default);
}

.r-topbar__search-btn:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
}

.r-topbar__search-text {
  flex: 1;
  text-align: left;
}

.r-topbar__search-kbd {
  padding: var(--ra-spacing-0-5) var(--ra-spacing-1-5);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  font-family: var(--ra-font-family-mono);
  font-size: var(--ra-font-size-2xs);
  color: var(--ra-color-text-quaternary);
}

.r-topbar__breadcrumb ol {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.r-topbar__breadcrumb-sep {
  color: var(--ra-color-text-quaternary);
}

.r-topbar__breadcrumb-link {
  color: var(--ra-color-text-tertiary);
  text-decoration: none;
  font-size: var(--ra-font-size-sm);
  transition: color var(--ra-transition-fast);
}

.r-topbar__breadcrumb-link:hover {
  color: var(--ra-color-text-link-hover);
}

.r-topbar__breadcrumb-current {
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
}

@media (max-width: 768px) {
  .r-topbar__center {
    display: none;
  }

  .r-topbar__search-text,
  .r-topbar__search-kbd {
    display: none;
  }
}
</style>

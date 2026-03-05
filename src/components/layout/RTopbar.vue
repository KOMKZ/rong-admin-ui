<script lang="ts" setup>
import type { PropType } from 'vue'
import type { BreadcrumbItem } from '../../app-layout/types'

defineProps({
  title: { type: String, default: '' },
  logo: { type: String, default: '' },
  breadcrumbs: { type: Array as PropType<BreadcrumbItem[]>, default: () => [] },
  showBreadcrumb: { type: Boolean, default: true },
  height: { type: Number, default: 56 },
})

const emit = defineEmits<{
  'toggle-sidebar': []
  navigate: [path: string]
}>()
</script>

<template>
  <header
    class="r-topbar"
    :style="{ height: `${height}px` }"
    data-testid="topbar"
    role="banner"
  >
    <div class="r-topbar__left">
      <button
        class="r-topbar__menu-btn"
        aria-label="Toggle sidebar"
        @click="emit('toggle-sidebar')"
      >
        <span class="r-topbar__hamburger">&#9776;</span>
      </button>

      <nav v-if="showBreadcrumb && breadcrumbs.length > 0" class="r-topbar__breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li v-for="(item, index) in breadcrumbs" :key="index">
            <span v-if="index > 0" class="r-topbar__breadcrumb-sep">/</span>
            <a
              v-if="item.path && index < breadcrumbs.length - 1"
              :href="item.path"
              class="r-topbar__breadcrumb-link"
              @click.prevent="emit('navigate', item.path!)"
            >
              {{ item.label }}
            </a>
            <span v-else class="r-topbar__breadcrumb-current" :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
              {{ item.label }}
            </span>
          </li>
        </ol>
      </nav>
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
  padding: 0 var(--ra-spacing-4);
  background: var(--ra-color-bg-surface);
  border-bottom: 1px solid var(--ra-color-border-default);
  flex-shrink: 0;
}
.r-topbar__left {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}
.r-topbar__menu-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--ra-radius-sm);
  cursor: pointer;
  color: var(--ra-color-text-secondary);
  font-size: 18px;
  transition: all var(--ra-transition-fast);
}
.r-topbar__menu-btn:hover {
  background: var(--ra-color-bg-muted);
  border-color: var(--ra-color-border-default);
}
.r-topbar__menu-btn:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
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
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}
.r-topbar__breadcrumb-link {
  color: var(--ra-color-text-secondary);
  text-decoration: none;
  font-size: var(--ra-font-size-sm);
  transition: color var(--ra-transition-fast);
}
.r-topbar__breadcrumb-link:hover {
  color: var(--ra-color-brand-primary);
}
.r-topbar__breadcrumb-current {
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-weight: 500;
}
.r-topbar__right {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
}
</style>

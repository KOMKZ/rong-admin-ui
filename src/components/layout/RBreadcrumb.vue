<script lang="ts" setup>
import type { PropType } from 'vue'
import type { BreadcrumbItem } from '../../app-layout/types'

defineProps({
  items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
})

const emit = defineEmits<{
  navigate: [path: string]
}>()
</script>

<template>
  <nav class="r-breadcrumb" aria-label="Breadcrumb" data-testid="breadcrumb">
    <ol>
      <li v-for="(item, index) in items" :key="index">
        <span v-if="index > 0" class="r-breadcrumb__sep" aria-hidden="true">/</span>
        <a
          v-if="item.path && index < items.length - 1"
          :href="item.path"
          class="r-breadcrumb__link"
          @click.prevent="emit('navigate', item.path!)"
        >
          {{ item.label }}
        </a>
        <span
          v-else
          class="r-breadcrumb__current"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.r-breadcrumb ol {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  list-style: none;
  margin: 0;
  padding: 0;
}
.r-breadcrumb__sep {
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
  user-select: none;
}
.r-breadcrumb__link {
  color: var(--ra-color-text-secondary);
  text-decoration: none;
  font-size: var(--ra-font-size-sm);
  transition: color var(--ra-transition-fast);
}
.r-breadcrumb__link:hover {
  color: var(--ra-color-brand-primary);
}
.r-breadcrumb__link:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
  border-radius: 2px;
}
.r-breadcrumb__current {
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-weight: 500;
}
</style>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  collapsed: { type: Boolean, default: false },
})

const isCollapsed = ref(props.collapsed)
</script>

<template>
  <section class="r-demo" data-testid="demo-section">
    <div class="r-demo__header" role="heading" aria-level="2">
      <button
        class="r-demo__toggle"
        :aria-expanded="!isCollapsed"
        @click="isCollapsed = !isCollapsed"
      >
        <span class="r-demo__arrow" :class="{ collapsed: isCollapsed }">&#9662;</span>
        <span class="r-demo__title">{{ title }}</span>
      </button>
      <span v-if="description" class="r-demo__desc">{{ description }}</span>
    </div>
    <div v-show="!isCollapsed" class="r-demo__body">
      <div class="r-demo__preview">
        <slot />
      </div>
      <div v-if="$slots.code" class="r-demo__code">
        <slot name="code" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.r-demo {
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  overflow: hidden;
}
.r-demo__header {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  background: var(--ra-color-bg-muted);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-demo__toggle {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: var(--ra-color-text-primary);
}
.r-demo__toggle:focus-visible {
  outline: 2px solid var(--ra-color-focus-ring);
  outline-offset: 2px;
  border-radius: 3px;
}
.r-demo__arrow {
  display: inline-block;
  font-size: 10px;
  transition: transform var(--ra-transition-fast);
  color: var(--ra-color-text-tertiary);
}
.r-demo__arrow.collapsed {
  transform: rotate(-90deg);
}
.r-demo__title {
  font-size: var(--ra-font-size-base);
  font-weight: 600;
}
.r-demo__desc {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-secondary);
}
.r-demo__body {
  padding: 0;
}
.r-demo__preview {
  padding: var(--ra-spacing-5) var(--ra-spacing-4);
}
.r-demo__code {
  border-top: 1px solid var(--ra-color-border-default);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  background: var(--ra-color-bg-code);
  font-size: var(--ra-font-size-xs);
}
</style>

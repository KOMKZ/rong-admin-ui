<script lang="ts" setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  version: { type: String, default: undefined },
  componentName: { type: String, default: undefined },
})
</script>

<template>
  <article class="r-showcase" data-testid="showcase-layout">
    <header class="r-showcase__header">
      <div class="r-showcase__title-row">
        <h1 class="r-showcase__title">{{ title }}</h1>
        <span v-if="version" class="r-showcase__version">{{ version }}</span>
      </div>
      <p v-if="description" class="r-showcase__desc">{{ description }}</p>
      <code v-if="componentName" class="r-showcase__import">
        import { {{ componentName }} } from '@rong/admin-ui'
      </code>
    </header>

    <div class="r-showcase__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="r-showcase__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.r-showcase {
  max-width: 960px;
  font-family: var(--ra-font-family-body);
}
.r-showcase__header {
  margin-bottom: var(--ra-spacing-6);
  padding-bottom: var(--ra-spacing-4);
  border-bottom: 1px solid var(--ra-color-border-default);
}
.r-showcase__title-row {
  display: flex;
  align-items: baseline;
  gap: var(--ra-spacing-3);
}
.r-showcase__title {
  font-size: var(--ra-font-size-2xl);
  font-weight: 700;
  color: var(--ra-color-text-primary);
  margin: 0;
  line-height: var(--ra-line-height-tight);
}
.r-showcase__version {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
  background: var(--ra-color-bg-muted);
  padding: 2px var(--ra-spacing-2);
  border-radius: var(--ra-radius-sm);
  font-family: var(--ra-font-family-mono);
}
.r-showcase__desc {
  font-size: var(--ra-font-size-base);
  color: var(--ra-color-text-secondary);
  line-height: var(--ra-line-height-base);
  margin: var(--ra-spacing-2) 0 0;
}
.r-showcase__import {
  display: inline-block;
  margin-top: 10px;
  font-size: var(--ra-font-size-xs);
  background: var(--ra-color-bg-code);
  color: var(--ra-color-text-code);
  padding: var(--ra-spacing-1) 10px;
  border-radius: var(--ra-radius-sm);
  border: 1px solid var(--ra-color-border-default);
}
.r-showcase__body {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-5);
}
.r-showcase__footer {
  margin-top: var(--ra-spacing-8);
  padding-top: var(--ra-spacing-4);
  border-top: 1px solid var(--ra-color-border-default);
}
</style>

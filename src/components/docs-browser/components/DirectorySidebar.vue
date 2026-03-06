<template>
  <nav class="r-docs-dir-sidebar" data-testid="docs-dir-sidebar" role="navigation" aria-label="文档目录">
    <div class="r-docs-dir-header">
      <span class="r-docs-dir-title">{{ title }}</span>
      <span class="r-docs-dir-count">{{ totalCount }}</span>
    </div>
    <div class="r-docs-dir-list">
      <button
        v-for="dir in directories"
        :key="dir.name"
        class="r-docs-dir-item"
        :class="{ 'is-active': activeDir === dir.name }"
        :data-testid="`docs-dir-${dir.name}`"
        @click="$emit('select', dir.name)"
        @keydown.enter="$emit('select', dir.name)"
      >
        <span class="r-docs-dir-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span class="r-docs-dir-name">{{ dir.name }}</span>
        <span class="r-docs-dir-badge" v-if="fileCounts[dir.name]">{{ fileCounts[dir.name] }}</span>
      </button>
      <button
        class="r-docs-dir-item r-docs-dir-all"
        :class="{ 'is-active': !activeDir }"
        data-testid="docs-dir-all"
        @click="$emit('select', '')"
        @keydown.enter="$emit('select', '')"
      >
        <span class="r-docs-dir-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </span>
        <span class="r-docs-dir-name">全部</span>
        <span class="r-docs-dir-badge">{{ totalCount }}</span>
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import type { DocDirectory } from '../types'

defineProps<{
  directories: DocDirectory[]
  activeDir: string
  fileCounts: Record<string, number>
  totalCount: number
  title?: string
}>()

defineEmits<{
  (e: 'select', dir: string): void
}>()
</script>

<style>
.r-docs-dir-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1, 4px);
  padding: var(--ra-spacing-3, 12px);
  background: var(--ra-color-surface-secondary, #fafbfc);
  height: 100%;
  overflow-y: auto;
}

.r-docs-dir-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-3, 12px);
  margin-bottom: var(--ra-spacing-1, 4px);
}

.r-docs-dir-title {
  font-size: var(--ra-font-size-xs, 11px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-dir-count {
  font-size: var(--ra-font-size-xs, 11px);
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-dir-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.r-docs-dir-item {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-3, 12px);
  border: none;
  border-radius: var(--ra-radius-md, 6px);
  background: transparent;
  color: var(--ra-color-text-secondary, #6b7280);
  cursor: pointer;
  font-size: var(--ra-font-size-sm, 13px);
  line-height: 1.4;
  text-align: left;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.r-docs-dir-item:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-dir-item.is-active {
  background: var(--ra-color-primary-subtle, #eff6ff);
  color: var(--ra-color-primary, #2563eb);
  font-weight: 500;
}

.r-docs-dir-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.6;
}

.r-docs-dir-item.is-active .r-docs-dir-icon {
  opacity: 1;
  color: var(--ra-color-primary, #2563eb);
}

.r-docs-dir-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-docs-dir-badge {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  border-radius: 10px;
  background: var(--ra-color-surface-tertiary, #e5e7eb);
  color: var(--ra-color-text-tertiary, #6b7280);
  padding: 0 6px;
}

.r-docs-dir-item.is-active .r-docs-dir-badge {
  background: var(--ra-color-primary, #2563eb);
  color: #fff;
}
</style>

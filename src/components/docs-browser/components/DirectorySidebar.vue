<template>
  <nav
    class="r-docs-dir-sidebar"
    data-testid="docs-dir-sidebar"
    role="navigation"
    aria-label="文档目录"
  >
    <div class="r-docs-dir-header">
      <span class="r-docs-dir-title">{{ title }}</span>
      <span class="r-docs-dir-count">{{ totalCount }}</span>
    </div>
    <div class="r-docs-dir-search">
      <svg class="r-docs-dir-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input v-model="searchQuery" class="r-docs-dir-search-input" placeholder="搜索目录..." data-testid="docs-dir-search" />
    </div>
    <div class="r-docs-dir-list">
      <button
        class="r-docs-dir-item r-docs-dir-all"
        :class="{ 'is-active': !activeDir }"
        data-testid="docs-dir-all"
        @click="$emit('select', '')"
      >
        <span class="r-docs-dir-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </span>
        <span class="r-docs-dir-name">全部</span>
        <span class="r-docs-dir-badge">{{ totalCount }}</span>
      </button>

      <DirectoryTreeNode
        v-for="dir in filteredDirectories"
        :key="buildScopeKey(dir)"
        :node="dir"
        :level="0"
        :active-dir="activeDir"
        :expanded-keys="props.expandedKeys"
        :build-scope-key="buildScopeKey"
        :force-expanded="isSearching"
        :highlight-keyword="normalizedSearchQuery"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { DocDirectory } from '../types'
import DirectoryTreeNode from './DirectoryTreeNode.vue'

const props = defineProps<{
  directories: DocDirectory[]
  activeDir: string
  totalCount: number
  title?: string
  expandedKeys: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', dir: string): void
  (e: 'toggle', dir: string): void
}>()

const searchQuery = ref('')

const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase())
const isSearching = computed(() => normalizedSearchQuery.value.length > 0)
const filteredDirectories = computed(() => filterDirectories(props.directories, normalizedSearchQuery.value))

function buildScopeKey(dir: DocDirectory): string {
  return dir.path ? `${dir.directory}::${dir.path}` : dir.directory
}

function filterDirectories(nodes: DocDirectory[], keyword: string): DocDirectory[] {
  if (!keyword) {
    return nodes
  }

  const result: DocDirectory[] = []
  for (const node of nodes) {
    const matchedChildren = filterDirectories(node.children ?? [], keyword)
    const matchedSelf = node.name.toLowerCase().includes(keyword)
    if (!matchedSelf && matchedChildren.length === 0) {
      continue
    }
    result.push({
      ...node,
      children: matchedChildren,
    })
  }
  return result
}
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

.r-docs-dir-title,
.r-docs-dir-count {
  font-size: var(--ra-font-size-xs, 11px);
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-dir-title {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.r-docs-dir-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  padding: 8px 12px;
  border: 1px solid var(--ra-color-border-secondary, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-surface-primary, #fff);
}

.r-docs-dir-search-icon {
  flex-shrink: 0;
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-dir-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ra-color-text-primary, #111827);
  font-size: var(--ra-font-size-sm, 13px);
}

.r-docs-dir-search-input::placeholder {
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-dir-list,
.r-docs-dir-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.r-docs-dir-item {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-3, 12px);
  border-radius: var(--ra-radius-md, 6px);
  background: transparent;
  color: var(--ra-color-text-secondary, #6b7280);
  font-size: var(--ra-font-size-sm, 13px);
  line-height: 1.4;
  transition: all 0.15s ease;
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

.r-docs-dir-toggle,
.r-docs-dir-select {
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
}

.r-docs-dir-toggle {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.r-docs-dir-toggle--placeholder {
  cursor: default;
}

.r-docs-dir-select {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  flex: 1;
  min-width: 0;
  cursor: pointer;
  text-align: left;
}

.r-docs-dir-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.6;
}

.r-docs-dir-item.is-active .r-docs-dir-icon {
  opacity: 1;
}

.r-docs-dir-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-docs-dir-highlight {
  padding: 0 1px;
  border-radius: 3px;
  background: rgba(59, 130, 246, 0.18);
  color: inherit;
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

.r-docs-dir-all {
  margin-bottom: 4px;
}
</style>

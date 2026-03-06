<template>
  <div class="r-docs-file-list" data-testid="docs-file-list">
    <div class="r-docs-file-toolbar">
      <div class="r-docs-file-search">
        <svg class="r-docs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchQuery"
          class="r-docs-search-input"
          placeholder="搜索文件..."
          data-testid="docs-search"
        />
      </div>
      <button
        class="r-docs-sort-btn"
        :title="sortOrder === 'desc' ? '最新在前' : '最旧在前'"
        data-testid="docs-sort-toggle"
        @click="$emit('toggle-sort')"
      >
        <svg v-if="sortOrder === 'desc'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h13M3 8h9M3 12h5M17 14V4M13 10l4 4 4-4"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h13M3 8h9M3 12h5M17 4v10M13 10l4-4 4 4"/></svg>
      </button>
    </div>

    <div class="r-docs-file-items" v-if="filteredFiles.length > 0">
      <button
        v-for="file in filteredFiles"
        :key="`${file.directory}:${file.path}`"
        class="r-docs-file-item"
        :class="{ 'is-active': isSelected(file) }"
        :data-testid="`docs-file-${file.name}`"
        @click="$emit('select', file)"
      >
        <svg class="r-docs-file-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="file.name.endsWith('.md')" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline v-if="file.name.endsWith('.md')" points="14 2 14 8 20 8" />
          <path v-else d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline v-if="!file.name.endsWith('.md')" points="13 2 13 9 20 9" />
        </svg>
        <div class="r-docs-file-info">
          <span class="r-docs-file-name">{{ file.title || file.name }}</span>
          <span class="r-docs-file-meta">
            <span v-if="activeDir === ''" class="r-docs-file-dir">{{ file.directory }}</span>
            <span>{{ formatSize(file.size) }}</span>
          </span>
        </div>
      </button>
    </div>

    <div v-else-if="loading" class="r-docs-file-loading">
      <div class="r-docs-skeleton" v-for="i in 5" :key="i"></div>
    </div>

    <div v-else class="r-docs-file-empty" data-testid="docs-file-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
      <span>暂无文件</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { DocFileItem, DocSortOrder } from '../types'

const props = defineProps<{
  files: DocFileItem[]
  selectedFile: DocFileItem | null
  sortOrder: DocSortOrder
  activeDir: string
  loading: boolean
}>()

defineEmits<{
  (e: 'select', file: DocFileItem): void
  (e: 'toggle-sort'): void
}>()

const searchQuery = ref('')

const filteredFiles = computed(() => {
  if (!searchQuery.value) return props.files
  const q = searchQuery.value.toLowerCase()
  return props.files.filter(f =>
    f.name.toLowerCase().includes(q) ||
    (f.title && f.title.toLowerCase().includes(q))
  )
})

function isSelected(file: DocFileItem): boolean {
  if (!props.selectedFile) return false
  return props.selectedFile.path === file.path && props.selectedFile.directory === file.directory
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
</script>

<style>
.r-docs-file-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--ra-color-surface, #ffffff);
}

.r-docs-file-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  padding: var(--ra-spacing-3, 12px);
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
}

.r-docs-file-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  padding: 6px 10px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-surface-secondary, #fafbfc);
  transition: border-color 0.15s ease;
}

.r-docs-file-search:focus-within {
  border-color: var(--ra-color-primary, #2563eb);
  box-shadow: 0 0 0 2px var(--ra-color-primary-subtle, rgba(37, 99, 235, 0.1));
}

.r-docs-search-icon {
  flex-shrink: 0;
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-primary, #111827);
  outline: none;
}

.r-docs-search-input::placeholder {
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-surface, #ffffff);
  color: var(--ra-color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.r-docs-sort-btn:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-file-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--ra-spacing-2, 8px);
}

.r-docs-file-item {
  display: flex;
  align-items: flex-start;
  gap: var(--ra-spacing-2, 8px);
  width: 100%;
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-3, 12px);
  border: none;
  border-radius: var(--ra-radius-md, 6px);
  background: transparent;
  color: var(--ra-color-text-primary, #111827);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.r-docs-file-item:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
}

.r-docs-file-item.is-active {
  background: var(--ra-color-primary-subtle, #eff6ff);
}

.r-docs-file-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-file-item.is-active .r-docs-file-icon {
  color: var(--ra-color-primary, #2563eb);
}

.r-docs-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.r-docs-file-name {
  font-size: var(--ra-font-size-sm, 13px);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-docs-file-meta {
  display: flex;
  gap: var(--ra-spacing-2, 8px);
  font-size: 11px;
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-file-dir {
  padding: 0 4px;
  border-radius: 3px;
  background: var(--ra-color-surface-tertiary, #e5e7eb);
}

.r-docs-file-loading {
  padding: var(--ra-spacing-3, 12px);
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2, 8px);
}

.r-docs-skeleton {
  height: 36px;
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-surface-secondary, #f3f4f6);
  animation: r-docs-pulse 1.5s ease-in-out infinite;
}

@keyframes r-docs-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.r-docs-file-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-3, 12px);
  color: var(--ra-color-text-tertiary, #9ca3af);
  font-size: var(--ra-font-size-sm, 13px);
}
</style>

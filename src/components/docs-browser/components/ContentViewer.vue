<template>
  <div class="r-docs-content" data-testid="docs-content-viewer">
    <!-- 内容头部 -->
    <div v-if="fileContent" class="r-docs-content-header">
      <div class="r-docs-content-path-wrap">
        <div class="r-docs-content-breadcrumb">
          <span class="r-docs-breadcrumb-dir">{{ selectedFile?.directory }}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span class="r-docs-breadcrumb-file">{{ fileContent.name }}</span>
        </div>
        <div class="r-docs-content-full-path" :title="fullPath">{{ fullPath }}</div>
      </div>
      <div class="r-docs-content-actions">
        <span v-if="cached" class="r-docs-cached-badge" data-testid="docs-cached-badge"
          >已缓存</span
        >
        <span class="r-docs-content-size">{{ formatSize(fileContent.size) }}</span>
        <button
          class="r-docs-action-btn r-docs-action-btn--with-label"
          title="定位当前文件"
          data-testid="docs-locate-file"
          @click="$emit('locate-file')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>定位文件</span>
        </button>
        <button
          class="r-docs-action-btn r-docs-action-btn--with-label"
          title="复制完整路径"
          data-testid="docs-copy-path"
          @click="$emit('copy-path', fullPath)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>复制路径</span>
        </button>
        <button
          v-if="enableToc && isMarkdown"
          class="r-docs-action-btn"
          :class="{ 'is-active': tocVisible }"
          title="目录"
          data-testid="docs-toc-toggle"
          @click="$emit('toggle-toc')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button
          v-if="enableFullscreen"
          class="r-docs-action-btn"
          :title="fullscreen ? '退出全屏' : '全屏'"
          data-testid="docs-fullscreen-toggle"
          @click="$emit('toggle-fullscreen')"
        >
          <svg
            v-if="!fullscreen"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            />
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 14h6v6m10-10h-6V4M14 10l7-7M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 内容主体 -->
    <div class="r-docs-content-body" v-if="fileContent">
      <RMarkdownPreview
        v-if="isMarkdown"
        :content="fileContent.content"
        class="r-docs-md-preview"
      />
      <pre v-else class="r-docs-code-preview"><code>{{ fileContent.content }}</code></pre>
    </div>

    <!-- 加载态 -->
    <div v-else-if="loading" class="r-docs-content-loading">
      <div class="r-docs-content-skeleton-bar" style="width: 60%"></div>
      <div class="r-docs-content-skeleton-bar" style="width: 90%"></div>
      <div class="r-docs-content-skeleton-bar" style="width: 75%"></div>
      <div class="r-docs-content-skeleton-bar" style="width: 45%"></div>
    </div>

    <!-- 空态 -->
    <div v-else class="r-docs-content-empty" data-testid="docs-content-empty">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        opacity="0.2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <span class="r-docs-empty-title">选择一个文件查看内容</span>
      <span class="r-docs-empty-desc">从左侧文件列表中点击选择</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { RMarkdownPreview } from '../../markdown-preview'
import type { DocFileItem, DocFileContent } from '../types'

const props = defineProps<{
  fileContent: DocFileContent | null
  selectedFile: DocFileItem | null
  loading: boolean
  cached: boolean
  tocVisible: boolean
  fullscreen: boolean
  enableToc: boolean
  enableFullscreen: boolean
}>()

defineEmits<{
  (e: 'toggle-toc'): void
  (e: 'toggle-fullscreen'): void
  (e: 'copy-path', path: string): void
  (e: 'locate-file'): void
}>()

const isMarkdown = computed(() => props.fileContent?.name.endsWith('.md'))
const fullPath = computed(() => {
  if (!props.selectedFile || !props.fileContent) {
    return ''
  }
  return `${props.selectedFile.directory}/${props.fileContent.path}`
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
</script>

<style>
.r-docs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: var(--ra-color-surface, #ffffff);
}

.r-docs-content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ra-spacing-3, 12px);
  padding: var(--ra-spacing-3, 12px) var(--ra-spacing-4, 16px);
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface, #ffffff);
  position: sticky;
  top: 0;
  z-index: 2;
}

.r-docs-content-path-wrap {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.r-docs-content-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1, 4px);
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-secondary, #6b7280);
}

.r-docs-breadcrumb-file {
  color: var(--ra-color-text-primary, #111827);
  font-weight: 500;
}

.r-docs-content-full-path {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ra-color-text-tertiary, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-docs-content-actions {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
}

.r-docs-cached-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--ra-radius-sm, 4px);
  background: var(--ra-color-success-subtle, #ecfdf5);
  color: var(--ra-color-success, #059669);
}

.r-docs-content-size {
  font-size: 12px;
  color: var(--ra-color-text-tertiary, #9ca3af);
}

.r-docs-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-surface, #ffffff);
  color: var(--ra-color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.r-docs-action-btn--with-label {
  width: auto;
  padding: 0 10px;
  font-size: 12px;
}

.r-docs-action-btn:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-action-btn.is-active {
  background: var(--ra-color-primary-subtle, #eff6ff);
  color: var(--ra-color-primary, #2563eb);
  border-color: var(--ra-color-primary, #2563eb);
}

.r-docs-content-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--ra-spacing-4, 16px) var(--ra-spacing-5, 24px);
}

.r-docs-md-preview {
  max-width: 860px;
}

.r-docs-code-preview {
  margin: 0;
  padding: var(--ra-spacing-4, 16px);
  font-size: 13px;
  line-height: 1.6;
  background: var(--ra-color-surface-secondary, #fafbfc);
  border-radius: var(--ra-radius-md, 6px);
  overflow: auto;
  color: var(--ra-color-text-primary, #111827);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.r-docs-content-loading {
  flex: 1;
  padding: var(--ra-spacing-5, 24px);
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3, 12px);
}

.r-docs-content-skeleton-bar {
  height: 16px;
  border-radius: var(--ra-radius-sm, 4px);
  background: var(--ra-color-surface-secondary, #f3f4f6);
  animation: r-docs-pulse 1.5s ease-in-out infinite;
}

.r-docs-content-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-3, 12px);
  padding: var(--ra-spacing-5, 24px);
}

.r-docs-empty-title {
  font-size: var(--ra-font-size-md, 14px);
  color: var(--ra-color-text-secondary, #6b7280);
  font-weight: 500;
}

.r-docs-empty-desc {
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-tertiary, #9ca3af);
}
</style>

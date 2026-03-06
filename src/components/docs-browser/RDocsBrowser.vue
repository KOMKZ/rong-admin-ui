<template>
  <div
    class="r-docs-browser"
    :class="{ 'is-fullscreen': isFullscreen }"
    :style="{ height: isFullscreen ? '100vh' : height }"
    data-testid="docs-browser"
  >
    <!-- Toast 反馈 -->
    <Transition name="r-docs-toast">
      <div v-if="toastMsg" class="r-docs-toast" :class="`r-docs-toast--${toastType}`" role="status">
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- 左侧目录导航（全屏时隐藏） -->
    <template v-if="!isFullscreen">
      <div v-show="!dirCollapsed" class="r-docs-panel r-docs-panel--dir" :style="{ width: dirWidth + 'px' }">
        <DirectorySidebar
          :directories="directories"
          :active-dir="activeDir"
          :file-counts="dirFileCounts"
          :total-count="files.length"
          title="目录"
          @select="handleDirSelect"
        />
      </div>
      <!-- 目录 resize handle -->
      <div
        v-show="!dirCollapsed"
        class="r-docs-resize-handle"
        data-testid="docs-resize-dir"
        @mousedown="(e) => startResize(e, 'dir')"
      ></div>
      <!-- 目录 collapse 按钮（收起后显示） -->
      <button
        v-if="dirCollapsed"
        class="r-docs-collapse-btn r-docs-collapse-btn--vertical"
        title="展开目录"
        data-testid="docs-expand-dir"
        @click="dirCollapsed = false"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </template>

    <!-- 错误态（全屏时隐藏） -->
    <div v-if="loadError && !isFullscreen" class="r-docs-error-banner" data-testid="docs-error" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <span>{{ loadError }}</span>
      <button class="r-docs-error-retry" @click="handleRefresh" data-testid="docs-error-retry">重试</button>
    </div>

    <!-- 文件列表（全屏时隐藏） -->
    <template v-if="!isFullscreen">
      <div v-show="!fileListCollapsed" class="r-docs-panel r-docs-panel--files" :style="{ width: fileListWidth + 'px' }">
        <FileList
          :files="filteredFiles"
          :selected-file="selectedFile"
          :sort-order="sortOrder"
          :active-dir="activeDir"
          :loading="fileListLoading"
          @select="handleFileClick"
          @toggle-sort="toggleSortOrder"
        />
      </div>
      <!-- 文件列表 resize handle -->
      <div
        v-show="!fileListCollapsed"
        class="r-docs-resize-handle"
        data-testid="docs-resize-files"
        @mousedown="(e) => startResize(e, 'files')"
      ></div>
      <!-- 文件列表 collapse 按钮（收起后显示） -->
      <button
        v-if="fileListCollapsed"
        class="r-docs-collapse-btn r-docs-collapse-btn--vertical"
        title="展开文件列表"
        data-testid="docs-expand-files"
        @click="fileListCollapsed = false"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </template>

    <!-- 右侧内容区 -->
    <div class="r-docs-main-area">
      <!-- 工具栏 -->
      <div class="r-docs-global-toolbar" data-testid="docs-toolbar">
        <!-- 左侧：折叠按钮（非全屏时） -->
        <div v-if="!isFullscreen" class="r-docs-toolbar-group">
          <button
            class="r-docs-toolbar-btn"
            :title="dirCollapsed ? '展开目录' : '收起目录'"
            data-testid="docs-toggle-dir"
            @click="dirCollapsed = !dirCollapsed"
          >
            <svg v-if="!dirCollapsed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="14 9 17 12 14 15"/></svg>
          </button>
          <button
            class="r-docs-toolbar-btn"
            :title="fileListCollapsed ? '展开文件列表' : '收起文件列表'"
            data-testid="docs-toggle-files"
            @click="fileListCollapsed = !fileListCollapsed"
          >
            <svg v-if="!fileListCollapsed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><polyline points="10 9 7 12 10 15"/></svg>
          </button>
          <div class="r-docs-toolbar-divider"></div>
        </div>

        <button
          class="r-docs-toolbar-btn"
          title="刷新"
          data-testid="docs-refresh"
          @click="handleRefresh"
          :disabled="fileListLoading"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          <span>刷新</span>
        </button>
        <button
          v-if="enableCache"
          class="r-docs-toolbar-btn r-docs-toolbar-btn--warning"
          title="清除缓存"
          data-testid="docs-clear-cache"
          @click="handleClearCache"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>清除缓存</span>
        </button>

        <!-- 全屏时：退出全屏按钮 -->
        <button
          v-if="isFullscreen"
          class="r-docs-toolbar-btn"
          title="退出全屏 (ESC)"
          data-testid="docs-exit-fullscreen"
          @click="isFullscreen = false"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6m10-10h-6V4M14 10l7-7M3 21l7-7"/></svg>
          <span>退出全屏</span>
        </button>
      </div>

      <ContentViewer
        :file-content="fileContent"
        :selected-file="selectedFile"
        :loading="contentLoading"
        :cached="isCached"
        :toc-visible="tocVisible"
        :fullscreen="isFullscreen"
        :enable-toc="enableToc"
        :enable-fullscreen="enableFullscreen"
        @toggle-toc="tocVisible = !tocVisible"
        @toggle-fullscreen="toggleFullscreen"
      />
    </div>

    <!-- TOC 侧边栏 -->
    <div v-if="tocVisible && isMarkdown && fileContent" class="r-docs-toc-panel" data-testid="docs-toc-panel">
      <div class="r-docs-toc-header">
        <span>目录大纲</span>
        <button class="r-docs-toc-close" @click="tocVisible = false" data-testid="docs-toc-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <MarkdownToc :content="fileContent.content" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MarkdownToc } from '../markdown-preview'
import DirectorySidebar from './components/DirectorySidebar.vue'
import FileList from './components/FileList.vue'
import ContentViewer from './components/ContentViewer.vue'
import type {
  DocsApiAdapter,
  DocDirectory,
  DocFileItem,
  DocFileContent,
  DocSortOrder,
} from './types'

const props = withDefaults(defineProps<{
  api: DocsApiAdapter
  cacheKey?: string
  height?: string
  enableToc?: boolean
  enableCache?: boolean
  enableFullscreen?: boolean
}>(), {
  cacheKey: 'r-docs-cache-v1',
  height: 'calc(100vh - 64px)',
  enableToc: true,
  enableCache: true,
  enableFullscreen: true,
})

const emit = defineEmits<{
  (e: 'file-select', file: DocFileItem): void
  (e: 'directory-change', dir: string): void
  (e: 'refresh'): void
  (e: 'cache-clear'): void
}>()

// --- 状态 ---
const fileListLoading = ref(false)
const contentLoading = ref(false)
const loadError = ref<string | null>(null)
const files = ref<DocFileItem[]>([])
const directories = ref<DocDirectory[]>([])
const activeDir = ref('')
const selectedFile = ref<DocFileItem | null>(null)
const fileContent = ref<DocFileContent | null>(null)
const isCached = ref(false)
const isFullscreen = ref(false)
const sortOrder = ref<DocSortOrder>('desc')
const tocVisible = ref(false)
const fileCache = ref<Record<string, DocFileContent>>({})

// --- 折叠状态 ---
const dirCollapsed = ref(false)
const fileListCollapsed = ref(false)

// --- 拖拽调宽 ---
const dirWidth = ref(200)
const fileListWidth = ref(280)
let resizeTarget: 'dir' | 'files' | null = null
let resizeStartX = 0
let resizeStartWidth = 0

function startResize(e: MouseEvent, target: 'dir' | 'files') {
  e.preventDefault()
  resizeTarget = target
  resizeStartX = e.clientX
  resizeStartWidth = target === 'dir' ? dirWidth.value : fileListWidth.value
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResizeMove(e: MouseEvent) {
  if (!resizeTarget) return
  const delta = e.clientX - resizeStartX
  const newWidth = Math.max(120, Math.min(500, resizeStartWidth + delta))
  if (resizeTarget === 'dir') {
    dirWidth.value = newWidth
  } else {
    fileListWidth.value = newWidth
  }
}

function onResizeEnd() {
  resizeTarget = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// --- Toast 反馈 ---
const toastMsg = ref('')
const toastType = ref<'success' | 'info'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type: 'success' | 'info' = 'success') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}

// --- 计算 ---
const dirFileCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const f of files.value) {
    counts[f.directory] = (counts[f.directory] || 0) + 1
  }
  return counts
})

const filteredFiles = computed(() => {
  if (!activeDir.value) return files.value
  return files.value.filter(f => f.directory === activeDir.value)
})

const isMarkdown = computed(() => fileContent.value?.name.endsWith('.md'))

// --- 事件处理 ---
function handleDirSelect(dir: string) {
  activeDir.value = dir
  emit('directory-change', dir)
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  loadFiles()
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

// --- 数据加载 ---
async function loadDirectories() {
  try {
    loadError.value = null
    const res = await props.api.getDirectories()
    directories.value = res.directories || []
  } catch (e: any) {
    loadError.value = e?.message || '加载目录失败'
  }
}

async function loadFiles() {
  fileListLoading.value = true
  try {
    loadError.value = null
    const res = await props.api.getFileList(sortOrder.value)
    files.value = res.files || []
  } catch (e: any) {
    loadError.value = e?.message || '加载文件列表失败'
  } finally {
    fileListLoading.value = false
  }
}

async function handleFileClick(file: DocFileItem) {
  selectedFile.value = file
  emit('file-select', file)
  await loadFileContent(file.directory, file.path)
}

async function loadFileContent(dir: string, path: string) {
  const cacheKey = `${dir}:${path}`

  if (props.enableCache && fileCache.value[cacheKey]) {
    fileContent.value = fileCache.value[cacheKey]
    isCached.value = true
    return
  }

  contentLoading.value = true
  isCached.value = false
  try {
    const res = await props.api.getFileContent(dir, path)
    fileContent.value = res
    if (props.enableCache) {
      fileCache.value[cacheKey] = res
      persistCache()
    }
  } catch (e) {
    console.error('[DocsBrowser] Failed to load file content', e)
  } finally {
    contentLoading.value = false
  }
}

function persistCache() {
  try {
    localStorage.setItem(props.cacheKey, JSON.stringify(fileCache.value))
  } catch { /* quota exceeded */ }
}

function loadCacheFromStorage() {
  if (!props.enableCache) return
  try {
    const cached = localStorage.getItem(props.cacheKey)
    if (cached) fileCache.value = JSON.parse(cached)
  } catch { /* corrupted cache */ }
}

// --- 刷新 / 清缓存（带反馈） ---
async function handleRefresh() {
  await loadFiles()
  if (selectedFile.value) {
    const key = `${selectedFile.value.directory}:${selectedFile.value.path}`
    delete fileCache.value[key]
    persistCache()
    await loadFileContent(selectedFile.value.directory, selectedFile.value.path)
  }
  showToast(`已刷新，共 ${files.value.length} 个文件`, 'success')
  emit('refresh')
}

function handleClearCache() {
  const count = Object.keys(fileCache.value).length
  fileCache.value = {}
  localStorage.removeItem(props.cacheKey)
  isCached.value = false
  showToast(`已清除 ${count} 条缓存`, 'info')
  emit('cache-clear')
}

// --- 生命周期 ---
onMounted(async () => {
  loadCacheFromStorage()
  document.addEventListener('keydown', handleKeydown)
  await loadDirectories()
  await loadFiles()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  if (toastTimer) clearTimeout(toastTimer)
})

defineExpose({
  refresh: handleRefresh,
  clearCache: handleClearCache,
})
</script>

<style>
.r-docs-browser {
  display: flex;
  position: relative;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-lg, 8px);
  overflow: hidden;
  background: var(--ra-color-surface, #ffffff);
  box-shadow: var(--ra-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

.r-docs-browser.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border-radius: 0;
  border: none;
}

/* --- Toast --- */
.r-docs-toast {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 6px 16px;
  border-radius: var(--ra-radius-md, 6px);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--ra-shadow-md, 0 4px 12px rgba(0,0,0,0.1));
  pointer-events: none;
}

.r-docs-toast--success {
  background: var(--ra-color-success, #059669);
  color: #fff;
}

.r-docs-toast--info {
  background: var(--ra-color-primary, #2563eb);
  color: #fff;
}

.r-docs-toast-enter-active,
.r-docs-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.r-docs-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

.r-docs-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

/* --- Panels --- */
.r-docs-panel {
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.r-docs-panel--dir {
  min-width: 120px;
  max-width: 360px;
}

.r-docs-panel--dir .r-docs-dir-sidebar {
  width: 100%;
  min-width: unset;
  max-width: unset;
}

.r-docs-panel--files {
  min-width: 160px;
  max-width: 500px;
}

.r-docs-panel--files .r-docs-file-list {
  width: 100%;
  min-width: unset;
  max-width: unset;
}

/* --- Resize Handle --- */
.r-docs-resize-handle {
  flex-shrink: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 3;
  transition: background 0.15s;
}

.r-docs-resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1px;
  width: 2px;
  background: var(--ra-color-border, #e5e7eb);
  transition: background 0.15s;
}

.r-docs-resize-handle:hover::after,
.r-docs-resize-handle:active::after {
  background: var(--ra-color-primary, #2563eb);
}

/* --- Collapse Button --- */
.r-docs-collapse-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--ra-color-surface-secondary, #fafbfc);
  color: var(--ra-color-text-tertiary, #9ca3af);
  cursor: pointer;
  transition: all 0.15s;
}

.r-docs-collapse-btn--vertical {
  width: 20px;
  border-right: 1px solid var(--ra-color-border, #e5e7eb);
}

.r-docs-collapse-btn:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-primary, #2563eb);
}

/* --- Error Banner --- */
.r-docs-error-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-4, 16px);
  background: var(--ra-color-danger-subtle, #fef2f2);
  color: var(--ra-color-danger, #dc2626);
  font-size: var(--ra-font-size-sm, 13px);
  z-index: 10;
}

.r-docs-error-retry {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid var(--ra-color-danger, #dc2626);
  border-radius: var(--ra-radius-sm, 4px);
  background: transparent;
  color: var(--ra-color-danger, #dc2626);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.r-docs-error-retry:hover {
  background: var(--ra-color-danger, #dc2626);
  color: #fff;
}

/* --- Main Area --- */
.r-docs-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.r-docs-global-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  padding: var(--ra-spacing-2, 8px) var(--ra-spacing-4, 16px);
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface-secondary, #fafbfc);
  flex-shrink: 0;
}

.r-docs-toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1, 4px);
}

.r-docs-toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--ra-color-border, #e5e7eb);
  margin: 0 4px;
}

.r-docs-toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-md, 6px);
  background: var(--ra-color-surface, #ffffff);
  color: var(--ra-color-text-secondary, #6b7280);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.r-docs-toolbar-btn:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-docs-toolbar-btn--warning:hover {
  color: var(--ra-color-warning, #d97706);
  border-color: var(--ra-color-warning, #d97706);
}

/* --- TOC Panel --- */
.r-docs-toc-panel {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface, #ffffff);
  overflow-y: auto;
}

.r-docs-toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ra-spacing-3, 12px) var(--ra-spacing-4, 16px);
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
  font-size: var(--ra-font-size-sm, 13px);
  font-weight: 600;
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-toc-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--ra-radius-sm, 4px);
  background: transparent;
  color: var(--ra-color-text-tertiary, #9ca3af);
  cursor: pointer;
  transition: all 0.15s ease;
}

.r-docs-toc-close:hover {
  background: var(--ra-color-surface-hover, #f3f4f6);
  color: var(--ra-color-text-primary, #111827);
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .r-docs-browser {
    flex-direction: column;
  }

  .r-docs-panel--dir,
  .r-docs-panel--files {
    width: 100% !important;
    max-width: unset;
    max-height: 180px;
  }

  .r-docs-resize-handle {
    display: none;
  }
}
</style>

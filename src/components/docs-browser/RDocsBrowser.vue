<template>
  <div
    class="r-docs-browser"
    :class="[
      { 'is-fullscreen': isFullscreen, 'is-printing': isPrinting },
      `print-theme-${printSettings.theme}`,
    ]"
    :style="{
      height: isFullscreen ? '100vh' : height,
      '--r-docs-print-mermaid-max-width': printSettings.mermaidAutoFit
        ? '100%'
        : `calc(100% * ${printSettings.mermaidScale / 100})`,
    }"
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
      <div
        v-show="!dirCollapsed"
        class="r-docs-panel r-docs-panel--dir"
        :style="{ width: dirWidth + 'px' }"
      >
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
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </template>

    <!-- 错误态（全屏时隐藏） -->
    <div
      v-if="loadError && !isFullscreen"
      class="r-docs-error-banner"
      data-testid="docs-error"
      role="alert"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ loadError }}</span>
      <button class="r-docs-error-retry" @click="handleRefresh" data-testid="docs-error-retry">
        重试
      </button>
    </div>

    <!-- 文件列表（全屏时隐藏） -->
    <template v-if="!isFullscreen">
      <div
        v-show="!fileListCollapsed"
        class="r-docs-panel r-docs-panel--files"
        :style="{ width: fileListWidth + 'px' }"
      >
        <FileList
          :files="filteredFiles"
          :selected-file="selectedFile"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          :active-dir="activeDir"
          :loading="fileListLoading"
          @select="handleFileClick"
          @change-sort-mode="handleSortModeChange"
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
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
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
            <svg
              v-if="!dirCollapsed"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            <svg
              v-else
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <polyline points="14 9 17 12 14 15" />
            </svg>
          </button>
          <button
            class="r-docs-toolbar-btn"
            :title="fileListCollapsed ? '展开文件列表' : '收起文件列表'"
            data-testid="docs-toggle-files"
            @click="fileListCollapsed = !fileListCollapsed"
          >
            <svg
              v-if="!fileListCollapsed"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <svg
              v-else
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <polyline points="10 9 7 12 10 15" />
            </svg>
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>刷新</span>
        </button>
        <button
          v-if="enableCache"
          class="r-docs-toolbar-btn r-docs-toolbar-btn--warning"
          title="清除缓存"
          data-testid="docs-clear-cache"
          @click="handleClearCache"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
          <span>清除缓存</span>
        </button>
        <button
          class="r-docs-toolbar-btn"
          title="导出 PDF"
          data-testid="docs-print-open"
          :disabled="!fileContent || contentLoading || isPrinting"
          @click="openPrintDialog"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>导出 PDF</span>
        </button>

        <!-- 全屏时：退出全屏按钮 -->
        <button
          v-if="isFullscreen"
          class="r-docs-toolbar-btn"
          title="退出全屏 (ESC)"
          data-testid="docs-exit-fullscreen"
          @click="isFullscreen = false"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 14h6v6m10-10h-6V4M14 10l7-7M3 21l7-7" />
          </svg>
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
    <div
      v-if="tocVisible && isMarkdown && fileContent"
      class="r-docs-toc-panel"
      data-testid="docs-toc-panel"
    >
      <div class="r-docs-toc-header">
        <span>目录大纲</span>
        <button class="r-docs-toc-close" @click="tocVisible = false" data-testid="docs-toc-close">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <MarkdownToc :content="fileContent.content" />
    </div>

    <Teleport to="body">
      <div
        v-if="printDialogVisible"
        class="r-docs-print-mask"
        data-testid="docs-print-dialog-mask"
        @click.self="closePrintDialog"
      >
        <div class="r-docs-print-dialog" role="dialog" aria-modal="true" aria-label="导出 PDF 设置">
          <div class="r-docs-print-dialog__header">
            <h3>导出 PDF 设置</h3>
            <button class="r-docs-print-close" aria-label="关闭" @click="closePrintDialog">×</button>
          </div>

          <div class="r-docs-print-section">
            <p class="r-docs-print-section__title">纸张与方向</p>
            <div class="r-docs-print-grid">
              <label>
                <input v-model="printSettings.orientation" type="radio" value="portrait" />
                纵向 A4
              </label>
              <label>
                <input v-model="printSettings.orientation" type="radio" value="landscape" />
                横向 A4
              </label>
            </div>
          </div>

          <div class="r-docs-print-section">
            <p class="r-docs-print-section__title">边距预设</p>
            <div class="r-docs-print-grid">
              <label>
                <input v-model="printSettings.marginPreset" type="radio" value="narrow" />
                窄边距 (8mm)
              </label>
              <label>
                <input v-model="printSettings.marginPreset" type="radio" value="normal" />
                标准 (12mm)
              </label>
              <label>
                <input v-model="printSettings.marginPreset" type="radio" value="wide" />
                宽边距 (18mm)
              </label>
            </div>
          </div>

          <div class="r-docs-print-section">
            <p class="r-docs-print-section__title">打印主题</p>
            <div class="r-docs-print-grid">
              <label>
                <input v-model="printSettings.theme" type="radio" value="paper" />
                标准阅读
              </label>
              <label>
                <input v-model="printSettings.theme" type="radio" value="ink" />
                省墨
              </label>
              <label>
                <input v-model="printSettings.theme" type="radio" value="github" />
                GitHub 风格
              </label>
            </div>
          </div>

          <div class="r-docs-print-section">
            <p class="r-docs-print-section__title">Mermaid 缩放</p>
            <label class="r-docs-print-check">
              <input v-model="printSettings.mermaidAutoFit" type="checkbox" />
              自动适配页宽（推荐）
            </label>
            <div class="r-docs-print-grid">
              <label>
                <input
                  v-model.number="printSettings.mermaidScale"
                  type="radio"
                  :value="100"
                  :disabled="printSettings.mermaidAutoFit"
                />
                100%
              </label>
              <label>
                <input
                  v-model.number="printSettings.mermaidScale"
                  type="radio"
                  :value="90"
                  :disabled="printSettings.mermaidAutoFit"
                />
                90%（推荐）
              </label>
              <label>
                <input
                  v-model.number="printSettings.mermaidScale"
                  type="radio"
                  :value="80"
                  :disabled="printSettings.mermaidAutoFit"
                />
                80%
              </label>
            </div>
          </div>

          <div class="r-docs-print-footer">
            <button class="r-docs-print-btn" @click="closePrintDialog">取消</button>
            <button
              class="r-docs-print-btn r-docs-print-btn--primary"
              data-testid="docs-print-confirm"
              :disabled="isPrinting"
              @click="handlePrintConfirm"
            >
              {{ isPrinting ? '准备中...' : '打开系统打印' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { MarkdownToc } from '../markdown-preview'
import DirectorySidebar from './components/DirectorySidebar.vue'
import FileList from './components/FileList.vue'
import ContentViewer from './components/ContentViewer.vue'
import type {
  DocsApiAdapter,
  DocDirectory,
  DocFileItem,
  DocFileContent,
  DocSortBy,
  DocSortOrder,
} from './types'

const props = withDefaults(
  defineProps<{
    api: DocsApiAdapter
    cacheKey?: string
    height?: string
    enableToc?: boolean
    enableCache?: boolean
    enableFullscreen?: boolean
    activeFileTag?: string
  }>(),
  {
    cacheKey: 'r-docs-cache-v1',
    height: 'calc(100vh - 64px)',
    enableToc: true,
    enableCache: true,
    enableFullscreen: true,
    activeFileTag: '',
  },
)

type PrintOrientation = 'portrait' | 'landscape'
type PrintMarginPreset = 'narrow' | 'normal' | 'wide'
type PrintThemePreset = 'paper' | 'ink' | 'github'
type PrintMermaidScale = 100 | 90 | 80

type PrintSettings = {
  orientation: PrintOrientation
  marginPreset: PrintMarginPreset
  theme: PrintThemePreset
  mermaidScale: PrintMermaidScale
  mermaidAutoFit: boolean
}

const PRINT_SETTINGS_STORAGE_KEY = 'r-docs-print-settings-v1'

const emit = defineEmits<{
  (e: 'file-select', file: DocFileItem): void
  (e: 'file-tag-change', tag: string): void
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
const sortBy = ref<DocSortBy>('mod_time')
const sortOrder = ref<DocSortOrder>('desc')
const tocVisible = ref(false)
const fileCache = ref<Record<string, DocFileContent>>({})
const printDialogVisible = ref(false)
const isPrinting = ref(false)
const printSettings = ref<PrintSettings>({
  orientation: 'portrait',
  marginPreset: 'narrow',
  theme: 'paper',
  mermaidScale: 90,
  mermaidAutoFit: true,
})
let printStyleEl: HTMLStyleElement | null = null

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
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2000)
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
  return files.value.filter((f) => f.directory === activeDir.value)
})

const isMarkdown = computed(() => fileContent.value?.name.endsWith('.md'))

// --- 事件处理 ---
function handleDirSelect(dir: string) {
  activeDir.value = dir
  emit('directory-change', dir)
}

function handleSortModeChange(mode: { sortBy: DocSortBy; sortOrder: DocSortOrder }) {
  if (sortBy.value === mode.sortBy && sortOrder.value === mode.sortOrder) return
  sortBy.value = mode.sortBy
  sortOrder.value = mode.sortOrder
  loadFiles()
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function openPrintDialog() {
  if (!fileContent.value || contentLoading.value) return
  printDialogVisible.value = true
}

function closePrintDialog() {
  printDialogVisible.value = false
}

function getPrintMarginMm(preset: PrintMarginPreset): number {
  if (preset === 'narrow') return 8
  if (preset === 'wide') return 18
  return 12
}

function updatePrintStyleTag() {
  const margin = getPrintMarginMm(printSettings.value.marginPreset)
  const orientation = printSettings.value.orientation
  const css = `@page { size: A4 ${orientation}; margin: ${margin}mm; }`

  if (!printStyleEl) {
    printStyleEl = document.createElement('style')
    printStyleEl.setAttribute('data-r-docs-print-style', 'true')
    document.head.appendChild(printStyleEl)
  }
  printStyleEl.textContent = css
}

async function waitForPrintAssets() {
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const images = Array.from(document.querySelectorAll('.r-docs-content-body img')) as HTMLImageElement[]
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    }),
  )
}

function handleAfterPrint() {
  isPrinting.value = false
}

async function handlePrintConfirm() {
  if (!fileContent.value || isPrinting.value) return
  isPrinting.value = true
  printDialogVisible.value = false
  updatePrintStyleTag()
  await waitForPrintAssets()
  window.print()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && printDialogVisible.value) {
    printDialogVisible.value = false
    return
  }
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
    const res = await props.api.getFileList(sortOrder.value, sortBy.value)
    files.value = res.files || []
    if (selectedFile.value) {
      const synced = files.value.find(
        (item) =>
          item.directory === selectedFile.value?.directory &&
          item.path === selectedFile.value?.path,
      )
      if (synced) {
        selectedFile.value = synced
      }
    }
    await syncFromActiveFileTag()
  } catch (e: any) {
    loadError.value = e?.message || '加载文件列表失败'
  } finally {
    fileListLoading.value = false
  }
}

function buildFileTag(file: DocFileItem): string {
  return `${file.directory}::${file.path}`
}

function parseFileTag(tag: string): { directory?: string; path: string } | null {
  if (!tag) return null
  const sepIndex = tag.indexOf('::')
  if (sepIndex < 0) {
    return { path: tag }
  }
  if (sepIndex === 0 || sepIndex >= tag.length - 2) return null
  return {
    directory: tag.slice(0, sepIndex),
    path: tag.slice(sepIndex + 2),
  }
}

async function handleFileClick(file: DocFileItem, emitTagChange = true) {
  const sameFile =
    selectedFile.value?.directory === file.directory && selectedFile.value?.path === file.path

  selectedFile.value = file
  emit('file-select', file)

  if (emitTagChange) {
    emit('file-tag-change', buildFileTag(file))
  }

  if (sameFile && fileContent.value) {
    return
  }

  await loadFileContent(file.directory, file.path)
}

async function syncFromActiveFileTag(): Promise<void> {
  const parsed = parseFileTag(props.activeFileTag || '')
  if (!parsed || !files.value.length) return

  const matched = files.value.find((item) => {
    if (parsed.directory) {
      return item.directory === parsed.directory && item.path === parsed.path
    }
    return item.path === parsed.path
  })
  if (!matched) return

  activeDir.value = matched.directory
  await handleFileClick(matched, false)
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
  } catch {
    /* quota exceeded */
  }
}

function loadCacheFromStorage() {
  if (!props.enableCache) return
  try {
    const cached = localStorage.getItem(props.cacheKey)
    if (cached) fileCache.value = JSON.parse(cached)
  } catch {
    /* corrupted cache */
  }
}

function loadPrintSettings() {
  try {
    const raw = localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<PrintSettings>
    if (parsed.orientation === 'portrait' || parsed.orientation === 'landscape') {
      printSettings.value.orientation = parsed.orientation
    }
    if (parsed.marginPreset === 'narrow' || parsed.marginPreset === 'normal' || parsed.marginPreset === 'wide') {
      printSettings.value.marginPreset = parsed.marginPreset
    }
    if (parsed.theme === 'paper' || parsed.theme === 'ink' || parsed.theme === 'github') {
      printSettings.value.theme = parsed.theme
    }
    if (parsed.mermaidScale === 100 || parsed.mermaidScale === 90 || parsed.mermaidScale === 80) {
      printSettings.value.mermaidScale = parsed.mermaidScale
    }
    if (typeof parsed.mermaidAutoFit === 'boolean') {
      printSettings.value.mermaidAutoFit = parsed.mermaidAutoFit
    }
  } catch {
    /* ignore corrupted settings */
  }
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
  loadPrintSettings()
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('afterprint', handleAfterPrint)
  await loadDirectories()
  await loadFiles()
})

watch(
  () => printSettings.value,
  (value) => {
    localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

watch(
  () => props.activeFileTag,
  () => {
    void syncFromActiveFileTag()
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('afterprint', handleAfterPrint)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  if (toastTimer) clearTimeout(toastTimer)
  if (printStyleEl?.parentNode) {
    printStyleEl.parentNode.removeChild(printStyleEl)
    printStyleEl = null
  }
})

defineExpose({
  refresh: handleRefresh,
  clearCache: handleClearCache,
  openByTag: syncFromActiveFileTag,
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

.r-docs-print-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(17, 24, 39, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ra-spacing-5, 24px);
}

.r-docs-print-dialog {
  width: min(560px, 100%);
  background: var(--ra-color-surface, #ffffff);
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-lg, 10px);
  box-shadow: var(--ra-shadow-lg, 0 12px 28px rgba(0, 0, 0, 0.18));
  overflow: hidden;
}

.r-docs-print-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ra-spacing-4, 16px) var(--ra-spacing-5, 24px);
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
}

.r-docs-print-dialog__header h3 {
  margin: 0;
  font-size: var(--ra-font-size-lg, 16px);
  font-weight: 600;
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-print-close {
  border: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface, #fff);
  color: var(--ra-color-text-secondary, #6b7280);
  border-radius: var(--ra-radius-sm, 6px);
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.r-docs-print-section {
  padding: var(--ra-spacing-4, 16px) var(--ra-spacing-5, 24px);
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
}

.r-docs-print-section__title {
  margin: 0 0 var(--ra-spacing-3, 12px);
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-secondary, #6b7280);
}

.r-docs-print-grid {
  display: grid;
  gap: var(--ra-spacing-2, 8px);
}

.r-docs-print-grid label {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-print-check {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  margin-bottom: var(--ra-spacing-2, 8px);
  font-size: var(--ra-font-size-sm, 13px);
  color: var(--ra-color-text-primary, #111827);
}

.r-docs-print-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ra-spacing-2, 8px);
  padding: var(--ra-spacing-4, 16px) var(--ra-spacing-5, 24px);
}

.r-docs-print-btn {
  border: 1px solid var(--ra-color-border, #e5e7eb);
  background: var(--ra-color-surface, #fff);
  color: var(--ra-color-text-secondary, #6b7280);
  border-radius: var(--ra-radius-md, 6px);
  padding: 6px 12px;
  cursor: pointer;
}

.r-docs-print-btn--primary {
  background: var(--ra-color-primary, #2563eb);
  border-color: var(--ra-color-primary, #2563eb);
  color: #fff;
}

.r-docs-print-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  box-shadow: var(--ra-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
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
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
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

@media print {
  .r-docs-browser,
  .r-docs-main-area,
  .r-docs-content,
  .r-docs-content-body {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .r-docs-browser {
    display: block !important;
    position: static !important;
    inset: auto !important;
    border: none !important;
    box-shadow: none !important;
    background: #fff !important;
  }

  .r-docs-panel,
  .r-docs-resize-handle,
  .r-docs-collapse-btn,
  .r-docs-global-toolbar,
  .r-docs-content-header,
  .r-docs-toc-panel,
  .r-docs-toast,
  .r-docs-print-mask,
  .rmd-canvas-overlay {
    display: none !important;
  }

  .r-docs-main-area,
  .r-docs-content {
    width: 100% !important;
  }

  .r-docs-content-body {
    padding: 0 !important;
  }

  .r-markdown-preview {
    padding: 0 !important;
    max-width: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .r-markdown-preview h1,
  .r-markdown-preview h2,
  .r-markdown-preview h3,
  .r-markdown-preview pre,
  .r-markdown-preview table,
  .r-markdown-preview blockquote,
  .r-markdown-preview img {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .r-markdown-preview table {
    display: table !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: visible !important;
    table-layout: auto !important;
    word-break: break-word;
  }

  .r-markdown-preview table th,
  .r-markdown-preview table td {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .r-markdown-preview img,
  .r-markdown-preview svg {
    max-width: 100% !important;
    height: auto !important;
  }

  .r-markdown-preview .rmd-mermaid-fullscreen-btn {
    display: none !important;
  }

  .r-markdown-preview .rmd-mermaid-container {
    break-inside: auto !important;
    page-break-inside: auto !important;
    overflow: visible !important;
    max-width: 100% !important;
  }

  .r-markdown-preview .rmd-mermaid-container svg {
    display: block !important;
    width: auto !important;
    max-width: var(--r-docs-print-mermaid-max-width, 100%) !important;
    max-height: 220mm !important;
    height: auto !important;
    margin-left: auto;
    margin-right: auto;
  }

  .r-docs-browser.print-theme-ink .r-markdown-preview {
    color: #111 !important;
    background: #fff !important;
  }

  .r-docs-browser.print-theme-ink .r-markdown-preview pre,
  .r-docs-browser.print-theme-ink .r-markdown-preview code,
  .r-docs-browser.print-theme-ink .r-markdown-preview table tr:nth-child(2n) {
    background: #fff !important;
  }

  .r-docs-browser.print-theme-ink .r-markdown-preview pre,
  .r-docs-browser.print-theme-ink .r-markdown-preview table,
  .r-docs-browser.print-theme-ink .r-markdown-preview table td,
  .r-docs-browser.print-theme-ink .r-markdown-preview table th,
  .r-docs-browser.print-theme-ink .r-markdown-preview blockquote {
    border-color: #d1d5db !important;
  }

  .r-docs-browser.print-theme-github .r-markdown-preview {
    font-size: 15px !important;
    line-height: 1.6 !important;
  }
}
</style>

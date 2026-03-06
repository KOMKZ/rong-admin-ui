<script lang="ts" setup>
import { computed, ref, watch, nextTick, onMounted, toRef } from 'vue'
import MarkdownIt from 'markdown-it'
import type { MarkdownPreviewTheme } from './types'
import { useMermaid } from './composables/useMermaid'

const props = withDefaults(
  defineProps<{
    content: string
    scale?: number
    theme?: MarkdownPreviewTheme
    enableMermaid?: boolean
    enableHighlight?: boolean
    highlightTheme?: string
  }>(),
  {
    content: '',
    scale: 100,
    theme: 'github',
    enableMermaid: true,
    enableHighlight: true,
    highlightTheme: 'github-dark',
  },
)

const containerRef = ref<HTMLElement | null>(null)
const enableMermaidRef = toRef(props, 'enableMermaid')

const {
  fullscreenSvg,
  canvasRef,
  canvasZoom,
  canvasPanX,
  canvasPanY,
  isDragging,
  renderDiagrams,
  canvasZoomIn,
  canvasZoomOut,
  canvasResetView,
  closeFullscreen,
  onCanvasWheel,
  onCanvasDragStart,
} = useMermaid({ containerRef, enabled: enableMermaidRef })

let hljsModule: typeof import('highlight.js') | null = null

async function loadHighlightJs() {
  if (hljsModule) return hljsModule.default
  hljsModule = await import('highlight.js')
  return hljsModule.default
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (!props.enableHighlight) return ''
    if (lang === 'mermaid') return ''
    /* highlight.js is loaded async; on first render it may not be available yet */
    if (hljsModule) {
      const hljs = hljsModule.default
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        } catch {
          /* swallow */
        }
      }
    }
    return ''
  },
})

const originalFenceRenderer = md.renderer.rules.fence

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info ? token.info.trim() : ''
  const lang = info.split(/\s+/g)[0]

  if (lang === 'mermaid' && props.enableMermaid) {
    const escaped = md.utils.escapeHtml(token.content)
    return `<div class="rmd-mermaid-container"><pre class="mermaid">${escaped}</pre></div>`
  }

  if (originalFenceRenderer) {
    return originalFenceRenderer(tokens, idx, options, env, self)
  }
  return self.renderToken(tokens, idx, options)
}

const renderedContent = computed(() => {
  if (!props.content) return '<p class="rmd-empty">暂无内容</p>'
  return md.render(props.content)
})

const scaleStyle = computed(() => {
  if (props.scale === 100) return {}
  const scaleValue = props.scale / 100
  return {
    transform: `scale(${scaleValue})`,
    transformOrigin: 'top left',
    width: `${100 / scaleValue}%`,
  }
})

const themeClass = computed(() => `r-markdown-preview--${props.theme}`)

const canvasTransformStyle = computed(() => ({
  transform: `translate(${canvasPanX.value}px, ${canvasPanY.value}px) scale(${canvasZoom.value})`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
}))

function addCopyButtons() {
  if (!containerRef.value) return
  containerRef.value.querySelectorAll('pre').forEach((pre) => {
    if (pre.classList.contains('mermaid') || pre.querySelector('.rmd-copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'rmd-copy-btn'
    btn.textContent = '复制'
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent || pre.textContent || ''
      try {
        await navigator.clipboard.writeText(code)
        btn.textContent = '已复制'
        setTimeout(() => { btn.textContent = '复制' }, 2000)
      } catch { /* ignore */ }
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
}

onMounted(async () => {
  if (props.enableHighlight) {
    await loadHighlightJs()
  }
  await nextTick()
  if (props.enableMermaid) {
    renderDiagrams()
  }
  addCopyButtons()
})

watch(
  () => props.content,
  async () => {
    if (props.enableHighlight && !hljsModule) {
      await loadHighlightJs()
    }
    await nextTick()
    if (props.enableMermaid) {
      renderDiagrams()
    }
    addCopyButtons()
  },
)
</script>

<template>
  <div
    ref="containerRef"
    class="r-markdown-preview"
    :class="[themeClass, { 'r-markdown-preview--scaled': scale !== 100 }]"
    :style="scaleStyle"
    data-testid="markdown-preview"
    v-html="renderedContent"
  />

  <Teleport to="body">
    <Transition name="rmd-overlay">
      <div
        v-if="fullscreenSvg"
        class="rmd-canvas-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Mermaid 图表全屏预览"
      >
        <div class="rmd-canvas-toolbar">
          <button
            aria-label="放大"
            @click="canvasZoomIn"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span class="rmd-canvas-zoom-text">{{ Math.round(canvasZoom * 100) }}%</span>
          <button
            aria-label="缩小"
            @click="canvasZoomOut"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button
            aria-label="适应屏幕"
            @click="canvasResetView"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <div class="rmd-canvas-divider" />
          <button
            aria-label="关闭全屏预览"
            @click="closeFullscreen"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div
          ref="canvasRef"
          class="rmd-canvas-area"
          @wheel.prevent="onCanvasWheel"
          @mousedown="onCanvasDragStart"
          @dblclick="canvasResetView"
        >
          <div
            class="rmd-canvas-transform"
            :style="canvasTransformStyle"
            v-html="fullscreenSvg"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
@import './styles/github.css';
@import './styles/github-dark.css';

.r-markdown-preview {
  color: var(--rmd-text);
  background: var(--rmd-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial,
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  padding: 32px;
  border-radius: var(--ra-radius-lg, 6px);
}

.r-markdown-preview .rmd-empty {
  color: var(--rmd-blockquote-text);
  font-style: italic;
}

/* Headings */
.r-markdown-preview h1,
.r-markdown-preview h2,
.r-markdown-preview h3,
.r-markdown-preview h4,
.r-markdown-preview h5,
.r-markdown-preview h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.r-markdown-preview h1 {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--rmd-border);
}

.r-markdown-preview h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--rmd-border);
}

.r-markdown-preview h3 {
  font-size: 1.25em;
}

.r-markdown-preview h4 {
  font-size: 1em;
}

.r-markdown-preview h5 {
  font-size: 0.875em;
}

.r-markdown-preview h6 {
  font-size: 0.85em;
  color: var(--rmd-blockquote-text);
}

/* Paragraphs */
.r-markdown-preview p {
  margin-top: 0;
  margin-bottom: 16px;
}

/* Links */
.r-markdown-preview a {
  color: var(--rmd-link);
  text-decoration: none;
}

.r-markdown-preview a:hover {
  text-decoration: underline;
}

/* Strong */
.r-markdown-preview strong {
  font-weight: 600;
}

/* Inline code */
.r-markdown-preview code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  white-space: break-spaces;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono',
    monospace;
}

/* Code blocks */
.r-markdown-preview pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--rmd-code-bg);
  border-radius: 6px;
  margin-top: 0;
  margin-bottom: 16px;
}

.r-markdown-preview pre code {
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
  font-size: 100%;
  white-space: pre;
}

/* Syntax-highlighted code blocks */
.r-markdown-preview pre.hljs {
  background-color: var(--rmd-pre-dark-bg);
  color: var(--rmd-pre-dark-text);
}

.r-markdown-preview pre.hljs code {
  color: inherit;
  background-color: transparent;
}

/* Blockquotes */
.r-markdown-preview blockquote {
  padding: 0 1em;
  color: var(--rmd-blockquote-text);
  border-left: 0.25em solid var(--rmd-blockquote-border);
  margin: 0 0 16px 0;
}

.r-markdown-preview blockquote > :first-child {
  margin-top: 0;
}

.r-markdown-preview blockquote > :last-child {
  margin-bottom: 0;
}

/* Lists */
.r-markdown-preview ul,
.r-markdown-preview ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.r-markdown-preview ul ul,
.r-markdown-preview ul ol,
.r-markdown-preview ol ul,
.r-markdown-preview ol ol {
  margin-top: 0;
  margin-bottom: 0;
}

.r-markdown-preview li {
  margin-top: 0.25em;
}

.r-markdown-preview li + li {
  margin-top: 0.25em;
}

/* Tables */
.r-markdown-preview table {
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  border-spacing: 0;
  border-collapse: collapse;
  margin-top: 0;
  margin-bottom: 16px;
}

.r-markdown-preview table th {
  font-weight: 600;
}

.r-markdown-preview table th,
.r-markdown-preview table td {
  padding: 6px 13px;
  border: 1px solid var(--rmd-border);
}

.r-markdown-preview table tr {
  background-color: var(--rmd-bg);
  border-top: 1px solid var(--rmd-table-border-top);
}

.r-markdown-preview table tr:nth-child(2n) {
  background-color: var(--rmd-table-stripe-bg);
}

/* Horizontal rule */
.r-markdown-preview hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--rmd-border);
  border: 0;
}

/* Images */
.r-markdown-preview img {
  max-width: 100%;
  box-sizing: content-box;
  background-color: var(--rmd-bg);
  border-radius: 6px;
}

/* Task lists */
.r-markdown-preview .task-list-item {
  list-style-type: none;
}

.r-markdown-preview .task-list-item input[type='checkbox'] {
  margin: 0 0.2em 0.25em -1.4em;
  vertical-align: middle;
}

/* Strikethrough */
.r-markdown-preview del {
  color: var(--rmd-blockquote-text);
}

/* Keyboard */
.r-markdown-preview kbd {
  display: inline-block;
  padding: 3px 5px;
  font: 11px ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  line-height: 10px;
  color: var(--rmd-text);
  vertical-align: middle;
  background-color: var(--rmd-code-bg);
  border: solid 1px var(--rmd-border);
  border-bottom-color: var(--rmd-kbd-border-bottom);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 var(--rmd-kbd-shadow);
}

/* Code block copy button */
.r-markdown-preview .rmd-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 10px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0;
  z-index: 2;
}

.r-markdown-preview pre:hover .rmd-copy-btn {
  opacity: 1;
}

.r-markdown-preview .rmd-copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Mermaid container */
.r-markdown-preview .rmd-mermaid-container {
  margin: 16px 0;
  border: 1px solid var(--rmd-border);
  border-radius: var(--ra-radius-lg, 8px);
  background-color: var(--rmd-mermaid-container-bg);
  overflow: hidden;
  position: relative;
}

.r-markdown-preview .rmd-mermaid-fullscreen-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--rmd-border);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--rmd-blockquote-text);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.r-markdown-preview .rmd-mermaid-fullscreen-btn:hover {
  background: #f3f4f6;
  color: var(--rmd-text);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

/* Mermaid fullscreen overlay */
.rmd-canvas-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: var(--rmd-fullscreen-bg, #1a1a2e);
}

.rmd-canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--rmd-fullscreen-toolbar-bg, #16213e);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  user-select: none;
}

.rmd-canvas-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.rmd-canvas-toolbar button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.rmd-canvas-toolbar button:active {
  background: rgba(255, 255, 255, 0.15);
}

.rmd-canvas-zoom-text {
  min-width: 52px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
}

.rmd-canvas-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 8px;
}

.rmd-canvas-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.rmd-canvas-transform {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  will-change: transform;
}

.rmd-canvas-transform svg {
  display: block;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

/* Transition */
.rmd-overlay-enter-active,
.rmd-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.rmd-overlay-enter-from,
.rmd-overlay-leave-to {
  opacity: 0;
}
</style>

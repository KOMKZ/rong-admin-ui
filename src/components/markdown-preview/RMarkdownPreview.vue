<script lang="ts" setup>
import './RMarkdownPreview.css'
  import { computed, ref, watch, nextTick, onMounted, onUnmounted, toRef } from 'vue'
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
      /** CHATADV-012: show disabled Run button in code blocks (reserves sandbox entry) */
      enableRunButton?: boolean
    }>(),
    {
      content: '',
      scale: 100,
      theme: 'github',
      enableMermaid: true,
      enableHighlight: true,
      highlightTheme: 'github-dark',
      enableRunButton: false,
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

  function slugifyHeading(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\u4e00-\u9fa5\s-]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const originalHeadingOpenRenderer = md.renderer.rules.heading_open

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const inlineToken = tokens[idx + 1]
    const headingText = inlineToken?.type === 'inline' ? inlineToken.content : ''
    const baseSlug = slugifyHeading(headingText) || `heading-${idx}`
    const envObj = env as Record<string, unknown>
    const key = '__rmdHeadingSlugMap'
    const slugMap = (envObj[key] as Record<string, number> | undefined) || {}
    const count = slugMap[baseSlug] || 0
    slugMap[baseSlug] = count + 1
    envObj[key] = slugMap
    const uniqueSlug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`
    tokens[idx].attrSet('id', uniqueSlug)

    if (originalHeadingOpenRenderer) {
      return originalHeadingOpenRenderer(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  const originalFenceRenderer = md.renderer.rules.fence

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info ? token.info.trim() : ''
    const lang = info.split(/\s+/g)[0]

    if (lang === 'mermaid' && props.enableMermaid) {
      const escaped = md.utils.escapeHtml(token.content)
      return `<div class="rmd-mermaid-container"><pre class="mermaid">${escaped}</pre></div>`
    }

    const inner = originalFenceRenderer
      ? originalFenceRenderer(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
    if (lang) {
      return `<div class="rmd-code-block"><span class="rmd-code-lang">${md.utils.escapeHtml(lang)}</span>${inner}</div>`
    }
    return inner
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
      pre.style.position = 'relative'
      if (props.enableRunButton) {
        const runBtn = document.createElement('button')
        runBtn.className = 'rmd-run-btn'
        runBtn.textContent = '运行'
        runBtn.disabled = true
        runBtn.title = '代码执行沙箱（即将支持）'
        pre.appendChild(runBtn)
      }
      const btn = document.createElement('button')
      btn.className = 'rmd-copy-btn'
      btn.textContent = '复制'
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.textContent || pre.textContent || ''
        try {
          await navigator.clipboard.writeText(code)
          btn.textContent = '已复制'
          setTimeout(() => {
            btn.textContent = '复制'
          }, 2000)
        } catch {
          /* ignore */
        }
      })
      pre.appendChild(btn)
    })
  }

  function escapeSelector(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value)
    }
    return value
  }

  function handlePreviewClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null
    if (!anchor || !containerRef.value) return

    const href = anchor.getAttribute('href') || ''
    if (!href.startsWith('#') || href.length <= 1) return

    const rawId = decodeURIComponent(href.slice(1))
    const targetHeading = containerRef.value.querySelector<HTMLElement>(`#${escapeSelector(rawId)}`)
    if (!targetHeading) return

    event.preventDefault()

    const scrollContainer = containerRef.value.closest('.r-docs-content-body') as HTMLElement | null
    if (!scrollContainer) {
      targetHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const offsetTop =
      targetHeading.getBoundingClientRect().top -
      scrollContainer.getBoundingClientRect().top +
      scrollContainer.scrollTop
    scrollContainer.scrollTo({ top: Math.max(0, offsetTop - 12), behavior: 'smooth' })
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
    containerRef.value?.addEventListener('click', handlePreviewClick)
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

  onUnmounted(() => {
    containerRef.value?.removeEventListener('click', handlePreviewClick)
  })
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
          <button aria-label="放大" @click="canvasZoomIn">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span class="rmd-canvas-zoom-text">{{ Math.round(canvasZoom * 100) }}%</span>
          <button aria-label="缩小" @click="canvasZoomOut">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button aria-label="适应屏幕" @click="canvasResetView">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <div class="rmd-canvas-divider" />
          <button aria-label="关闭全屏预览" @click="closeFullscreen">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
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
          <div class="rmd-canvas-transform" :style="canvasTransformStyle" v-html="fullscreenSvg" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>


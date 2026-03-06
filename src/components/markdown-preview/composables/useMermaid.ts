import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface UseMermaidOptions {
  containerRef: Ref<HTMLElement | null>
  enabled: Ref<boolean>
}

const FULLSCREEN_BTN_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' +
  '</svg>'

const ZOOM_MIN = 0.1
const ZOOM_MAX = 5
const ZOOM_STEP = 0.15

export function useMermaid({ containerRef, enabled }: UseMermaidOptions) {
  const fullscreenSvg = ref<string | null>(null)
  const canvasRef = ref<HTMLElement | null>(null)
  const canvasZoom = ref(1)
  const canvasPanX = ref(0)
  const canvasPanY = ref(0)
  const isDragging = ref(false)

  let dragStartX = 0
  let dragStartY = 0
  let panStartX = 0
  let panStartY = 0
  let mermaidModule: typeof import('mermaid') | null = null

  async function loadMermaid() {
    if (mermaidModule) return mermaidModule.default
    mermaidModule = await import('mermaid')
    mermaidModule.default.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
    })
    return mermaidModule.default
  }

  function fitSvgToCanvas() {
    if (!canvasRef.value) return
    const svg = canvasRef.value.querySelector('svg')
    if (!svg) return

    const viewBox = svg.getAttribute('viewBox')
    if (!viewBox) return
    const parts = viewBox.split(/[\s,]+/)
    if (parts.length < 4) return

    const svgW = parseFloat(parts[2])
    const svgH = parseFloat(parts[3])
    const padding = 24 * 2
    const totalW = svgW + padding
    const totalH = svgH + padding

    const areaRect = canvasRef.value.getBoundingClientRect()
    const margin = 48
    const availW = areaRect.width - margin * 2
    const availH = areaRect.height - margin * 2

    const fitZoom = Math.min(availW / totalW, availH / totalH, 1.5)
    canvasZoom.value = fitZoom
    canvasPanX.value = -(totalW * fitZoom) / 2
    canvasPanY.value = -(totalH * fitZoom) / 2
  }

  function injectFullscreenButtons() {
    if (!containerRef.value) return
    const containers = containerRef.value.querySelectorAll('.rmd-mermaid-container')
    containers.forEach((container) => {
      if (container.querySelector('.rmd-mermaid-fullscreen-btn')) return

      const mermaidSvg = container.querySelector('pre.mermaid svg, .mermaid svg')
      if (!mermaidSvg) return

      const btn = document.createElement('button')
      btn.className = 'rmd-mermaid-fullscreen-btn'
      btn.title = '全屏查看'
      btn.setAttribute('aria-label', '全屏查看 Mermaid 图表')
      btn.innerHTML = FULLSCREEN_BTN_SVG
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const svgEl = container.querySelector('pre.mermaid svg, .mermaid svg')
        if (svgEl) {
          const clone = svgEl.cloneNode(true) as SVGElement
          clone.removeAttribute('style')
          const vb = clone.getAttribute('viewBox')
          if (vb) {
            const p = vb.split(/[\s,]+/)
            if (p.length >= 4) {
              clone.setAttribute('width', p[2])
              clone.setAttribute('height', p[3])
            }
          }
          fullscreenSvg.value = clone.outerHTML
          nextTick(() => fitSvgToCanvas())
        }
      })
      container.prepend(btn)
    })
  }

  async function renderDiagrams() {
    if (!enabled.value || !containerRef.value) return
    const elements = containerRef.value.querySelectorAll('.mermaid:not([data-processed])')
    if (elements.length === 0) return

    try {
      const mermaidApi = await loadMermaid()
      await mermaidApi.run({ nodes: elements as NodeListOf<HTMLElement> })
      await nextTick()
      injectFullscreenButtons()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[RMarkdownPreview][Mermaid] Render error:', msg)
      await nextTick()
      injectFullscreenButtons()
    }
  }

  function canvasZoomIn() {
    canvasZoom.value = Math.min(ZOOM_MAX, canvasZoom.value * (1 + ZOOM_STEP))
  }

  function canvasZoomOut() {
    canvasZoom.value = Math.max(ZOOM_MIN, canvasZoom.value * (1 - ZOOM_STEP))
  }

  function canvasResetView() {
    fitSvgToCanvas()
  }

  function closeFullscreen() {
    fullscreenSvg.value = null
    canvasZoom.value = 1
    canvasPanX.value = 0
    canvasPanY.value = 0
  }

  function onCanvasWheel(e: WheelEvent) {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (!rect) return

    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top

    const oldZoom = canvasZoom.value
    const factor = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldZoom * factor))

    const ratio = newZoom / oldZoom
    canvasPanX.value = cursorX - ratio * (cursorX - canvasPanX.value)
    canvasPanY.value = cursorY - ratio * (cursorY - canvasPanY.value)
    canvasZoom.value = newZoom
  }

  function onCanvasDragStart(e: MouseEvent) {
    if (e.button !== 0) return
    isDragging.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    panStartX = canvasPanX.value
    panStartY = canvasPanY.value
    document.addEventListener('mousemove', onCanvasDragMove)
    document.addEventListener('mouseup', onCanvasDragEnd)
  }

  function onCanvasDragMove(e: MouseEvent) {
    if (!isDragging.value) return
    canvasPanX.value = panStartX + (e.clientX - dragStartX)
    canvasPanY.value = panStartY + (e.clientY - dragStartY)
  }

  function onCanvasDragEnd() {
    isDragging.value = false
    document.removeEventListener('mousemove', onCanvasDragMove)
    document.removeEventListener('mouseup', onCanvasDragEnd)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!fullscreenSvg.value) return
    if (e.key === 'Escape') closeFullscreen()
    else if ((e.key === '=' || e.key === '+') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      canvasZoomIn()
    } else if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      canvasZoomOut()
    } else if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      canvasResetView()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('mousemove', onCanvasDragMove)
    document.removeEventListener('mouseup', onCanvasDragEnd)
  })

  return {
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
  }
}

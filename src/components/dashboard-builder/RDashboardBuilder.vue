<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch, type Component } from 'vue'
import { NButton, NDrawer, NDrawerContent } from 'naive-ui'
import { RIcon } from '../icon'
import { REmptyState } from '../empty-state'
import type {
  DashboardBreakpoint,
  DashboardBuilderAdapter,
  DashboardBuilderExpose,
  DashboardLayoutItem,
  DashboardRect,
  DashboardResponsiveColumns,
  DashboardSizePreset,
  DashboardWidgetRegistryEntry,
  DashboardWidgetDefinition,
} from './types'

interface PlacedLayoutItem extends DashboardLayoutItem {
  x: number
  y: number
}

type LayoutByBreakpoint = Record<DashboardBreakpoint, PlacedLayoutItem[]>

interface DragState {
  id: string
  startX: number
  startY: number
  originX: number
  originY: number
  baseLayout: PlacedLayoutItem[]
}

interface ResizeState {
  id: string
  axis: 'x' | 'y' | 'both'
  startX: number
  startY: number
  originW: number
  originH: number
  baseLayout: PlacedLayoutItem[]
}

type DashboardEditScope = 'current' | 'all'

interface GuideLines {
  vertical: number[]
  horizontal: number[]
}

const GRID_GAP_PX = 16
const GRID_ROW_HEIGHT_PX = 72
const MIN_W = 2
const MIN_H = 1
const HISTORY_LIMIT = 50

const DEFAULT_SIZE_PRESETS: DashboardSizePreset[] = [
  { key: 's', label: 'S', w: 3, h: 2 },
  { key: 'm', label: 'M', w: 4, h: 2 },
  { key: 'l', label: 'L', w: 6, h: 3 },
]

const props = withDefaults(
  defineProps<{
    adapter: DashboardBuilderAdapter
    widgetRegistry?: Record<string, Component | DashboardWidgetRegistryEntry>
    columns?: number
    breakpointColumns?: Partial<DashboardResponsiveColumns>
    defaultEditing?: boolean
    editing?: boolean | null
    readonly?: boolean
  }>(),
  {
    widgetRegistry: () => ({}),
    columns: 12,
    breakpointColumns: () => ({}),
    defaultEditing: false,
    editing: null,
    readonly: false,
  },
)

const emit = defineEmits<{
  'layout-change': [layout: DashboardLayoutItem[]]
  saved: [layout: DashboardLayoutItem[]]
  error: [error: Error]
}>()

const gridRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const saving = ref(false)
const isReadonly = computed(() => props.readonly)
const editing = ref((props.editing ?? props.defaultEditing) && !props.readonly)
const widgetCatalog = ref<DashboardWidgetDefinition[]>([])
const feedback = ref('')
const editScope = ref<DashboardEditScope>('current')

const activeBreakpoint = ref<DashboardBreakpoint>('lg')
const layouts = ref<LayoutByBreakpoint>({ lg: [], md: [], sm: [] })
const previewLayout = ref<PlacedLayoutItem[] | null>(null)
const previewAnchorId = ref<string | null>(null)
const dragging = ref<DragState | null>(null)
const resizing = ref<ResizeState | null>(null)
const guideLines = ref<GuideLines>({ vertical: [], horizontal: [] })
const editorWidgetId = ref<string | null>(null)
const editorDraftConfig = ref<Record<string, unknown>>({})

const undoStack = ref<LayoutByBreakpoint[]>([])
const redoStack = ref<LayoutByBreakpoint[]>([])

const definitionMap = computed(() => {
  const map = new Map<string, DashboardWidgetDefinition>()
  for (const item of widgetCatalog.value) {
    map.set(item.type, item)
  }
  return map
})

const breakpointColumns = computed<DashboardResponsiveColumns>(() => ({
  lg: Math.max(4, Math.round(props.breakpointColumns.lg ?? props.columns)),
  md: Math.max(3, Math.round(props.breakpointColumns.md ?? 8)),
  sm: Math.max(1, Math.round(props.breakpointColumns.sm ?? 4)),
}))

const currentColumns = computed(() => breakpointColumns.value[activeBreakpoint.value])

const currentLayout = computed<PlacedLayoutItem[]>(() => layouts.value[activeBreakpoint.value])

const renderedLayout = computed(() => previewLayout.value ?? currentLayout.value)

const editingWidget = computed(() => {
  if (!editorWidgetId.value) return null
  return currentLayout.value.find((item) => item.id === editorWidgetId.value) || null
})

const editingWidgetDefinition = computed(() => {
  if (!editingWidget.value) return undefined
  return definitionMap.value.get(editingWidget.value.type)
})

const previewRect = computed<DashboardRect | null>(() => {
  if (!previewLayout.value || !previewAnchorId.value) {
    return null
  }
  const item = previewLayout.value.find((entry) => entry.id === previewAnchorId.value)
  if (!item) {
    return null
  }
  return {
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }
})

const gridStyle = computed(() => ({
  '--rdb-cols': String(currentColumns.value),
  '--rdb-gap': `${GRID_GAP_PX}px`,
  '--rdb-row-height': `${GRID_ROW_HEIGHT_PX}px`,
}))

const addableWidgets = computed(() => {
  const layoutTypes = new Set<string>()
  if (editScope.value === 'all') {
    for (const bp of ['lg', 'md', 'sm'] as const) {
      for (const item of layouts.value[bp]) {
        layoutTypes.add(item.type)
      }
    }
  } else {
    for (const item of currentLayout.value) {
      layoutTypes.add(item.type)
    }
  }
  return widgetCatalog.value.filter((definition) => definition.allowMultiple !== false || !layoutTypes.has(definition.type))
})

const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

function clonePlacedLayout(items: PlacedLayoutItem[]): PlacedLayoutItem[] {
  return items.map((item) => ({
    ...item,
    config: item.config ? { ...item.config } : undefined,
    responsive: item.responsive ? { ...item.responsive } : undefined,
  }))
}

function cloneLayoutMap(source: LayoutByBreakpoint): LayoutByBreakpoint {
  return {
    lg: clonePlacedLayout(source.lg),
    md: clonePlacedLayout(source.md),
    sm: clonePlacedLayout(source.sm),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizePlaced(item: DashboardLayoutItem, fallbackIndex: number, cols: number): PlacedLayoutItem | null {
  if (!item.id || !item.type) return null
  if (typeof item.w !== 'number' || typeof item.h !== 'number') return null
  const w = clamp(Math.round(item.w), MIN_W, cols)
  const h = Math.max(MIN_H, Math.round(item.h))
  const x = clamp(Math.round(item.x ?? 1), 1, Math.max(1, cols - w + 1))
  const y = Math.max(1, Math.round(item.y ?? fallbackIndex + 1))
  return {
    id: String(item.id),
    type: String(item.type),
    x,
    y,
    w,
    h,
    config: item.config && typeof item.config === 'object' ? { ...item.config } : undefined,
  }
}

function overlaps(a: PlacedLayoutItem, b: PlacedLayoutItem): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)
}

function canPlace(candidate: PlacedLayoutItem, items: PlacedLayoutItem[], ignoreId?: string): boolean {
  return !items.some((item) => item.id !== ignoreId && overlaps(item, candidate))
}

function findFirstFit(w: number, h: number, items: PlacedLayoutItem[], cols: number, ignoreId?: string): { x: number; y: number } {
  const safeW = clamp(w, MIN_W, cols)
  for (let y = 1; y <= 300; y += 1) {
    for (let x = 1; x <= cols - safeW + 1; x += 1) {
      const candidate: PlacedLayoutItem = {
        id: '__candidate__',
        type: '__candidate__',
        x,
        y,
        w: safeW,
        h,
      }
      if (canPlace(candidate, items, ignoreId)) {
        return { x, y }
      }
    }
  }
  return { x: 1, y: Math.max(1, items.length + 1) }
}

function compactLayout(items: PlacedLayoutItem[], cols: number, fixedId?: string): PlacedLayoutItem[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const result: PlacedLayoutItem[] = []
  for (const raw of sorted) {
    const item = {
      ...raw,
      w: clamp(raw.w, MIN_W, cols),
      h: Math.max(MIN_H, raw.h),
      x: clamp(raw.x, 1, Math.max(1, cols - raw.w + 1)),
      y: Math.max(1, raw.y),
    }
    if (item.id === fixedId) {
      result.push(item)
      continue
    }
    while (item.y > 1) {
      const next = { ...item, y: item.y - 1 }
      if (!canPlace(next, result, item.id)) {
        break
      }
      item.y -= 1
    }
    result.push(item)
  }
  return result.sort((a, b) => a.y - b.y || a.x - b.x)
}

function rebalance(items: PlacedLayoutItem[], cols: number, anchorId?: string): PlacedLayoutItem[] {
  const placed: PlacedLayoutItem[] = []

  if (anchorId) {
    const anchor = items.find((item) => item.id === anchorId)
    if (anchor) {
      const safeAnchor = {
        ...anchor,
        w: clamp(anchor.w, MIN_W, cols),
        h: Math.max(MIN_H, anchor.h),
      }
      safeAnchor.x = clamp(safeAnchor.x, 1, Math.max(1, cols - safeAnchor.w + 1))
      safeAnchor.y = Math.max(1, safeAnchor.y)
      placed.push(safeAnchor)
    }
  }

  const rest = items
    .filter((item) => item.id !== anchorId)
    .map((item) => ({ ...item }))
    .sort((a, b) => a.y - b.y || a.x - b.x)

  for (const item of rest) {
    item.w = clamp(item.w, MIN_W, cols)
    item.h = Math.max(MIN_H, item.h)
    item.x = clamp(item.x, 1, Math.max(1, cols - item.w + 1))
    item.y = Math.max(1, item.y)

    if (!canPlace(item, placed, item.id)) {
      const fit = findFirstFit(item.w, item.h, placed, cols, item.id)
      item.x = fit.x
      item.y = fit.y
    }
    placed.push(item)
  }

  return compactLayout(placed, cols, anchorId)
}

function deriveLayout(source: PlacedLayoutItem[], cols: number): PlacedLayoutItem[] {
  const draft = source.map((item, index) => {
    const w = clamp(item.w, MIN_W, cols)
    return {
      ...item,
      w,
      x: clamp(item.x, 1, Math.max(1, cols - w + 1)),
      y: Math.max(1, item.y || index + 1),
    }
  })
  return rebalance(draft, cols)
}

function serializeLayouts(source: LayoutByBreakpoint = layouts.value): DashboardLayoutItem[] {
  const idMap = new Map<string, DashboardLayoutItem>()

  for (const item of source.lg) {
    idMap.set(item.id, {
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      config: item.config ? { ...item.config } : undefined,
      responsive: {},
    })
  }

  for (const breakpoint of ['md', 'sm'] as const) {
    for (const item of source[breakpoint]) {
      if (!idMap.has(item.id)) {
        idMap.set(item.id, {
          id: item.id,
          type: item.type,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          config: item.config ? { ...item.config } : undefined,
          responsive: {},
        })
      }
      const target = idMap.get(item.id)
      if (!target) continue
      const lg = source.lg.find((entry) => entry.id === item.id)
      const differsFromLg = !lg || lg.x !== item.x || lg.y !== item.y || lg.w !== item.w || lg.h !== item.h
      if (differsFromLg) {
        if (!target.responsive) {
          target.responsive = {}
        }
        target.responsive[breakpoint] = {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        }
      }
    }
  }

  return Array.from(idMap.values())
}

function clearPreview(): void {
  previewLayout.value = null
  previewAnchorId.value = null
  guideLines.value = { vertical: [], horizontal: [] }
}

function setGuides(vertical: number[], horizontal: number[]): void {
  const { cellWidth, rowUnit } = getGridMetrics()
  guideLines.value = {
    vertical: vertical.map((line) => Math.max(0, (line - 1) * (cellWidth + GRID_GAP_PX))),
    horizontal: horizontal.map((line) => Math.max(0, (line - 1) * rowUnit)),
  }
}

function findBestSnap(diffCandidates: Array<{ diff: number; line: number }>, threshold = 0.45): { diff: number; line: number } | null {
  let best: { diff: number; line: number } | null = null
  for (const candidate of diffCandidates) {
    if (Math.abs(candidate.diff) > threshold) continue
    if (!best || Math.abs(candidate.diff) < Math.abs(best.diff)) {
      best = candidate
    }
  }
  return best
}

function snapForDrag(
  anchor: PlacedLayoutItem,
  baseLayout: PlacedLayoutItem[],
  proposedX: number,
  proposedY: number,
  cols: number,
): { x: number; y: number; vertical: number[]; horizontal: number[] } {
  let x = proposedX
  let y = proposedY
  const vertical: number[] = []
  const horizontal: number[] = []

  const others = baseLayout.filter((item) => item.id !== anchor.id)
  const xLines = [1, cols + 1]
  const yLines = [1]
  for (const item of others) {
    xLines.push(item.x, item.x + item.w)
    yLines.push(item.y, item.y + item.h)
  }

  const left = x
  const right = x + anchor.w
  const top = y
  const bottom = y + anchor.h

  const snapLeft = findBestSnap(xLines.map((line) => ({ diff: line - left, line })))
  const snapRight = findBestSnap(xLines.map((line) => ({ diff: line - right, line })))
  const bestX = !snapLeft
    ? snapRight
    : !snapRight
      ? snapLeft
      : Math.abs(snapLeft.diff) <= Math.abs(snapRight.diff)
        ? snapLeft
        : snapRight

  if (bestX) {
    if (bestX === snapRight) {
      x = clamp(bestX.line - anchor.w, 1, Math.max(1, cols - anchor.w + 1))
      vertical.push(bestX.line)
    } else {
      x = clamp(bestX.line, 1, Math.max(1, cols - anchor.w + 1))
      vertical.push(bestX.line)
    }
  }

  const snapTop = findBestSnap(yLines.map((line) => ({ diff: line - top, line })))
  const snapBottom = findBestSnap(yLines.map((line) => ({ diff: line - bottom, line })))
  const bestY = !snapTop
    ? snapBottom
    : !snapBottom
      ? snapTop
      : Math.abs(snapTop.diff) <= Math.abs(snapBottom.diff)
        ? snapTop
        : snapBottom

  if (bestY) {
    if (bestY === snapBottom) {
      y = Math.max(1, bestY.line - anchor.h)
      horizontal.push(bestY.line)
    } else {
      y = Math.max(1, bestY.line)
      horizontal.push(bestY.line)
    }
  }

  return { x, y, vertical, horizontal }
}

function snapForResize(
  anchor: PlacedLayoutItem,
  baseLayout: PlacedLayoutItem[],
  proposedW: number,
  proposedH: number,
  axis: 'x' | 'y' | 'both',
  cols: number,
): { w: number; h: number; vertical: number[]; horizontal: number[] } {
  let w = proposedW
  let h = proposedH
  const vertical: number[] = []
  const horizontal: number[] = []

  const others = baseLayout.filter((item) => item.id !== anchor.id)
  const xLines = [1, cols + 1]
  const yLines = [1]
  for (const item of others) {
    xLines.push(item.x, item.x + item.w)
    yLines.push(item.y, item.y + item.h)
  }

  if (axis === 'x' || axis === 'both') {
    const right = anchor.x + w
    const snap = findBestSnap(xLines.map((line) => ({ diff: line - right, line })))
    if (snap) {
      w = clamp(snap.line - anchor.x, getMinWidth(anchor), Math.min(getMaxWidth(anchor), cols - anchor.x + 1))
      vertical.push(snap.line)
    }
  }

  if (axis === 'y' || axis === 'both') {
    const bottom = anchor.y + h
    const snap = findBestSnap(yLines.map((line) => ({ diff: line - bottom, line })))
    if (snap) {
      h = clamp(snap.line - anchor.y, getMinHeight(anchor), getMaxHeight(anchor))
      horizontal.push(snap.line)
    }
  }

  return { w, h, vertical, horizontal }
}

function pushUndoSnapshot(snapshot: LayoutByBreakpoint): void {
  undoStack.value.push(snapshot)
  if (undoStack.value.length > HISTORY_LIMIT) {
    undoStack.value.shift()
  }
}

function applyLayouts(nextLayouts: LayoutByBreakpoint, pushHistory = true, shouldEmit = true): void {
  if (pushHistory) {
    pushUndoSnapshot(cloneLayoutMap(layouts.value))
    redoStack.value = []
  }
  layouts.value = cloneLayoutMap(nextLayouts)
  clearPreview()
  if (shouldEmit) {
    emit('layout-change', serializeLayouts(layouts.value))
  }
}

function syncAllLayoutsFromActive(nextActiveLayout: PlacedLayoutItem[]): LayoutByBreakpoint {
  const active = activeBreakpoint.value
  const activeCols = breakpointColumns.value[active]
  const normalizedActive = rebalance(nextActiveLayout, activeCols)
  const nextLayouts = cloneLayoutMap(layouts.value)
  nextLayouts[active] = normalizedActive

  for (const bp of ['lg', 'md', 'sm'] as const) {
    if (bp === active) continue
    const cols = breakpointColumns.value[bp]
    const currentMap = new Map(nextLayouts[bp].map((item) => [item.id, item]))
    const derived: PlacedLayoutItem[] = []
    for (const item of normalizedActive) {
      const existing = currentMap.get(item.id)
      const mappedW = clamp(Math.round((item.w / activeCols) * cols), MIN_W, cols)
      const maxX = Math.max(1, cols - mappedW + 1)
      const mappedX = clamp(Math.round(((item.x - 1) / activeCols) * cols) + 1, 1, maxX)
      const mappedH = clamp(Math.round(item.h), getMinHeight(item), getMaxHeight(item))
      derived.push({
        id: item.id,
        type: item.type,
        x: mappedX,
        y: Math.max(1, Math.round(item.y)),
        w: mappedW,
        h: mappedH,
        config: existing?.config ? { ...existing.config } : item.config ? { ...item.config } : undefined,
      })
    }
    nextLayouts[bp] = rebalance(derived, cols)
  }

  return nextLayouts
}

function applyActiveLayout(nextLayout: PlacedLayoutItem[], pushHistory = true, shouldEmit = true): void {
  const nextLayouts =
    editScope.value === 'all'
      ? syncAllLayoutsFromActive(nextLayout)
      : {
          ...cloneLayoutMap(layouts.value),
          [activeBreakpoint.value]: rebalance(nextLayout, currentColumns.value),
        }
  applyLayouts(nextLayouts, pushHistory, shouldEmit)
}

function buildDefaultLayouts(catalog: DashboardWidgetDefinition[]): LayoutByBreakpoint {
  const next: LayoutByBreakpoint = { lg: [], md: [], sm: [] }
  for (const widget of catalog) {
    if (!widget.defaultVisible) continue
    const size = widget.defaultSize ?? DEFAULT_SIZE_PRESETS[1]
    for (const bp of ['lg', 'md', 'sm'] as const) {
      const cols = breakpointColumns.value[bp]
      const w = clamp(size.w, MIN_W, cols)
      const h = Math.max(MIN_H, size.h)
      const fit = findFirstFit(w, h, next[bp], cols)
      next[bp].push({
        id: `${widget.type}-${Date.now()}-${next[bp].length + 1}`,
        type: widget.type,
        x: fit.x,
        y: fit.y,
        w,
        h,
        config: widget.defaultConfig ? { ...widget.defaultConfig } : undefined,
      })
    }
  }
  for (const bp of ['lg', 'md', 'sm'] as const) {
    next[bp] = rebalance(next[bp], breakpointColumns.value[bp])
  }
  return next
}

function normalizeFromSerialized(items: DashboardLayoutItem[]): LayoutByBreakpoint {
  const normalized: LayoutByBreakpoint = { lg: [], md: [], sm: [] }
  const colsMap = breakpointColumns.value

  items.forEach((item, index) => {
    const lgCandidate = normalizePlaced(item, index, colsMap.lg)
    if (!lgCandidate) return
    normalized.lg.push(lgCandidate)

    for (const bp of ['md', 'sm'] as const) {
      const responsiveRect = item.responsive?.[bp]
      const derived: DashboardLayoutItem = {
        ...item,
        x: responsiveRect?.x ?? lgCandidate.x,
        y: responsiveRect?.y ?? lgCandidate.y,
        w: responsiveRect?.w ?? lgCandidate.w,
        h: responsiveRect?.h ?? lgCandidate.h,
      }
      const bpCandidate = normalizePlaced(derived, index, colsMap[bp])
      if (!bpCandidate) continue
      normalized[bp].push(bpCandidate)
    }
  })

  normalized.lg = rebalance(normalized.lg, colsMap.lg)
  normalized.md = normalized.md.length ? rebalance(normalized.md, colsMap.md) : deriveLayout(normalized.lg, colsMap.md)
  normalized.sm = normalized.sm.length ? rebalance(normalized.sm, colsMap.sm) : deriveLayout(normalized.md, colsMap.sm)

  return normalized
}

function ensureBreakpointLayout(breakpoint: DashboardBreakpoint): void {
  if (layouts.value[breakpoint].length > 0) return
  const source = breakpoint === 'lg' ? layouts.value.md : breakpoint === 'md' ? layouts.value.lg : layouts.value.md
  const fallback = source.length ? source : layouts.value.lg
  const cols = breakpointColumns.value[breakpoint]
  const nextLayouts = cloneLayoutMap(layouts.value)
  nextLayouts[breakpoint] = deriveLayout(fallback, cols)
  layouts.value = nextLayouts
}

function detectBreakpoint(width: number): DashboardBreakpoint {
  if (width >= 1280) return 'lg'
  if (width >= 768) return 'md'
  return 'sm'
}

function handleWindowResize(): void {
  const next = detectBreakpoint(window.innerWidth)
  if (next === activeBreakpoint.value) {
    return
  }
  clearPreview()
  dragging.value = null
  resizing.value = null
  activeBreakpoint.value = next
  ensureBreakpointLayout(next)
}

function getPresets(item: DashboardLayoutItem): DashboardSizePreset[] {
  return definitionMap.value.get(item.type)?.sizePresets ?? DEFAULT_SIZE_PRESETS
}

function getCurrentSizeLabel(item: DashboardLayoutItem): string {
  const preset = getPresets(item).find((entry) => entry.w === item.w && entry.h === item.h)
  if (!preset) {
    return `${item.w}x${item.h}`
  }
  return preset.label
}

function getWidgetRegistryEntry(type: string): DashboardWidgetRegistryEntry | undefined {
  const raw = props.widgetRegistry[type]
  if (!raw) return undefined
  if (typeof raw === 'object' && 'renderer' in raw) {
    const entry = raw as DashboardWidgetRegistryEntry
    return {
      renderer: toRaw(entry.renderer) as Component,
      editor: entry.editor ? (toRaw(entry.editor) as Component) : undefined,
    }
  }
  return {
    renderer: toRaw(raw as Component) as Component,
  }
}

function getWidgetRenderer(type: string): Component | undefined {
  return getWidgetRegistryEntry(type)?.renderer
}

function getWidgetEditor(type: string): Component | undefined {
  return getWidgetRegistryEntry(type)?.editor
}

function getWidgetDisplayTitle(item: PlacedLayoutItem): string {
  const definition = definitionMap.value.get(item.type)
  const custom = item.config && typeof item.config.title === 'string' ? item.config.title.trim() : ''
  return custom || definition?.title || item.type
}

function getWidgetDisplayDescription(item: PlacedLayoutItem): string {
  const definition = definitionMap.value.get(item.type)
  const custom = item.config && typeof item.config.description === 'string' ? item.config.description.trim() : ''
  return custom || definition?.description || ''
}

function openWidgetEditor(item: PlacedLayoutItem): void {
  if (!editing.value || isReadonly.value) return
  const editor = getWidgetEditor(item.type)
  if (!editor) return
  editorWidgetId.value = item.id
  editorDraftConfig.value = item.config ? { ...item.config } : {}
}

function closeWidgetEditor(): void {
  editorWidgetId.value = null
  editorDraftConfig.value = {}
}

function updateWidgetEditorDraft(next: Record<string, unknown>): void {
  editorDraftConfig.value = { ...next }
}

function saveWidgetEditor(): void {
  if (!editingWidget.value) {
    closeWidgetEditor()
    return
  }
  const targetId = editingWidget.value.id
  const next = currentLayout.value.map((item) =>
    item.id === targetId
      ? {
          ...item,
          config: { ...editorDraftConfig.value },
        }
      : { ...item },
  )
  applyActiveLayout(next)
  closeWidgetEditor()
}

function getMinWidth(item: PlacedLayoutItem): number {
  return definitionMap.value.get(item.type)?.minSize?.w ?? MIN_W
}

function getMinHeight(item: PlacedLayoutItem): number {
  return definitionMap.value.get(item.type)?.minSize?.h ?? MIN_H
}

function getMaxWidth(item: PlacedLayoutItem): number {
  return definitionMap.value.get(item.type)?.maxSize?.w ?? currentColumns.value
}

function getMaxHeight(item: PlacedLayoutItem): number {
  return definitionMap.value.get(item.type)?.maxSize?.h ?? 16
}

function addWidget(type: string): void {
  const definition = definitionMap.value.get(type)
  if (!definition) return
  const size = definition.defaultSize ?? DEFAULT_SIZE_PRESETS[1]

  const nextLayouts = cloneLayoutMap(layouts.value)
  const id = `${type}-${Date.now()}`

  const targets = editScope.value === 'all' ? (['lg', 'md', 'sm'] as const) : ([activeBreakpoint.value] as const)
  for (const bp of targets) {
    const cols = breakpointColumns.value[bp]
    const w = clamp(size.w, getMinWidth({ id, type, x: 1, y: 1, w: size.w, h: size.h }), cols)
    const h = Math.max(MIN_H, size.h)
    const fit = findFirstFit(w, h, nextLayouts[bp], cols)
    nextLayouts[bp].push({
      id,
      type,
      x: fit.x,
      y: fit.y,
      w,
      h,
      config: definition.defaultConfig ? { ...definition.defaultConfig } : undefined,
    })
    nextLayouts[bp] = rebalance(nextLayouts[bp], cols)
  }

  if (editScope.value !== 'all') {
    for (const bp of ['lg', 'md', 'sm'] as const) {
      if (bp === activeBreakpoint.value) continue
      nextLayouts[bp] = clonePlacedLayout(layouts.value[bp])
    }
  }

  applyLayouts(nextLayouts)
}

function removeWidget(id: string): void {
  const nextLayouts = cloneLayoutMap(layouts.value)
  const targets = editScope.value === 'all' ? (['lg', 'md', 'sm'] as const) : ([activeBreakpoint.value] as const)
  for (const bp of targets) {
    nextLayouts[bp] = rebalance(
      nextLayouts[bp].filter((item) => item.id !== id),
      breakpointColumns.value[bp],
    )
  }

  if (editScope.value !== 'all') {
    for (const bp of ['lg', 'md', 'sm'] as const) {
      if (bp === activeBreakpoint.value) continue
      nextLayouts[bp] = clonePlacedLayout(layouts.value[bp])
    }
  }

  applyLayouts(nextLayouts)
}

function moveWidget(index: number, direction: 'up' | 'down'): void {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= currentLayout.value.length) return
  const next = clonePlacedLayout(currentLayout.value)
  const current = next[index]
  next[index] = next[target]
  next[target] = current
  applyActiveLayout(next)
}

function cycleSize(id: string): void {
  const current = currentLayout.value.find((item) => item.id === id)
  if (!current) return
  const presets = getPresets(current)
  if (!presets.length) return
  const currentIndex = presets.findIndex((entry) => entry.w === current.w && entry.h === current.h)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % presets.length
  const nextPreset = presets[nextIndex]

  const cols = currentColumns.value
  const next = currentLayout.value.map((item) => {
    if (item.id !== id) return { ...item }
    const maxW = Math.min(getMaxWidth(item), cols - item.x + 1)
    return {
      ...item,
      w: clamp(nextPreset.w, getMinWidth(item), Math.max(getMinWidth(item), maxW)),
      h: clamp(nextPreset.h, getMinHeight(item), getMaxHeight(item)),
    }
  })

  applyActiveLayout(rebalance(next, cols, id))
}

function getGridMetrics(): { cellWidth: number; rowUnit: number } {
  const rect = gridRef.value?.getBoundingClientRect()
  const width = rect?.width ?? 0
  const cols = currentColumns.value
  const cellWidth = width > 0 ? (width - GRID_GAP_PX * (cols - 1)) / cols : 1
  return {
    cellWidth: Math.max(1, cellWidth),
    rowUnit: GRID_ROW_HEIGHT_PX + GRID_GAP_PX,
  }
}

function beginDrag(event: PointerEvent, item: PlacedLayoutItem): void {
  if (!editing.value || isReadonly.value || resizing.value) return
  clearPreview()
  dragging.value = {
    id: item.id,
    startX: event.clientX,
    startY: event.clientY,
    originX: item.x,
    originY: item.y,
    baseLayout: clonePlacedLayout(currentLayout.value),
  }
  event.preventDefault()
}

function beginResize(event: PointerEvent, item: PlacedLayoutItem, axis: 'x' | 'y' | 'both'): void {
  if (!editing.value || isReadonly.value || dragging.value) return
  clearPreview()
  resizing.value = {
    id: item.id,
    axis,
    startX: event.clientX,
    startY: event.clientY,
    originW: item.w,
    originH: item.h,
    baseLayout: clonePlacedLayout(currentLayout.value),
  }
  event.preventDefault()
}

function handlePointerMove(event: PointerEvent): void {
  const cols = currentColumns.value
  if (dragging.value) {
    const state = dragging.value
    const anchor = state.baseLayout.find((entry) => entry.id === state.id)
    if (!anchor) return

    const { cellWidth, rowUnit } = getGridMetrics()
    const deltaCols = Math.round((event.clientX - state.startX) / cellWidth)
    const deltaRows = Math.round((event.clientY - state.startY) / rowUnit)
    const proposedX = clamp(state.originX + deltaCols, 1, Math.max(1, cols - anchor.w + 1))
    const proposedY = Math.max(1, state.originY + deltaRows)
    const snapped = snapForDrag(anchor, state.baseLayout, proposedX, proposedY, cols)

    const draft = state.baseLayout.map((entry) =>
      entry.id === state.id
        ? {
            ...entry,
            x: snapped.x,
            y: snapped.y,
          }
        : { ...entry },
    )

    previewLayout.value = rebalance(draft, cols, state.id)
    previewAnchorId.value = state.id
    setGuides(snapped.vertical, snapped.horizontal)
    return
  }

  if (resizing.value) {
    const state = resizing.value
    const anchor = state.baseLayout.find((entry) => entry.id === state.id)
    if (!anchor) return

    const { cellWidth, rowUnit } = getGridMetrics()
    const deltaCols = Math.round((event.clientX - state.startX) / cellWidth)
    const deltaRows = Math.round((event.clientY - state.startY) / rowUnit)

    let nextW = state.originW
    let nextH = state.originH

    if (state.axis === 'x' || state.axis === 'both') {
      const maxW = Math.min(getMaxWidth(anchor), cols - anchor.x + 1)
      nextW = clamp(state.originW + deltaCols, getMinWidth(anchor), Math.max(getMinWidth(anchor), maxW))
    }

    if (state.axis === 'y' || state.axis === 'both') {
      nextH = clamp(state.originH + deltaRows, getMinHeight(anchor), getMaxHeight(anchor))
    }

    const snapped = snapForResize(anchor, state.baseLayout, nextW, nextH, state.axis, cols)
    nextW = snapped.w
    nextH = snapped.h

    const draft = state.baseLayout.map((entry) =>
      entry.id === state.id
        ? {
            ...entry,
            w: nextW,
            h: nextH,
          }
        : { ...entry },
    )

    previewLayout.value = rebalance(draft, cols, state.id)
    previewAnchorId.value = state.id
    setGuides(snapped.vertical, snapped.horizontal)
  }
}

function endPointerAction(): void {
  if (previewLayout.value) {
    applyActiveLayout(previewLayout.value)
  }
  dragging.value = null
  resizing.value = null
  clearPreview()
}

function undo(): void {
  if (!undoStack.value.length) return
  redoStack.value.push(cloneLayoutMap(layouts.value))
  const previous = undoStack.value.pop()
  if (!previous) return
  layouts.value = previous
  clearPreview()
  emit('layout-change', serializeLayouts(layouts.value))
}

function redo(): void {
  if (!redoStack.value.length) return
  undoStack.value.push(cloneLayoutMap(layouts.value))
  const next = redoStack.value.pop()
  if (!next) return
  layouts.value = next
  clearPreview()
  emit('layout-change', serializeLayouts(layouts.value))
}

function handleKeyDown(event: KeyboardEvent): void {
  const isMeta = event.metaKey || event.ctrlKey
  if (!isMeta) return
  if (event.key.toLowerCase() !== 'z') return

  event.preventDefault()
  if (event.shiftKey) {
    redo()
    return
  }
  undo()
}

async function loadData(): Promise<void> {
  loading.value = true
  feedback.value = ''
  try {
    const [catalog, remoteLayout] = await Promise.all([props.adapter.listWidgets(), props.adapter.loadLayout()])
    widgetCatalog.value = catalog
    const normalized = remoteLayout.length
      ? normalizeFromSerialized(remoteLayout)
      : buildDefaultLayouts(catalog)
    layouts.value = normalized
    ensureBreakpointLayout(activeBreakpoint.value)
    undoStack.value = []
    redoStack.value = []
  } catch (err) {
    const error = err instanceof Error ? err : new Error('加载仪表盘数据失败')
    emit('error', error)
    feedback.value = error.message
  } finally {
    loading.value = false
  }
}

async function save(): Promise<void> {
  saving.value = true
  feedback.value = ''
  try {
    const payload = serializeLayouts(layouts.value)
    await props.adapter.saveLayout(payload)
    emit('saved', payload)
    feedback.value = '布局已保存'
  } catch (err) {
    const error = err instanceof Error ? err : new Error('保存仪表盘布局失败')
    emit('error', error)
    feedback.value = error.message
  } finally {
    saving.value = false
  }
}

function toggleEditing(next?: boolean): void {
  if (isReadonly.value) return
  if (typeof next === 'boolean') {
    editing.value = next
    return
  }
  editing.value = !editing.value
}

watch(
  () => props.editing,
  (next) => {
    if (typeof next !== 'boolean') return
    editing.value = next && !props.readonly
  },
)

function setEditScope(scope: DashboardEditScope): void {
  if (editScope.value === scope) return
  editScope.value = scope
  clearPreview()
  dragging.value = null
  resizing.value = null
}

function getLayout(): DashboardLayoutItem[] {
  return serializeLayouts(layouts.value)
}

defineExpose<DashboardBuilderExpose>({
  reload: loadData,
  save,
  toggleEditing,
  getLayout,
})

onMounted(() => {
  activeBreakpoint.value = detectBreakpoint(window.innerWidth)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', endPointerAction)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleWindowResize)
  void loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', endPointerAction)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <div class="r-dashboard-builder" data-testid="dashboard-builder">
    <div class="r-dashboard-builder__toolbar">
      <div class="r-dashboard-builder__title">
        <RIcon name="layout-grid" :size="18" />
        <span>仪表盘编排</span>
        <span class="r-dashboard-builder__breakpoint" data-testid="dashboard-breakpoint">{{
          activeBreakpoint.toUpperCase()
        }}</span>
      </div>

      <div class="r-dashboard-builder__toolbar-actions">
        <NButton
          v-if="editing && !isReadonly"
          quaternary
          size="small"
          :disabled="!canUndo"
          data-testid="dashboard-undo"
          @click="undo"
        >
          <template #icon><RIcon name="rotate-ccw" :size="16" /></template>
          撤销
        </NButton>
        <NButton
          v-if="editing && !isReadonly"
          quaternary
          size="small"
          :disabled="!canRedo"
          data-testid="dashboard-redo"
          @click="redo"
        >
          <template #icon><RIcon name="refresh-cw" :size="16" /></template>
          重做
        </NButton>
        <div v-if="editing && !isReadonly" class="r-dashboard-builder__scope-switch" data-testid="dashboard-scope-switch">
          <button
            class="r-dashboard-builder__scope-btn"
            :class="{ 'r-dashboard-builder__scope-btn--active': editScope === 'current' }"
            type="button"
            data-testid="dashboard-scope-current"
            @click="setEditScope('current')"
          >
            当前断点
          </button>
          <button
            class="r-dashboard-builder__scope-btn"
            :class="{ 'r-dashboard-builder__scope-btn--active': editScope === 'all' }"
            type="button"
            data-testid="dashboard-scope-all"
            @click="setEditScope('all')"
          >
            同步全部断点
          </button>
        </div>
        <NButton
          v-if="!isReadonly"
          quaternary
          size="small"
          data-testid="dashboard-toggle-edit"
          @click="toggleEditing()"
        >
          <template #icon><RIcon :name="editing ? 'eye' : 'edit'" :size="16" /></template>
          {{ editing ? '预览模式' : '编辑模式' }}
        </NButton>
        <NButton
          v-if="editing && !isReadonly"
          size="small"
          :loading="saving"
          type="primary"
          data-testid="dashboard-save-layout"
          @click="save"
        >
          <template #icon><RIcon name="save" :size="16" /></template>
          保存布局
        </NButton>
      </div>
    </div>

    <div v-if="feedback" class="r-dashboard-builder__feedback" data-testid="dashboard-feedback">
      {{ feedback }}
    </div>

    <div v-if="loading" class="r-dashboard-builder__loading" data-testid="dashboard-loading">
      <RIcon name="loader" :size="18" class="r-dashboard-builder__spinner" />
      <span>正在加载仪表盘...</span>
    </div>

    <template v-else>
      <div v-if="editing && !isReadonly" class="r-dashboard-builder__palette" data-testid="dashboard-palette">
        <div class="r-dashboard-builder__palette-title">可用组件</div>
        <div class="r-dashboard-builder__palette-list">
          <button
            v-for="widget in addableWidgets"
            :key="widget.type"
            class="r-dashboard-builder__palette-item"
            type="button"
            data-testid="dashboard-palette-item"
            @click="addWidget(widget.type)"
          >
            <RIcon :name="widget.icon || 'plus-circle'" :size="16" />
            <span>{{ widget.title }}</span>
          </button>
        </div>
      </div>

      <div
        v-if="renderedLayout.length"
        ref="gridRef"
        class="r-dashboard-builder__grid"
        :style="gridStyle"
        data-testid="dashboard-grid"
      >
        <div
          v-if="previewRect"
          class="r-dashboard-builder__preview"
          :style="{
            gridColumnStart: String(previewRect.x),
            gridColumnEnd: `span ${previewRect.w}`,
            gridRowStart: String(previewRect.y),
            gridRowEnd: `span ${previewRect.h}`,
          }"
          data-testid="dashboard-preview-placeholder"
        />

        <div
          v-for="(line, index) in guideLines.vertical"
          :key="`v-${index}-${line}`"
          class="r-dashboard-builder__guide r-dashboard-builder__guide--vertical"
          :style="{ left: `${line}px` }"
          data-testid="dashboard-guide-vertical"
        />
        <div
          v-for="(line, index) in guideLines.horizontal"
          :key="`h-${index}-${line}`"
          class="r-dashboard-builder__guide r-dashboard-builder__guide--horizontal"
          :style="{ top: `${line}px` }"
          data-testid="dashboard-guide-horizontal"
        />

        <article
          v-for="(item, index) in renderedLayout"
          :key="item.id"
          class="r-dashboard-builder__item"
          :class="{ 'r-dashboard-builder__item--dragging': dragging?.id === item.id }"
          :style="{
            gridColumnStart: String(item.x),
            gridColumnEnd: `span ${item.w}`,
            gridRowStart: String(item.y),
            gridRowEnd: `span ${item.h}`,
          }"
          data-testid="dashboard-widget"
        >
          <header
            class="r-dashboard-builder__item-header"
            :class="{ 'r-dashboard-builder__item-header--draggable': editing && !isReadonly }"
            @pointerdown="beginDrag($event, item)"
          >
            <div class="r-dashboard-builder__item-title">
              <RIcon :name="definitionMap.get(item.type)?.icon || 'layout-grid'" :size="16" />
              <div class="r-dashboard-builder__item-texts">
                <span>{{ getWidgetDisplayTitle(item) }}</span>
                <small v-if="getWidgetDisplayDescription(item)" class="r-dashboard-builder__item-description">
                  {{ getWidgetDisplayDescription(item) }}
                </small>
              </div>
            </div>
            <div class="r-dashboard-builder__item-actions" @pointerdown.stop>
              <span v-if="editing && !isReadonly" class="r-dashboard-builder__size-chip" data-testid="dashboard-widget-size">{{
                getCurrentSizeLabel(item)
              }}</span>
              <template v-if="editing && !isReadonly">
                <button
                  v-if="getWidgetEditor(item.type)"
                  class="r-dashboard-builder__icon-btn"
                  type="button"
                  data-testid="dashboard-widget-edit"
                  @click="openWidgetEditor(item)"
                >
                  <RIcon name="settings" :size="14" />
                </button>
                <button
                  class="r-dashboard-builder__icon-btn"
                  type="button"
                  data-testid="dashboard-widget-move-up"
                  @click="moveWidget(index, 'up')"
                >
                  <RIcon name="arrow-up" :size="14" />
                </button>
                <button
                  class="r-dashboard-builder__icon-btn"
                  type="button"
                  data-testid="dashboard-widget-move-down"
                  @click="moveWidget(index, 'down')"
                >
                  <RIcon name="arrow-down" :size="14" />
                </button>
                <button
                  class="r-dashboard-builder__icon-btn"
                  type="button"
                  data-testid="dashboard-widget-cycle-size"
                  @click="cycleSize(item.id)"
                >
                  <RIcon name="expand" :size="14" />
                </button>
                <button
                  class="r-dashboard-builder__icon-btn r-dashboard-builder__icon-btn--danger"
                  type="button"
                  data-testid="dashboard-widget-remove"
                  @click="removeWidget(item.id)"
                >
                  <RIcon name="trash" :size="14" />
                </button>
              </template>
            </div>
          </header>

          <div class="r-dashboard-builder__item-content">
            <slot name="widget" :item="item" :definition="definitionMap.get(item.type)">
              <component
                :is="getWidgetRenderer(item.type)"
                v-if="getWidgetRenderer(item.type)"
                :item="item"
                :definition="definitionMap.get(item.type)"
                :config="item.config"
                :fallback-title="definitionMap.get(item.type)?.title"
                :fallback-description="definitionMap.get(item.type)?.description"
              />
              <REmptyState
                v-else
                icon="layout-grid"
                title="组件未注册"
                description="请为该组件类型提供渲染器。"
                size="small"
              />
            </slot>
          </div>

          <template v-if="editing && !isReadonly">
            <button
              class="r-dashboard-builder__resize-handle r-dashboard-builder__resize-handle--x"
              type="button"
              data-testid="dashboard-widget-resize-x"
              @pointerdown.stop="beginResize($event, item, 'x')"
            >
              <RIcon name="chevrons-right" :size="12" />
            </button>
            <button
              class="r-dashboard-builder__resize-handle r-dashboard-builder__resize-handle--y"
              type="button"
              data-testid="dashboard-widget-resize-y"
              @pointerdown.stop="beginResize($event, item, 'y')"
            >
              <RIcon name="chevrons-down" :size="12" />
            </button>
            <button
              class="r-dashboard-builder__resize-handle r-dashboard-builder__resize-handle--both"
              type="button"
              data-testid="dashboard-widget-resize-both"
              @pointerdown.stop="beginResize($event, item, 'both')"
            >
              <RIcon name="maximize-2" :size="12" />
            </button>
          </template>
        </article>
      </div>

      <REmptyState
        v-else
        icon="layout-grid"
        title="当前没有组件"
        description="请在编辑模式下从组件面板添加内容。"
        action-label="重新加载默认组件"
        data-testid="dashboard-empty"
        @action="loadData"
      />
    </template>

    <NDrawer
      :show="Boolean(editorWidgetId && editingWidget && editingWidgetDefinition)"
      width="460"
      placement="right"
      @update:show="(value) => { if (!value) closeWidgetEditor() }"
    >
      <NDrawerContent title="编辑 Widget" closable>
        <component
          :is="editingWidget ? getWidgetEditor(editingWidget.type) : undefined"
          v-if="editingWidget && editingWidgetDefinition"
          :model-value="editorDraftConfig"
          :definition="editingWidgetDefinition"
          data-testid="dashboard-widget-editor"
          @update:model-value="updateWidgetEditorDraft"
        />
        <template #footer>
          <div class="r-dashboard-builder__editor-actions">
            <NButton size="small" quaternary @click="closeWidgetEditor">取消</NButton>
            <NButton size="small" type="primary" @click="saveWidgetEditor">保存配置</NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.r-dashboard-builder {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-4);
}

.r-dashboard-builder__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ra-spacing-3);
}

.r-dashboard-builder__title {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  font-size: var(--ra-font-size-base);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
}

.r-dashboard-builder__breakpoint {
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-full);
  padding: 0 var(--ra-spacing-2);
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}

.r-dashboard-builder__toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-2);
}

.r-dashboard-builder__scope-switch {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  overflow: hidden;
}

.r-dashboard-builder__scope-btn {
  border: none;
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-xs);
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  cursor: pointer;
}

.r-dashboard-builder__scope-btn + .r-dashboard-builder__scope-btn {
  border-left: 1px solid var(--ra-color-border-default);
}

.r-dashboard-builder__scope-btn--active {
  background: var(--ra-color-brand-subtle);
  color: var(--ra-color-brand-primary);
  font-weight: var(--ra-font-weight-semibold);
}

.r-dashboard-builder__feedback {
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
  border-radius: var(--ra-radius-md);
  border: 1px solid var(--ra-color-border-default);
  background: var(--ra-color-bg-surface-secondary);
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-xs);
}

.r-dashboard-builder__loading {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-sm);
}

.r-dashboard-builder__spinner {
  animation: rdb-spin 1s linear infinite;
}

.r-dashboard-builder__palette {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
  padding: var(--ra-spacing-3);
  border: 1px dashed var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  background: var(--ra-color-bg-surface-secondary);
}

.r-dashboard-builder__palette-title {
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--ra-letter-spacing-wide);
}

.r-dashboard-builder__palette-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ra-spacing-2);
}

.r-dashboard-builder__palette-item {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-secondary);
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  font-size: var(--ra-font-size-xs);
  cursor: pointer;
}

.r-dashboard-builder__palette-item:hover {
  border-color: var(--ra-color-border-interactive);
  color: var(--ra-color-text-primary);
}

.r-dashboard-builder__grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--rdb-cols, 12), minmax(0, 1fr));
  grid-auto-rows: var(--rdb-row-height, 72px);
  gap: var(--rdb-gap, 16px);
}

.r-dashboard-builder__preview {
  border: 2px dashed var(--ra-color-border-interactive);
  border-radius: var(--ra-radius-lg);
  background: color-mix(in srgb, var(--ra-color-brand-subtle) 55%, transparent);
  pointer-events: none;
  transition: all var(--ra-transition-fast);
}

.r-dashboard-builder__guide {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  background: color-mix(in srgb, var(--ra-color-brand-primary) 60%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ra-color-brand-primary) 20%, transparent);
}

.r-dashboard-builder__guide--vertical {
  top: 0;
  bottom: 0;
  width: 2px;
}

.r-dashboard-builder__guide--horizontal {
  left: 0;
  right: 0;
  height: 2px;
}

.r-dashboard-builder__item {
  min-width: 0;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-3);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  background: var(--ra-color-bg-surface);
  box-shadow: var(--ra-shadow-sm);
  transition:
    border-color var(--ra-transition-fast),
    box-shadow var(--ra-transition-fast),
    opacity var(--ra-transition-fast),
    transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.r-dashboard-builder__item--dragging {
  opacity: 0.85;
  border-color: var(--ra-color-border-interactive);
  box-shadow: var(--ra-shadow-md);
  transform: scale(1.01);
}

.r-dashboard-builder__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ra-spacing-2);
}

.r-dashboard-builder__item-header--draggable {
  cursor: move;
}

.r-dashboard-builder__item-title {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-semibold);
}

.r-dashboard-builder__item-texts {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.r-dashboard-builder__item-description {
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-regular);
}

.r-dashboard-builder__item-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
}

.r-dashboard-builder__size-chip {
  border-radius: var(--ra-radius-full);
  border: 1px solid var(--ra-color-border-default);
  padding: 1px var(--ra-spacing-2);
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}

.r-dashboard-builder__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-secondary);
  cursor: pointer;
}

.r-dashboard-builder__icon-btn:hover {
  border-color: var(--ra-color-border-interactive);
  color: var(--ra-color-text-primary);
}

.r-dashboard-builder__icon-btn--danger:hover {
  border-color: var(--ra-color-danger-text);
  color: var(--ra-color-danger-text);
}

.r-dashboard-builder__item-content {
  min-height: 0;
  flex: 1;
}

.r-dashboard-builder__editor-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: var(--ra-spacing-2);
}

.r-dashboard-builder__resize-handle {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-sm);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-tertiary);
  opacity: 0;
  transition: opacity var(--ra-transition-fast), color var(--ra-transition-fast), border-color var(--ra-transition-fast);
}

.r-dashboard-builder__item:hover .r-dashboard-builder__resize-handle {
  opacity: 1;
}

.r-dashboard-builder__resize-handle:hover {
  color: var(--ra-color-text-primary);
  border-color: var(--ra-color-border-interactive);
}

.r-dashboard-builder__resize-handle--x {
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.r-dashboard-builder__resize-handle--y {
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.r-dashboard-builder__resize-handle--both {
  right: 6px;
  bottom: 6px;
  cursor: nwse-resize;
}

@media (max-width: 1024px) {
  .r-dashboard-builder__resize-handle {
    display: none;
  }
}

@media (max-width: 640px) {
  .r-dashboard-builder__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .r-dashboard-builder__toolbar-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .r-dashboard-builder__scope-switch {
    width: 100%;
  }

  .r-dashboard-builder__scope-btn {
    flex: 1;
    text-align: center;
  }
}

@keyframes rdb-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>

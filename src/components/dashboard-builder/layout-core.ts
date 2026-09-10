import type {
  DashboardBreakpoint,
  DashboardLayoutItem,
  DashboardSizePreset,
} from './types'

export interface PlacedLayoutItem extends DashboardLayoutItem {
  x: number
  y: number
}

export type LayoutByBreakpoint = Record<DashboardBreakpoint, PlacedLayoutItem[]>

export interface SnapResult {
  vertical: number[]
  horizontal: number[]
}

export interface ResizeConstraints {
  getMinWidth: (item: PlacedLayoutItem) => number
  getMinHeight: (item: PlacedLayoutItem) => number
  getMaxWidth: (item: PlacedLayoutItem) => number
  getMaxHeight: (item: PlacedLayoutItem) => number
}

export const GRID_GAP_PX = 16
export const GRID_ROW_HEIGHT_PX = 72
export const MIN_W = 2
export const MIN_H = 1
export const HISTORY_LIMIT = 50

export const DEFAULT_SIZE_PRESETS: DashboardSizePreset[] = [
  { key: 's', label: 'S', w: 3, h: 2 },
  { key: 'm', label: 'M', w: 4, h: 2 },
  { key: 'l', label: 'L', w: 6, h: 3 },
]

export function clonePlacedLayout(items: PlacedLayoutItem[]): PlacedLayoutItem[] {
  return items.map((item) => ({
    ...item,
    config: item.config ? { ...item.config } : undefined,
    responsive: item.responsive ? { ...item.responsive } : undefined,
  }))
}

export function cloneLayoutMap(source: LayoutByBreakpoint): LayoutByBreakpoint {
  return {
    lg: clonePlacedLayout(source.lg),
    md: clonePlacedLayout(source.md),
    sm: clonePlacedLayout(source.sm),
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function normalizePlaced(
  item: DashboardLayoutItem,
  fallbackIndex: number,
  cols: number,
): PlacedLayoutItem | null {
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

export function canPlace(
  candidate: PlacedLayoutItem,
  items: PlacedLayoutItem[],
  ignoreId?: string,
): boolean {
  return !items.some(
    (item) =>
      item.id !== ignoreId &&
      !(
        candidate.x + candidate.w <= item.x ||
        item.x + item.w <= candidate.x ||
        candidate.y + candidate.h <= item.y ||
        item.y + item.h <= candidate.y
      ),
  )
}

export function findFirstFit(
  w: number,
  h: number,
  items: PlacedLayoutItem[],
  cols: number,
  ignoreId?: string,
): { x: number; y: number } {
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

export function compactLayout(
  items: PlacedLayoutItem[],
  cols: number,
  fixedId?: string,
): PlacedLayoutItem[] {
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

export function rebalance(
  items: PlacedLayoutItem[],
  cols: number,
  anchorId?: string,
): PlacedLayoutItem[] {
  const placed: PlacedLayoutItem[] = []
  const anchor = anchorId ? items.find((item) => item.id === anchorId) : undefined

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

export function deriveLayout(source: PlacedLayoutItem[], cols: number): PlacedLayoutItem[] {
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

export function serializeLayouts(source: LayoutByBreakpoint): DashboardLayoutItem[] {
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
      const differsFromLg =
        !lg || lg.x !== item.x || lg.y !== item.y || lg.w !== item.w || lg.h !== item.h
      if (differsFromLg) {
        target.responsive ??= {}
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

function findBestSnap(
  diffCandidates: Array<{ diff: number; line: number }>,
  threshold = 0.45,
): { diff: number; line: number } | null {
  let best: { diff: number; line: number } | null = null
  for (const candidate of diffCandidates) {
    if (Math.abs(candidate.diff) > threshold) continue
    if (!best || Math.abs(candidate.diff) < Math.abs(best.diff)) {
      best = candidate
    }
  }
  return best
}

function collectSnapLines(anchor: PlacedLayoutItem, baseLayout: PlacedLayoutItem[], cols: number) {
  const xLines = [1, cols + 1]
  const yLines = [1]
  for (const item of baseLayout) {
    if (item.id === anchor.id) continue
    xLines.push(item.x, item.x + item.w)
    yLines.push(item.y, item.y + item.h)
  }
  return { xLines, yLines }
}

export function snapForDrag(
  anchor: PlacedLayoutItem,
  baseLayout: PlacedLayoutItem[],
  proposedX: number,
  proposedY: number,
  cols: number,
): { x: number; y: number } & SnapResult {
  let x = proposedX
  let y = proposedY
  const vertical: number[] = []
  const horizontal: number[] = []
  const { xLines, yLines } = collectSnapLines(anchor, baseLayout, cols)
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
    x = clamp(bestX === snapRight ? bestX.line - anchor.w : bestX.line, 1, cols - anchor.w + 1)
    vertical.push(bestX.line)
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
    y = Math.max(1, bestY === snapBottom ? bestY.line - anchor.h : bestY.line)
    horizontal.push(bestY.line)
  }

  return { x, y, vertical, horizontal }
}

export function snapForResize(
  anchor: PlacedLayoutItem,
  baseLayout: PlacedLayoutItem[],
  proposedW: number,
  proposedH: number,
  axis: 'x' | 'y' | 'both',
  cols: number,
  constraints: ResizeConstraints,
): { w: number; h: number } & SnapResult {
  let w = proposedW
  let h = proposedH
  const vertical: number[] = []
  const horizontal: number[] = []
  const { xLines, yLines } = collectSnapLines(anchor, baseLayout, cols)

  if (axis === 'x' || axis === 'both') {
    const right = anchor.x + w
    const snap = findBestSnap(xLines.map((line) => ({ diff: line - right, line })))
    if (snap) {
      w = clamp(
        snap.line - anchor.x,
        constraints.getMinWidth(anchor),
        Math.min(constraints.getMaxWidth(anchor), cols - anchor.x + 1),
      )
      vertical.push(snap.line)
    }
  }

  if (axis === 'y' || axis === 'both') {
    const bottom = anchor.y + h
    const snap = findBestSnap(yLines.map((line) => ({ diff: line - bottom, line })))
    if (snap) {
      h = clamp(snap.line - anchor.y, constraints.getMinHeight(anchor), constraints.getMaxHeight(anchor))
      horizontal.push(snap.line)
    }
  }

  return { w, h, vertical, horizontal }
}

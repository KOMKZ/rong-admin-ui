/**
 * useEditableRows：表格工作台的行编辑状态原语（ticket 000608 P1-07）。
 * 职责：行集合持有、单元格写入、脏行集合（新增/修改）、复制行、批量移除、单行还原、
 * 保存后清理。跨页面复用的通用交互，不承载任何业务字段或请求逻辑。
 * 上游：两个表格工作台页面（文案库 / 路线条目）；下游：REditableCell 与页面保存动作。
 * 维护：行身份字段固定为 rowKeyField（默认 'rowKey'）；快照 diff 是脏判定的唯一事实。
 */
import { computed, reactive, ref, shallowRef } from 'vue'
import type { EditableRowsExpose } from './types'

export interface EditableRowsOptions {
  /** 行身份字段名；默认 'rowKey'。 */
  rowKeyField?: string
  /** 复制行时的新身份生成器；提供后 duplicateRow 自动派生唯一行键。 */
  rowKeyFactory?: () => string
}

export function useEditableRows<T extends Record<string, unknown>>(
  options: EditableRowsOptions = {},
): EditableRowsExpose<T> & { dirtyDetail: (key: string) => boolean } {
  const rowKeyField = options.rowKeyField ?? 'rowKey'
  const rows = ref<T[]>([]) as { value: T[] }
  // 原始快照：键 → 行浅拷贝；新增行无快照即视为脏。
  const snapshots = shallowRef(new Map<string, T>())

  function rowKey(row: T): string {
    return String(row[rowKeyField])
  }

  function indexOf(key: string): number {
    return rows.value.findIndex((row) => rowKey(row) === key)
  }

  function isDirty(key: string): boolean {
    const index = indexOf(key)
    if (index < 0) return false
    const snapshot = snapshots.value.get(key)
    if (!snapshot) return true
    return JSON.stringify(rows.value[index]) !== JSON.stringify(snapshot)
  }

  const dirtyRowKeys = computed(() => rows.value.map(rowKey).filter((key) => isDirty(key)))
  const hasDirty = computed(() => dirtyRowKeys.value.length > 0)

  function setRows(next: T[]): void {
    rows.value = next.map((row) => ({ ...row }))
    const nextSnapshots = new Map<string, T>()
    for (const row of rows.value) {
      nextSnapshots.set(rowKey(row), { ...row })
    }
    snapshots.value = nextSnapshots
  }

  function setCellValue(key: string, field: string, value: unknown): void {
    const index = indexOf(key)
    if (index < 0) return
    rows.value[index] = { ...rows.value[index], [field]: value }
  }

  function addBlankRow(factory: () => T): T {
    const row = factory()
    rows.value = [...rows.value, row]
    return row
  }

  function duplicateRow(key: string, override: Partial<T> = {}): T | null {
    const index = indexOf(key)
    if (index < 0) return null
    const source = rows.value[index]
    // 复制行必须获得新身份；rowKeyFactory 缺省时由调用方 override 提供。
    const derived = options.rowKeyFactory ? ({ [rowKeyField]: options.rowKeyFactory() } as Partial<T>) : {}
    const clone = { ...source, ...derived, ...override } as T
    rows.value.splice(index + 1, 0, clone)
    rows.value = [...rows.value]
    return clone
  }

  function removeRows(keys: string[]): void {
    const doomed = new Set(keys)
    rows.value = rows.value.filter((row) => !doomed.has(rowKey(row)))
    const nextSnapshots = new Map(snapshots.value)
    for (const key of keys) nextSnapshots.delete(key)
    snapshots.value = nextSnapshots
  }

  function revertRow(key: string): void {
    const index = indexOf(key)
    const snapshot = snapshots.value.get(key)
    if (index < 0) return
    if (!snapshot) {
      // 新增行无快照：还原即移除。
      removeRows([key])
      return
    }
    rows.value[index] = { ...snapshot }
  }

  function markClean(keys?: string[]): void {
    const targets = keys ?? rows.value.map(rowKey)
    const nextSnapshots = new Map(snapshots.value)
    for (const key of targets) {
      const index = indexOf(key)
      if (index >= 0) nextSnapshots.set(key, { ...rows.value[index] })
    }
    snapshots.value = nextSnapshots
  }

  // reactive 包装让消费方（含测试与模板）直接拿到解包后的 rows/派生态。
  return reactive({
    rows,
    dirtyRowKeys,
    hasDirty,
    isDirty,
    dirtyDetail: isDirty,
    setCellValue,
    addBlankRow,
    duplicateRow,
    removeRows,
    revertRow,
    markClean,
    setRows,
  }) as unknown as EditableRowsExpose<T> & { dirtyDetail: (key: string) => boolean; rows: T[] }
}

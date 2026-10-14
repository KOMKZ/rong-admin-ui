/**
 * TSV 剪贴板原语（ticket 000608 P1-07）：多行多列粘贴解析与锚点越界报告。
 * 纯函数 + 事件适配层，不承载业务字段；Excel/飞书表格复制内容默认为 TSV。
 * 上游：表格工作台页面的 paste 事件；下游：useEditableRows.setCellValue。
 * 维护：解析只做 \t/\r\n 切分与尾行容忍；越界以 anchor 字段序列为准，多余列整体丢弃并报告。
 */
import type { TsvPasteAnchor, TsvPasteResult } from './types'

/** parseTsvMatrix 解析 TSV 文本为二维矩阵（容忍尾随空行与 \r\n）。 */
export function parseTsvMatrix(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.map((line) => line.split('\t'))
}

/** buildTsvPastePlan 计算粘贴计划：逐格更新 + 越界统计（纯函数，便于单测）。 */
export function buildTsvPastePlan(
  text: string,
  anchor: TsvPasteAnchor,
): TsvPasteResult {
  const matrix = parseTsvMatrix(text)
  const updates: TsvPasteResult['updates'] = []
  if (matrix.length === 0 || anchor.fields.length === 0) {
    return { updates, overflowRows: 0, overflowCols: Math.max(0, 0) }
  }
  const maxRows = anchor.maxRows ?? Number.POSITIVE_INFINITY
  const usableRows = Math.min(matrix.length, maxRows)
  for (let r = 0; r < usableRows; r += 1) {
    const row = matrix[r]
    const fieldCount = Math.min(row.length, anchor.fields.length)
    for (let c = 0; c < fieldCount; c += 1) {
      updates.push({ rowIndex: anchor.rowIndex + r, field: anchor.fields[c], value: row[c] })
    }
  }
  const widest = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  return {
    updates,
    overflowRows: Math.max(0, matrix.length - usableRows),
    overflowCols: Math.max(0, widest - anchor.fields.length),
  }
}

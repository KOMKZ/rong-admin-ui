import type { MiniRichTextCompatibilityIssue } from './types'

const unsupportedMiniTags = ['table', 'thead', 'tbody', 'tr', 'td', 'th', 'video']

export function inspectMiniRichTextCompatibility(input: string): MiniRichTextCompatibilityIssue[] {
  const content = input.trim()
  if (!content) return []

  const issues: MiniRichTextCompatibilityIssue[] = []
  const lower = content.toLowerCase()

  for (const tag of unsupportedMiniTags) {
    if (lower.includes(`<${tag}`)) {
      issues.push({
        level: 'error',
        message: `小程序富文本暂不支持 <${tag}>，发布时会被移除。`,
      })
    }
  }

  if (/\sstyle\s*=/i.test(content)) {
    issues.push({
      level: 'warning',
      message: '小程序仅保留颜色、对齐和图片宽度等少量样式。',
    })
  }

  return issues
}

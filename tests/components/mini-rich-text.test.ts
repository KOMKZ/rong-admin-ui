import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RMiniRichTextPreview from '../../src/components/mini-rich-text/RMiniRichTextPreview.vue'
import {
  inspectMiniRichTextCompatibility,
  sanitizeMiniRichText,
} from '../../src/components/mini-rich-text'

describe('mini rich text', () => {
  it('sanitizes unsupported tags and unsafe attributes', () => {
    const safe = sanitizeMiniRichText(
      '<h1>标题</h1><p onclick="bad()">正文</p><script>alert(1)</script><a href="javascript:bad()">链接</a><img src="https://example.com/a.png" onerror="bad()" />',
    )

    expect(safe).not.toContain('<script')
    expect(safe).not.toContain('onclick')
    expect(safe).not.toContain('javascript:')
    expect(safe).toContain('<p>正文</p>')
    expect(safe).toContain('src="https://example.com/a.png"')
  })

  it('removes unsupported mini-program media tags and reports compatibility issues', () => {
    const raw =
      '<p style="color: #f00; position: fixed">正文</p><table><tr><td>表格</td></tr></table><video src="/a.mp4"></video>'
    const safe = sanitizeMiniRichText(raw)
    const issues = inspectMiniRichTextCompatibility(raw)

    expect(safe).toContain('style="color: #f00"')
    expect(safe).not.toContain('<table')
    expect(safe).not.toContain('<video')
    expect(issues.some((issue) => issue.message.includes('<table>'))).toBe(true)
    expect(issues.some((issue) => issue.message.includes('<video>'))).toBe(true)
  })

  it('renders preview content and empty state', () => {
    const wrapper = mount(RMiniRichTextPreview, {
      props: {
        content: '<h2>公告详情</h2><p>正文</p>',
      },
    })

    expect(wrapper.find('.r-mini-rich-preview__body').exists()).toBe(true)
    expect(wrapper.html()).toContain('公告详情')

    const empty = mount(RMiniRichTextPreview, {
      props: {
        content: '',
        emptyText: '暂无正文',
      },
    })
    expect(empty.text()).toContain('暂无正文')
  })
})

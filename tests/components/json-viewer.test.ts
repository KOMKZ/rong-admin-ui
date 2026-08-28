import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RJsonViewer from '../../src/components/json-viewer/RJsonViewer.vue'
import type { JsonViewerExpose } from '../../src/components/json-viewer/types'
import { naiveStubs } from '../helpers/naive-stubs'

function mountViewer(props: Record<string, unknown>) {
  return mount(RJsonViewer, {
    props,
    global: {
      stubs: naiveStubs(['Modal']),
    },
  })
}

describe('RJsonViewer', () => {
  it('formats object values with line numbers and json tokens', () => {
    const wrapper = mountViewer({
      value: { name: 'demo', count: 2, enabled: true, nested: { value: null } },
      title: '输入快照',
    })

    expect(wrapper.find('[data-testid="json-viewer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('输入快照')
    expect(wrapper.text()).toContain('"name":')
    expect(wrapper.text()).toContain('"demo"')
    expect(wrapper.text()).toContain('JSON')
    expect(wrapper.find('.r-json-viewer__line-no').text()).toBe('1')
    expect(wrapper.find('.r-json-viewer__token--key').exists()).toBe(true)
  })

  it('parses and prettifies json strings', () => {
    const wrapper = mountViewer({
      value: '{"topic":"AI","items":[1,2]}',
    })

    expect(wrapper.text()).toContain('"topic":')
    expect(wrapper.text()).toContain('"items":')
    expect(wrapper.text()).toContain('2')
  })

  it('keeps non-json strings readable as text', () => {
    const wrapper = mountViewer({
      value: 'provider unavailable',
    })

    expect(wrapper.classes()).toContain('r-json-viewer--text')
    expect(wrapper.text()).toContain('provider unavailable')
    expect(wrapper.text()).toContain('Text')
  })

  it('renders empty text for empty values', () => {
    const wrapper = mountViewer({
      value: '{}',
      emptyText: '暂无数据',
    })

    expect(wrapper.text()).toContain('暂无数据')
    expect(wrapper.text()).toContain('empty')
  })

  it('emits expand when clicking the viewer body', async () => {
    const wrapper = mountViewer({
      value: { ok: true },
    })

    await wrapper.find('[data-testid="json-viewer-body"]').trigger('click')

    expect(wrapper.emitted('expand')?.[0]?.[0]).toContain('"ok": true')
  })

  it('does not expand when expandable is false', async () => {
    const wrapper = mountViewer({
      value: { ok: true },
      expandable: false,
    })

    await wrapper.find('[data-testid="json-viewer-body"]').trigger('click')

    expect(wrapper.emitted('expand')).toBeUndefined()
  })

  it('copies formatted json and exposes imperative actions', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const wrapper = mountViewer({
      value: { ok: true },
    })

    await wrapper.find('[data-testid="json-viewer-copy"]').trigger('click')
    await (wrapper.vm as unknown as JsonViewerExpose).copy()

    expect(writeText).toHaveBeenCalledWith('{\n  "ok": true\n}')
    expect(wrapper.emitted('copy')).toHaveLength(2)
  })
})

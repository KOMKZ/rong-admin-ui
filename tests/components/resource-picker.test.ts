import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RResourcePickerDialog } from '@/components/resource-picker'
import type { ResourcePickerTab } from '@/components/resource-picker'

const tabs = (load: ResourcePickerTab['load']): ResourcePickerTab[] => [
  {
    key: 'person_voice',
    label: '人物音色',
    load,
  },
]

describe('RResourcePickerDialog', () => {
  it('does not load resources when opened by default', () => {
    const load = vi.fn().mockResolvedValue({ items: [], total: 0 })
    const wrapper = mount(RResourcePickerDialog, {
      props: {
        visible: true,
        tabs: tabs(load),
      },
      attachTo: document.body,
    })

    expect(load).not.toHaveBeenCalled()
    expect(document.body.innerHTML).toContain('请选择一个资源类型后加载数据')
    wrapper.unmount()
  })

  it('loads resources after the user activates a resource type', async () => {
    const load = vi.fn().mockResolvedValue({
      items: [{ id: 1, title: '清晰女声' }],
      total: 1,
    })
    const wrapper = mount(RResourcePickerDialog, {
      props: {
        visible: true,
        tabs: tabs(load),
      },
      attachTo: document.body,
    })

    const tab = document.querySelector('[data-testid="resource-picker-dialog-tab-person_voice"]')
    expect(tab).toBeTruthy()
    ;(tab as HTMLButtonElement).click()
    await flushPromises()

    expect(load).toHaveBeenCalledWith({
      tabKey: 'person_voice',
      keyword: '',
      page: 1,
      pageSize: 12,
    })
    expect(document.body.innerHTML).toContain('清晰女声')
    wrapper.unmount()
  })

  it('confirms the selected resource item', async () => {
    const load = vi.fn().mockResolvedValue({
      items: [{ id: 1, title: '清晰女声' }],
      total: 1,
    })
    const wrapper = mount(RResourcePickerDialog, {
      props: {
        visible: true,
        tabs: tabs(load),
      },
      attachTo: document.body,
    })

    ;(
      document.querySelector(
        '[data-testid="resource-picker-dialog-tab-person_voice"]',
      ) as HTMLButtonElement
    ).click()
    await flushPromises()
    ;(
      document.querySelector('[data-testid="resource-picker-dialog-card-1"]') as HTMLElement
    ).click()
    await wrapper.vm.$nextTick()
    ;(
      Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('使用此资源'),
      ) as HTMLButtonElement
    ).click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ id: 1, title: '清晰女声' }])
    expect(wrapper.emitted('confirm')?.[0]).toEqual([
      { item: { id: 1, title: '清晰女声' }, tabKey: 'person_voice' },
    ])
    wrapper.unmount()
  })
})

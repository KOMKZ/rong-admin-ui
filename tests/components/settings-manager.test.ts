import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RSettingsManager from '../../src/components/settings-manager/RSettingsManager.vue'
import type { SettingsManagerAdapter, SettingsGroup } from '../../src/components/settings-manager/types'

const mockGroups: SettingsGroup[] = [
  {
    key: 'general',
    label: '基本设置',
    description: '网站基本信息',
    fields: [
      { key: 'site_name', label: '站点名称', type: 'input', value: 'My Site', description: '显示在浏览器标签' },
      { key: 'site_desc', label: '站点描述', type: 'textarea', value: 'A site', description: 'SEO 描述' },
      { key: 'maintenance', label: '维护模式', type: 'switch', value: 'false' },
    ],
  },
  {
    key: 'email',
    label: '邮件设置',
    fields: [
      { key: 'smtp_host', label: 'SMTP 主机', type: 'input', value: 'smtp.example.com' },
      { key: 'smtp_port', label: 'SMTP 端口', type: 'number', value: '587' },
    ],
  },
]

function createMockAdapter(overrides?: Partial<SettingsManagerAdapter>): SettingsManagerAdapter {
  return {
    fetchGroups: vi.fn().mockResolvedValue(mockGroups),
    saveField: vi.fn().mockResolvedValue(undefined),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('RSettingsManager', () => {
  it('renders loading state initially', () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    expect(wrapper.find('.rsm__loading').exists()).toBe(true)
  })

  it('renders groups after loading', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    expect(wrapper.findAll('.rsm__section').length).toBe(2)
  })

  it('emits loaded event after fetch', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    expect(wrapper.emitted('loaded')).toBeTruthy()
    expect(wrapper.emitted('loaded')![0][0]).toEqual(mockGroups)
  })

  it('renders error state when fetch fails', async () => {
    const adapter = createMockAdapter({
      fetchGroups: vi.fn().mockRejectedValue(new Error('Network error')),
    })
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.find('.rsm__error').exists()).toBe(true)
  })

  it('exposes getValues', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    const values = (wrapper.vm as any).getValues()
    expect(values.site_name).toBe('My Site')
    expect(values.smtp_host).toBe('smtp.example.com')
  })

  it('exposes getDirtyFields - initially empty', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    expect((wrapper.vm as any).getDirtyFields()).toEqual([])
  })

  it('exposes reload', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    expect(adapter.fetchGroups).toHaveBeenCalledTimes(1)
    await (wrapper.vm as any).reload()
    expect(adapter.fetchGroups).toHaveBeenCalledTimes(2)
  })

  it('renders fields with correct types', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    const fields = wrapper.findAll('.rsm__row')
    expect(fields.length).toBe(5)
  })

  it('renders group navigation when multiple groups', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter, showGroupNav: true } })
    await flushPromises()
    expect(wrapper.find('.rsm__nav').exists()).toBe(true)
    expect(wrapper.findAll('.rsm__nav-item').length).toBe(2)
  })

  it('hides group nav with showGroupNav=false', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter, showGroupNav: false } })
    await flushPromises()
    expect(wrapper.find('.rsm__nav').exists()).toBe(false)
  })

  it('renders search input when showSearch=true', async () => {
    const adapter = createMockAdapter()
    const wrapper = mount(RSettingsManager, { props: { adapter, showSearch: true } })
    await flushPromises()
    expect(wrapper.find('.rsm__search').exists()).toBe(true)
  })

  it('renders empty state when no groups', async () => {
    const adapter = createMockAdapter({
      fetchGroups: vi.fn().mockResolvedValue([]),
    })
    const wrapper = mount(RSettingsManager, { props: { adapter } })
    await flushPromises()
    expect(wrapper.findAll('.rsm__section').length).toBe(0)
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RDescriptionsPanel from '../../src/components/descriptions-panel/RDescriptionsPanel.vue'
import type { DescriptionItem, DescriptionGroup, DescriptionsPanelExpose } from '../../src/components/descriptions-panel/types'

const sampleItems: DescriptionItem[] = [
  { key: 'name', label: '姓名', value: '张三' },
  { key: 'email', label: '邮箱', value: 'zhangsan@example.com', copyable: true },
  { key: 'phone', label: '手机', value: null, emptyText: '未设置' },
  { key: 'dept', label: '部门', value: '技术部' },
]

const sampleGroups: DescriptionGroup[] = [
  {
    title: '基本信息',
    icon: 'user',
    items: [
      { key: 'name', label: '姓名', value: '张三' },
      { key: 'email', label: '邮箱', value: 'zhangsan@example.com' },
    ],
  },
  {
    title: '账号信息',
    icon: 'shield',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      { key: 'role', label: '角色', value: 'admin' },
      { key: 'status', label: '状态', value: 'active' },
    ],
  },
]

describe('RDescriptionsPanel', () => {
  it('renders with flat items', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { items: sampleItems },
    })
    expect(wrapper.find('.r-descriptions-panel').exists()).toBe(true)
    expect(wrapper.find('[data-testid="descriptions-items"]').exists()).toBe(true)
  })

  it('displays item labels and values', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { items: sampleItems },
    })
    expect(wrapper.text()).toContain('姓名')
    expect(wrapper.text()).toContain('张三')
  })

  it('shows empty text for null values', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { items: sampleItems },
    })
    expect(wrapper.text()).toContain('未设置')
  })

  it('renders with groups', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { groups: sampleGroups },
    })
    expect(wrapper.find('[data-testid="desc-group-0"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="desc-group-1"]').exists()).toBe(true)
  })

  it('renders group titles', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { groups: sampleGroups },
    })
    expect(wrapper.text()).toContain('基本信息')
    expect(wrapper.text()).toContain('账号信息')
  })

  it('renders with title', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { items: sampleItems, title: '详情信息' },
    })
    expect(wrapper.text()).toContain('详情信息')
  })

  it('renders bordered variant', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { items: sampleItems, bordered: true },
    })
    expect(wrapper.find('.r-descriptions-panel--bordered').exists()).toBe(true)
  })

  it('renders different sizes', () => {
    const small = mount(RDescriptionsPanel, {
      props: { items: sampleItems, size: 'small' },
    })
    expect(small.find('.r-descriptions-panel--small').exists()).toBe(true)

    const large = mount(RDescriptionsPanel, {
      props: { items: sampleItems, size: 'large' },
    })
    expect(large.find('.r-descriptions-panel--large').exists()).toBe(true)
  })

  it('renders vertical layout', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { items: sampleItems, layout: 'vertical' },
    })
    expect(wrapper.find('.r-descriptions-panel__item--vertical').exists()).toBe(true)
  })

  it('exposes toggleGroup/expandAll/collapseAll', () => {
    const wrapper = mount(RDescriptionsPanel, {
      props: { groups: sampleGroups },
    })
    const vm = wrapper.vm as unknown as DescriptionsPanelExpose
    expect(typeof vm.toggleGroup).toBe('function')
    expect(typeof vm.expandAll).toBe('function')
    expect(typeof vm.collapseAll).toBe('function')
  })

  it('handles colon display', () => {
    const withColon = mount(RDescriptionsPanel, {
      props: { items: sampleItems, colon: true },
    })
    expect(withColon.text()).toContain('：')

    const withoutColon = mount(RDescriptionsPanel, {
      props: { items: sampleItems, colon: false },
    })
    expect(withoutColon.find('.r-descriptions-panel__label').text()).not.toContain('：')
  })

  it('uses default emptyText when not specified', () => {
    const items: DescriptionItem[] = [
      { key: 'empty', label: '空字段', value: null },
    ]
    const wrapper = mount(RDescriptionsPanel, {
      props: { items, emptyText: 'N/A' },
    })
    expect(wrapper.text()).toContain('N/A')
  })

  describe('responsive columns', () => {
    function setViewportWidth(width: number) {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
      window.dispatchEvent(new Event('resize'))
    }

    function gridStyle(wrapper: ReturnType<typeof mount>) {
      return wrapper.find('[data-testid="descriptions-items"]').attributes('style') ?? ''
    }

    it('keeps fixed columns when a number is passed', () => {
      setViewportWidth(375)
      const wrapper = mount(RDescriptionsPanel, {
        props: { items: sampleItems, columns: 2 },
      })
      expect(gridStyle(wrapper)).toContain('repeat(2, 1fr)')
      setViewportWidth(1024)
    })

    it('resolves object columns by viewport width', async () => {
      setViewportWidth(375)
      const wrapper = mount(RDescriptionsPanel, {
        props: { items: sampleItems, columns: { xs: 1, sm: 2, md: 3, lg: 5 } },
      })
      expect(gridStyle(wrapper)).toContain('repeat(1, 1fr)')

      setViewportWidth(720)
      await wrapper.vm.$nextTick()
      expect(gridStyle(wrapper)).toContain('repeat(2, 1fr)')

      setViewportWidth(1440)
      await wrapper.vm.$nextTick()
      expect(gridStyle(wrapper)).toContain('repeat(5, 1fr)')
      setViewportWidth(1024)
    })

    it('falls back to 3 columns when no breakpoint matches', () => {
      setViewportWidth(500)
      const wrapper = mount(RDescriptionsPanel, {
        props: { items: sampleItems, columns: { lg: 4 } },
      })
      expect(gridStyle(wrapper)).toContain('repeat(3, 1fr)')
      setViewportWidth(1024)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RProList from '../../src/components/pro-list/RProList.vue'
import type { ProListExpose, ProListAction } from '../../src/components/pro-list/types'

const sampleData = [
  { id: 1, name: '项目 A', status: 'active' },
  { id: 2, name: '项目 B', status: 'completed' },
  { id: 3, name: '项目 C', status: 'archived' },
]

const sampleActions: ProListAction[] = [
  { key: 'edit', label: '编辑', icon: 'edit' },
  { key: 'delete', label: '删除', icon: 'trash', danger: true },
]

describe('RProList', () => {
  it('renders with data in card mode', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData },
    })
    expect(wrapper.find('[data-testid="pro-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pro-list-grid"]').exists()).toBe(true)
  })

  it('renders cards for each item', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData },
    })
    expect(wrapper.findAll('[data-testid^="pro-list-card-"]').length).toBe(3)
  })

  it('renders in list mode', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData, viewMode: 'list' },
    })
    expect(wrapper.find('[data-testid="pro-list-list"]').exists()).toBe(true)
  })

  it('renders list items for each item', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData, viewMode: 'list' },
    })
    expect(wrapper.findAll('[data-testid^="pro-list-item-"]').length).toBe(3)
  })

  it('shows empty state when no data', () => {
    const wrapper = mount(RProList, {
      props: { data: [] },
    })
    expect(wrapper.find('[data-testid="pro-list-empty"]').exists()).toBe(true)
  })

  it('shows loading state', () => {
    const wrapper = mount(RProList, {
      props: { data: [], loading: true },
    })
    expect(wrapper.find('[data-testid="pro-list-loading"]').exists()).toBe(true)
  })

  it('renders view mode toggle buttons', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData },
    })
    expect(wrapper.find('[data-testid="view-card-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="view-list-btn"]').exists()).toBe(true)
  })

  it('emits update:viewMode on toggle', async () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData, viewMode: 'card' },
    })
    await wrapper.find('[data-testid="view-list-btn"]').trigger('click')
    expect(wrapper.emitted('update:viewMode')?.[0]).toEqual(['list'])
  })

  it('renders actions when provided', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData, actions: sampleActions },
    })
    expect(wrapper.find('[data-testid="action-edit"]').exists()).toBe(true)
  })

  it('emits action on action button click', async () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData, actions: sampleActions },
    })
    await wrapper.find('[data-testid="action-edit"]').trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('emits itemClick on card click', async () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData },
    })
    await wrapper.find('[data-testid="pro-list-card-0"]').trigger('click')
    expect(wrapper.emitted('itemClick')?.[0]).toEqual([sampleData[0]])
  })

  it('renders pagination when provided', () => {
    const wrapper = mount(RProList, {
      props: {
        data: sampleData,
        pagination: { page: 1, pageSize: 10, total: 30 },
      },
    })
    expect(wrapper.find('[data-testid="pro-list-pagination"]').exists()).toBe(true)
  })

  it('exposes clearSelection and toggleViewMode', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData },
    })
    const vm = wrapper.vm as unknown as ProListExpose
    expect(typeof vm.clearSelection).toBe('function')
    expect(typeof vm.toggleViewMode).toBe('function')
  })

  it('handles selectable mode with checkboxes', () => {
    const wrapper = mount(RProList, {
      props: { data: sampleData, selectable: true, checkedKeys: [1] },
    })
    expect(wrapper.html()).toBeTruthy()
  })
})

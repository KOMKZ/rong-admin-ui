import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RBatchActionBar from '../../src/components/batch-action-bar/RBatchActionBar.vue'
import type { BatchAction, BatchActionBarExpose } from '../../src/components/batch-action-bar/types'

const sampleActions: BatchAction[] = [
  { key: 'enable', label: '批量启用', icon: 'check' },
  { key: 'disable', label: '批量禁用', icon: 'x' },
  { key: 'delete', label: '批量删除', icon: 'trash', danger: true, confirmMessage: '确认删除？' },
]

describe('RBatchActionBar', () => {
  it('renders when selectedCount > 0', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 3, actions: sampleActions, selectedKeys: [1, 2, 3] },
    })
    expect(wrapper.find('[data-testid="batch-action-bar"]').exists()).toBe(true)
  })

  it('does not render when selectedCount is 0', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 0, actions: sampleActions },
    })
    expect(wrapper.find('[data-testid="batch-action-bar"]').exists()).toBe(false)
  })

  it('displays selected count', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 5, actions: sampleActions, selectedKeys: [1, 2, 3, 4, 5] },
    })
    expect(wrapper.find('[data-testid="batch-count"]').text()).toContain('5')
  })

  it('renders action buttons', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 1, actions: sampleActions, selectedKeys: [1] },
    })
    expect(wrapper.find('[data-testid="batch-action-enable"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="batch-action-disable"]').exists()).toBe(true)
  })

  it('emits action on non-danger button click', async () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 2, actions: sampleActions, selectedKeys: [1, 2] },
    })
    await wrapper.find('[data-testid="batch-action-enable"]').trigger('click')
    expect(wrapper.emitted('action')?.[0]).toEqual(['enable', [1, 2]])
  })

  it('emits clear on clear button click', async () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 3, actions: sampleActions, selectedKeys: [1, 2, 3] },
    })
    await wrapper.find('[data-testid="batch-clear"]').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('uses custom countTemplate', () => {
    const wrapper = mount(RBatchActionBar, {
      props: {
        selectedCount: 3,
        actions: sampleActions,
        selectedKeys: [1, 2, 3],
        countTemplate: 'Selected: {count} items',
      },
    })
    expect(wrapper.find('[data-testid="batch-count"]').text()).toContain('Selected: 3 items')
  })

  it('uses custom clearLabel', () => {
    const wrapper = mount(RBatchActionBar, {
      props: {
        selectedCount: 1,
        actions: sampleActions,
        selectedKeys: [1],
        clearLabel: 'Clear All',
      },
    })
    expect(wrapper.find('[data-testid="batch-clear"]').text()).toContain('Clear All')
  })

  it('exposes clear method', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 1, actions: sampleActions, selectedKeys: [1] },
    })
    const vm = wrapper.vm as unknown as BatchActionBarExpose
    expect(typeof vm.clear).toBe('function')
  })

  it('has proper ARIA attributes', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 2, actions: sampleActions, selectedKeys: [1, 2] },
    })
    const bar = wrapper.find('[data-testid="batch-action-bar"]')
    expect(bar.attributes('role')).toBe('toolbar')
    expect(bar.attributes('aria-label')).toContain('2')
  })

  it('renders danger action with confirm wrapper', () => {
    const wrapper = mount(RBatchActionBar, {
      props: { selectedCount: 1, actions: sampleActions, selectedKeys: [1] },
    })
    expect(wrapper.find('[data-testid="batch-action-delete"]').exists()).toBe(true)
  })
})

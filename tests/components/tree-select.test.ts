import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import RTreeSelect from '../../src/components/tree-select/RTreeSelect.vue'
import type { TreeSelectNode } from '../../src/components/tree-select/types'

const MOCK_TREE: TreeSelectNode[] = [
  {
    id: 1,
    label: 'Root A',
    parentId: null,
    children: [
      { id: 11, label: 'Child A-1', parentId: 1 },
      {
        id: 12,
        label: 'Child A-2',
        parentId: 1,
        children: [{ id: 121, label: 'Grandchild A-2-1', parentId: 12 }],
      },
    ],
  },
  {
    id: 2,
    label: 'Root B',
    parentId: null,
    children: [{ id: 21, label: 'Child B-1', parentId: 2 }],
  },
]

const wrappers: VueWrapper[] = []

function mountSelect(props: Record<string, unknown> = {}) {
  const w = mount(RTreeSelect, {
    props: {
      modelValue: null,
      options: MOCK_TREE,
      ...props,
    },
    attachTo: document.body,
    global: {
      stubs: { Teleport: true },
    },
  })
  wrappers.push(w)
  return w
}

describe('RTreeSelect', () => {
  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers.length = 0
  })

  it('renders trigger with placeholder', () => {
    const wrapper = mountSelect()
    expect(wrapper.find('.r-tree-select__placeholder').text()).toBe('Please select')
  })

  it('renders selected value label', () => {
    const wrapper = mountSelect({ modelValue: 11 })
    expect(wrapper.find('[data-testid="r-tree-select-value"]').text()).toBe('Child A-1')
  })

  it('opens dropdown on trigger click', async () => {
    const wrapper = mountSelect()
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-select-dropdown"]').exists()).toBe(true)
  })

  it('closes dropdown on second click', async () => {
    const wrapper = mountSelect()
    const trigger = wrapper.find('[data-testid="r-tree-select-trigger"]')
    await trigger.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-select-dropdown"]').exists()).toBe(true)
    await trigger.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-select-dropdown"]').exists()).toBe(false)
  })

  it('selects a node and emits update:modelValue', async () => {
    const wrapper = mountSelect()
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    const node = wrapper.find('[data-testid="r-tree-node-11"]')
    expect(node.exists()).toBe(true)
    await node.trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([11])
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 11, label: 'Child A-1' })
  })

  it('clears selection', async () => {
    const wrapper = mountSelect({ modelValue: 11 })
    await wrapper.find('[data-testid="r-tree-select-clear"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('does not open when disabled', async () => {
    const wrapper = mountSelect({ disabled: true })
    expect(wrapper.find('[data-testid="r-tree-select-trigger"]').exists()).toBe(true)
    // disabled class is set, pointer-events none prevents opening
    expect(wrapper.find('.r-tree-select--disabled').exists()).toBe(true)
  })

  it('filters nodes by keyword', async () => {
    const wrapper = mountSelect({ searchable: true })
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    const input = wrapper.find('[data-testid="r-tree-select-search"]')
    expect(input.exists()).toBe(true)
    await input.setValue('Grandchild')
    await nextTick()
    const nodes = wrapper.findAll('[role="treeitem"]')
    const labels = nodes.map((n) => n.text())
    expect(labels.some((l) => l.includes('Grandchild'))).toBe(true)
  })

  it('loads data from async loadData', async () => {
    const loadData = vi.fn().mockResolvedValue(MOCK_TREE)
    const wrapper = mountSelect({ options: [], loadData })
    await flushPromises()
    expect(loadData).toHaveBeenCalled()
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-select-dropdown"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="r-tree-node-1"]').exists()).toBe(true)
  })

  it('expands parent when selected value is deep', () => {
    const wrapper = mountSelect({ modelValue: 121, defaultExpandLevel: 0 })
    expect(wrapper.find('[data-testid="r-tree-select-value"]').text()).toBe('Grandchild A-2-1')
  })

  it('supports keyboard navigation on trigger', async () => {
    const wrapper = mountSelect()
    const trigger = wrapper.find('[data-testid="r-tree-select-trigger"]')
    await trigger.trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-select-dropdown"]').exists()).toBe(true)
  })

  it('does not select disabled node', async () => {
    const disabledTree: TreeSelectNode[] = [
      { id: 1, label: 'Disabled', parentId: null, disabled: true },
      { id: 2, label: 'Enabled', parentId: null },
    ]
    const wrapper = mountSelect({ options: disabledTree })
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    const node = wrapper.find('[data-testid="r-tree-node-1"]')
    await node.trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows empty state when no options', async () => {
    const wrapper = mountSelect({ options: [] })
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-select-empty"]').text()).toBe('No data')
  })

  it('exposes reload method', async () => {
    const loadData = vi.fn().mockResolvedValue(MOCK_TREE)
    const wrapper = mountSelect({ options: [], loadData })
    await flushPromises()
    expect(loadData).toHaveBeenCalledTimes(1)
    const vm = wrapper.vm as unknown as { reload: () => Promise<void> }
    await vm.reload()
    expect(loadData).toHaveBeenCalledTimes(2)
  })

  it('toggles child expansion via chevron without closing', async () => {
    const wrapper = mountSelect({ defaultExpandLevel: 0 })
    await wrapper.find('[data-testid="r-tree-select-trigger"]').trigger('click')
    await nextTick()
    const rootNode = wrapper.find('[data-testid="r-tree-node-1"]')
    expect(rootNode.exists()).toBe(true)
    expect(wrapper.find('[data-testid="r-tree-node-11"]').exists()).toBe(false)
    // Click the toggle chevron (click.stop) to expand without selecting
    const toggle = rootNode.find('.r-tree-node__toggle')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="r-tree-node-11"]').exists()).toBe(true)
    // Dropdown should still be open
    expect(wrapper.find('[data-testid="r-tree-select-dropdown"]').exists()).toBe(true)
  })
})

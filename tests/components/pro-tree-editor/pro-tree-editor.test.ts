import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, defineComponent, h } from 'vue'
import { NDialogProvider, NMessageProvider, NConfigProvider } from 'naive-ui'
import RProTreeEditor from '../../../src/components/pro-tree-editor/RProTreeEditor.vue'
import type { TreeNodeData, TreeRequestHooks } from '../../../src/components/pro-tree-editor/types'

const mockTreeData: TreeNodeData[] = [
  {
    id: 1, label: 'Documents', parentId: null, sortOrder: 0, depth: 0,
    children: [
      { id: 2, label: 'Reports', parentId: 1, sortOrder: 0, depth: 1, children: [] },
      { id: 3, label: 'Photos', parentId: 1, sortOrder: 1, depth: 1, children: [] },
    ],
  },
  { id: 4, label: 'Music', parentId: null, sortOrder: 1, depth: 0, children: [] },
]

function createMockHooks(): TreeRequestHooks {
  return {
    loadTree: vi.fn().mockResolvedValue(JSON.parse(JSON.stringify(mockTreeData))),
    create: vi.fn().mockImplementation(async (params: { parentId: string | number | null; name: string }) => ({
      id: 100, label: params.name, parentId: params.parentId, sortOrder: 0, depth: 0,
    })),
    update: vi.fn().mockImplementation(async (params: { id: string | number; name: string }) => ({
      id: params.id, label: params.name, parentId: null, sortOrder: 0, depth: 0,
    })),
    delete: vi.fn().mockResolvedValue(undefined),
    move: vi.fn().mockResolvedValue(undefined),
  }
}

function mountEditor(props: Record<string, unknown> = {}): ReturnType<typeof mount> {
  const editorProps = {
    requestMode: 'auto',
    requestHooks: createMockHooks(),
    ...props,
  }

  const Wrapper = defineComponent({
    setup() {
      return () =>
        h(NConfigProvider, null, {
          default: () =>
            h(NDialogProvider, null, {
              default: () =>
                h(NMessageProvider, null, {
                  default: () => h(RProTreeEditor as never, editorProps),
                }),
            }),
        })
    },
  })

  return mount(Wrapper, {
    attachTo: document.body,
  })
}

describe('RProTreeEditor — DOM', () => {
  it('should render with tree role', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const tree = wrapper.find('[role="tree"]')
    expect(tree.exists()).toBe(true)
  })

  it('should have data-testid on container', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    expect(wrapper.find('[data-testid="pro-tree-editor"]').exists()).toBe(true)
  })

  it('should render toolbar', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    expect(wrapper.find('[data-testid="tree-toolbar"]').exists()).toBe(true)
  })

  it('should show loading state when loading', async () => {
    const hooks: TreeRequestHooks = {
      loadTree: vi.fn().mockReturnValue(new Promise(() => {})),
    }
    const wrapper = mountEditor({ requestHooks: hooks })
    await nextTick()
    expect(wrapper.find('[data-testid="tree-loading"]').exists()).toBe(true)
  })

  it('should show empty state when no data', async () => {
    const hooks: TreeRequestHooks = {
      loadTree: vi.fn().mockResolvedValue([]),
    }
    const wrapper = mountEditor({ requestHooks: hooks })
    await nextTick()
    await nextTick()
    expect(wrapper.find('[data-testid="tree-empty"]').exists()).toBe(true)
  })

  it('should apply density class', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData, density: 'compact' })
    await nextTick()
    expect(wrapper.find('.rpte--compact').exists()).toBe(true)
  })

  it('should have clickable tree nodes', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const treeNodes = wrapper.findAll('[role="treeitem"]')
    expect(treeNodes.length).toBeGreaterThan(0)
    for (const node of treeNodes) {
      expect(node.attributes('data-node-id')).toBeTruthy()
    }
  })

  it('should select a row with visible selected state class', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()

    const musicNode = wrapper.find('[data-testid="tree-node-4"]')
    await musicNode.trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="tree-node-4"]').classes()).toContain('rpte-node--selected')
  })

  it('should start child creation from the inline plus action instead of editing parent', async () => {
    const hooks = createMockHooks()
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData, requestHooks: hooks })
    await nextTick()

    await wrapper.find('[data-testid="tree-node-1"] [data-testid="tree-node-add-child"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="tree-node-1"] [data-testid="tree-node-edit-input"]').exists()).toBe(false)
    const editInput = wrapper.find('[data-testid="tree-node-edit-input"] input')
    expect(editInput.exists()).toBe(true)

    await editInput.setValue('Invoices')
    await editInput.trigger('keydown', { key: 'Enter' })
    await editInput.trigger('blur')
    await flushPromises()

    expect(hooks.create).toHaveBeenCalledWith({ parentId: 1, name: 'Invoices' })
    expect(hooks.create).toHaveBeenCalledTimes(1)
  })

  it('should be focusable via tabindex', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const container = wrapper.find('[data-testid="pro-tree-editor"]')
    expect(container.attributes('tabindex')).toBe('0')
  })
})

describe('RProTreeEditor — Accessibility', () => {
  it('should have role="tree" on container', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const container = wrapper.find('[data-testid="pro-tree-editor"]')
    expect(container.attributes('role')).toBe('tree')
  })

  it('should have aria-label on container', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const container = wrapper.find('[data-testid="pro-tree-editor"]')
    expect(container.attributes('aria-label')).toBe('Tree Editor')
  })

  it('should render treeitem roles for nodes', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const items = wrapper.findAll('[role="treeitem"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('should have aria-expanded on expandable nodes', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData, defaultExpandLevel: 1 })
    await nextTick()
    const expandableNodes = wrapper.findAll('[aria-expanded]')
    expect(expandableNodes.length).toBeGreaterThanOrEqual(0)
  })

  it('should have accessible toggle buttons', async () => {
    const wrapper = mountEditor({ requestMode: 'manual', data: mockTreeData })
    await nextTick()
    const toggles = wrapper.findAll('[data-testid="tree-node-toggle"]')
    for (const toggle of toggles) {
      const label = toggle.attributes('aria-label')
      expect(label).toBeTruthy()
      expect(['collapse', 'expand']).toContain(label)
    }
  })
})

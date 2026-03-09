import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import RDashboardBuilder from '../../src/components/dashboard-builder/RDashboardBuilder.vue'
import type {
  DashboardBuilderAdapter,
  DashboardLayoutItem,
  DashboardWidgetDefinition,
} from '../../src/components/dashboard-builder/types'

const WidgetStub = defineComponent({
  template: '<div data-testid="widget-stub">Widget</div>',
})

const widgets: DashboardWidgetDefinition[] = [
  {
    type: 'kpi',
    title: 'KPI',
    defaultVisible: true,
    icon: 'bar-chart-2',
  },
  {
    type: 'tasks',
    title: 'Tasks',
    allowMultiple: false,
    icon: 'clipboard-list',
  },
]

function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

function mockGridRect(wrapper: ReturnType<typeof mount>) {
  const grid = wrapper.find('[data-testid="dashboard-grid"]').element as HTMLElement
  vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 1200,
    height: 600,
    top: 0,
    left: 0,
    right: 1200,
    bottom: 600,
    toJSON: () => ({}),
  })
}

function createAdapter(layout: DashboardLayoutItem[] = []): DashboardBuilderAdapter {
  return {
    loadLayout: vi.fn().mockResolvedValue(layout),
    saveLayout: vi.fn().mockResolvedValue(undefined),
    listWidgets: vi.fn().mockResolvedValue(widgets),
  }
}

describe('RDashboardBuilder', () => {
  it('renders default visible widgets when remote layout is empty', async () => {
    const adapter = createAdapter([])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        widgetRegistry: { kpi: WidgetStub, tasks: WidgetStub },
      },
    })

    await flush()
    await flush()
    expect(wrapper.find('[data-testid="dashboard-grid"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="dashboard-widget"]').length).toBe(1)
  })

  it('adds widget from palette in editing mode', async () => {
    const adapter = createAdapter([])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        defaultEditing: true,
        widgetRegistry: { kpi: WidgetStub, tasks: WidgetStub },
      },
    })

    await flush()
    await flush()
    const beforeCount = wrapper.findAll('[data-testid="dashboard-widget"]').length
    const paletteItems = wrapper.findAll('[data-testid="dashboard-palette-item"]')
    await paletteItems[0].trigger('click')
    const afterCount = wrapper.findAll('[data-testid="dashboard-widget"]').length
    expect(afterCount).toBeGreaterThan(beforeCount)
    expect(wrapper.emitted('layout-change')).toBeTruthy()
  })

  it('cycles widget size', async () => {
    const adapter = createAdapter([{ id: 'kpi-1', type: 'kpi', w: 4, h: 2 }])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        defaultEditing: true,
        widgetRegistry: { kpi: WidgetStub },
      },
    })

    await flush()
    await flush()
    const oldLabel = wrapper.find('[data-testid="dashboard-widget-size"]').text()
    await wrapper.find('[data-testid="dashboard-widget-cycle-size"]').trigger('click')
    const newLabel = wrapper.find('[data-testid="dashboard-widget-size"]').text()
    expect(newLabel).not.toBe(oldLabel)
  })

  it('saves layout through adapter', async () => {
    const adapter = createAdapter([{ id: 'kpi-1', type: 'kpi', w: 4, h: 2 }])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        defaultEditing: true,
        widgetRegistry: { kpi: WidgetStub },
      },
    })

    await flush()
    await flush()
    await wrapper.find('[data-testid="dashboard-save-layout"]').trigger('click')
    expect(adapter.saveLayout).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('supports drag-and-drop reposition', async () => {
    const adapter = createAdapter([{ id: 'kpi-1', type: 'kpi', x: 1, y: 1, w: 4, h: 2 }])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        defaultEditing: true,
        widgetRegistry: { kpi: WidgetStub },
      },
    })

    await flush()
    await flush()
    mockGridRect(wrapper)

    const header = wrapper.find('.r-dashboard-builder__item-header')
    await header.trigger('pointerdown', { clientX: 0, clientY: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 0 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 120, clientY: 0 }))
    await flush()

    const style = wrapper.find('[data-testid="dashboard-widget"]').attributes('style')
    expect(style).toContain('grid-column-start: 2')
  })

  it('supports horizontal resize handle', async () => {
    const adapter = createAdapter([{ id: 'kpi-1', type: 'kpi', x: 1, y: 1, w: 4, h: 2 }])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        defaultEditing: true,
        widgetRegistry: { kpi: WidgetStub },
      },
    })

    await flush()
    await flush()
    mockGridRect(wrapper)

    const resizeHandle = wrapper.find('[data-testid="dashboard-widget-resize-x"]')
    await resizeHandle.trigger('pointerdown', { clientX: 0, clientY: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 180, clientY: 0 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 180, clientY: 0 }))
    await flush()

    const style = wrapper.find('[data-testid="dashboard-widget"]').attributes('style')
    expect(style).toContain('span 5')
  })

  it('supports undo and redo', async () => {
    const adapter = createAdapter([{ id: 'kpi-1', type: 'kpi', x: 1, y: 1, w: 4, h: 2 }])
    const wrapper = mount(RDashboardBuilder, {
      props: {
        adapter,
        defaultEditing: true,
        widgetRegistry: { kpi: WidgetStub },
      },
    })

    await flush()
    await flush()

    await wrapper.find('[data-testid="dashboard-widget-cycle-size"]').trigger('click')
    const afterGrow = wrapper.find('[data-testid="dashboard-widget"]').attributes('style')
    expect(afterGrow).toContain('span 6')

    await wrapper.find('[data-testid="dashboard-undo"]').trigger('click')
    const afterUndo = wrapper.find('[data-testid="dashboard-widget"]').attributes('style')
    expect(afterUndo).toContain('span 4')

    await wrapper.find('[data-testid="dashboard-redo"]').trigger('click')
    const afterRedo = wrapper.find('[data-testid="dashboard-widget"]').attributes('style')
    expect(afterRedo).toContain('span 6')
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import RDashboardWorkspace from '../../src/components/dashboard-builder/RDashboardWorkspace.vue'
import type { DashboardLayoutItem, DashboardWorkspaceAdapter } from '../../src/components/dashboard-builder/types'

const BuilderStub = defineComponent({
  name: 'RDashboardBuilder',
  setup(_, { expose }) {
    expose({
      getLayout: () => [{ id: 'layout-1', type: 'kpi', w: 4, h: 2 } satisfies DashboardLayoutItem],
    })
    return () => h('div', { 'data-testid': 'dashboard-builder-stub' }, 'builder')
  },
})

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function createAdapter(): DashboardWorkspaceAdapter {
  const dashboards = [{ id: 'default', name: 'Default Dashboard' }]
  const layouts = new Map<string, DashboardLayoutItem[]>()

  return {
    listDashboards: vi.fn().mockResolvedValue(dashboards),
    createDashboard: vi.fn().mockImplementation(async ({ name }) => {
      const created = { id: `db-${Date.now()}`, name }
      dashboards.push(created)
      return created
    }),
    deleteDashboard: vi.fn().mockImplementation(async (id: string) => {
      const index = dashboards.findIndex((item) => item.id === id)
      if (index >= 0) dashboards.splice(index, 1)
      layouts.delete(id)
    }),
    loadLayout: vi.fn().mockImplementation(async (id: string) => layouts.get(id) || []),
    saveLayout: vi.fn().mockImplementation(async (id: string, layout: DashboardLayoutItem[]) => {
      layouts.set(id, layout)
    }),
    listWidgets: vi.fn().mockResolvedValue([{ type: 'kpi', title: 'KPI' }]),
  }
}

describe('RDashboardWorkspace', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders dashboard tabs after loading', async () => {
    const adapter = createAdapter()
    const wrapper = mount(RDashboardWorkspace, {
      props: { adapter },
      global: { stubs: { RDashboardBuilder: BuilderStub } },
    })

    await flush()
    await flush()

    expect(wrapper.find('[data-testid="dashboard-workspace"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="dashboard-tab"]').length).toBe(1)
  })

  it('creates a blank dashboard', async () => {
    const adapter = createAdapter()
    const wrapper = mount(RDashboardWorkspace, {
      props: { adapter, defaultEditing: true },
      global: { stubs: { RDashboardBuilder: BuilderStub } },
    })

    await flush()
    await flush()

    await wrapper.find('[data-testid="dashboard-create"]').trigger('click')
    await flush()

    expect(adapter.createDashboard).toHaveBeenCalled()
    expect(adapter.saveLayout).toHaveBeenCalled()
  })

  it('exports current dashboard as json', async () => {
    const adapter = createAdapter()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const wrapper = mount(RDashboardWorkspace, {
      props: { adapter, defaultEditing: true },
      global: { stubs: { RDashboardBuilder: BuilderStub } },
    })

    await flush()
    await flush()
    await wrapper.find('[data-testid="dashboard-export"]').trigger('click')

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })
})

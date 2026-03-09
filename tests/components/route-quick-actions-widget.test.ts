import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { RRouteQuickActionsWidget, RRouteQuickActionsEditor } from '../../src/components/dashboard-builder'

describe('route quick actions widget', () => {
  it('renders title and actions', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/admin/list', component: { template: '<div />' } },
      ],
    })
    const wrapper = mount(RRouteQuickActionsWidget, {
      props: {
        config: {
          title: '快捷入口',
          description: '常用跳转',
          actions: [{ id: 'a1', label: '管理员列表', route: '/admin/list' }],
        },
      },
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('快捷入口')
    expect(wrapper.findAll('[data-testid="route-quick-actions-button"]').length).toBe(1)
  })

  it('editor emits updated model', async () => {
    const wrapper = mount(RRouteQuickActionsEditor, {
      props: {
        modelValue: {
          title: '原始标题',
          actions: [{ id: 'a1', label: '管理员列表', route: '/admin/list' }],
        },
        definition: {
          type: 'route-quick-actions',
          title: '路由快捷按钮组',
          editorOptions: {
            routeOptions: [{ label: '管理员列表', value: '/admin/list' }],
          },
        },
      },
    })

    await wrapper.find('[data-testid="route-widget-action-add"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('opens in new tab when action openMode is new_tab', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/admin/list', component: { template: '<div />' } },
      ],
    })

    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

    const wrapper = mount(RRouteQuickActionsWidget, {
      props: {
        config: {
          actions: [{ id: 'a1', label: '管理员列表', route: '/admin/list', openMode: 'new_tab' }],
        },
      },
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.find('[data-testid="route-quick-actions-button"]').trigger('click')

    expect(windowOpen).toHaveBeenCalledTimes(1)
    expect(windowOpen).toHaveBeenCalledWith('/admin/list', '_blank', 'noopener')
    windowOpen.mockRestore()
  })
})

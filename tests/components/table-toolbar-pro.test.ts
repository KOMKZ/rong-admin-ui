import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RTableToolbarPro from '../../src/components/table-toolbar/RTableToolbarPro.vue'
import type { TableToolbarProExpose } from '../../src/components/table-toolbar/types'

describe('RTableToolbarPro', () => {
  it('renders with default props', () => {
    const wrapper = mount(RTableToolbarPro)
    expect(wrapper.find('[data-testid="table-toolbar-pro"]').exists()).toBe(true)
  })

  it('renders title when provided', () => {
    const wrapper = mount(RTableToolbarPro, {
      props: { title: '用户列表' },
    })
    expect(wrapper.text()).toContain('用户列表')
  })

  it('renders refresh button by default', () => {
    const wrapper = mount(RTableToolbarPro)
    expect(wrapper.find('[data-testid="toolbar-refresh"]').exists()).toBe(true)
  })

  it('hides refresh button when refreshable=false', () => {
    const wrapper = mount(RTableToolbarPro, {
      props: { refreshable: false },
    })
    expect(wrapper.find('[data-testid="toolbar-refresh"]').exists()).toBe(false)
  })

  it('emits refresh on click', async () => {
    const wrapper = mount(RTableToolbarPro)
    await wrapper.find('[data-testid="toolbar-refresh"]').trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('renders density button when densitySwitchable', () => {
    const wrapper = mount(RTableToolbarPro, {
      props: { densitySwitchable: true },
    })
    expect(wrapper.find('[data-testid="toolbar-density"]').exists()).toBe(true)
  })

  it('renders fullscreen button by default', () => {
    const wrapper = mount(RTableToolbarPro)
    expect(wrapper.find('[data-testid="toolbar-fullscreen"]').exists()).toBe(true)
  })

  it('emits update:fullscreen on fullscreen toggle', async () => {
    const wrapper = mount(RTableToolbarPro)
    await wrapper.find('[data-testid="toolbar-fullscreen"]').trigger('click')
    expect(wrapper.emitted('update:fullscreen')).toBeTruthy()
    expect(wrapper.emitted('update:fullscreen')![0]).toEqual([true])
  })

  it('renders export button when exportable', () => {
    const wrapper = mount(RTableToolbarPro, {
      props: { exportable: true },
    })
    expect(wrapper.find('[data-testid="toolbar-export"]').exists()).toBe(true)
  })

  it('emits export on click', async () => {
    const wrapper = mount(RTableToolbarPro, {
      props: { exportable: true },
    })
    await wrapper.find('[data-testid="toolbar-export"]').trigger('click')
    expect(wrapper.emitted('export')).toBeTruthy()
  })

  it('renders column config when columnConfigurable', () => {
    const wrapper = mount(RTableToolbarPro, {
      props: {
        columnConfigurable: true,
        columnPresets: [
          { key: 'name', label: '姓名', visible: true },
          { key: 'email', label: '邮箱', visible: true },
        ],
      },
    })
    expect(wrapper.find('[data-testid="toolbar-columns"]').exists()).toBe(true)
  })

  it('exposes toggleFullscreen and resetColumns', () => {
    const wrapper = mount(RTableToolbarPro)
    const vm = wrapper.vm as unknown as TableToolbarProExpose
    expect(typeof vm.toggleFullscreen).toBe('function')
    expect(typeof vm.resetColumns).toBe('function')
  })

  it('renders prefix slot content', () => {
    const wrapper = mount(RTableToolbarPro, {
      slots: { prefix: '<button class="custom-prefix">Add</button>' },
    })
    expect(wrapper.find('.custom-prefix').exists()).toBe(true)
  })

  it('renders extra slot content', () => {
    const wrapper = mount(RTableToolbarPro, {
      slots: { extra: '<span class="custom-extra">Extra</span>' },
    })
    expect(wrapper.find('.custom-extra').exists()).toBe(true)
  })
})

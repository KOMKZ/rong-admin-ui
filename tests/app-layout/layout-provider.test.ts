import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createLayoutProvider, useLayout } from '@/app-layout/layout-provider'

const ProviderComponent = defineComponent({
  props: { initialConfig: { type: Object, default: () => ({}) } },
  setup(props) {
    return createLayoutProvider(props.initialConfig)
  },
  render() {
    return h('div', this.$slots.default?.())
  },
})

const ConsumerComponent = defineComponent({
  setup() {
    const layout = useLayout()
    return { layout }
  },
  render() {
    return h('div', JSON.stringify(this.layout.config))
  },
})

describe('createLayoutProvider / useLayout', () => {
  it('should provide default config', () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const consumer = wrapper.findComponent(ConsumerComponent)
    const config = consumer.vm.layout.config
    expect(config.navMode).toBe('vertical')
    expect(config.sidebarCollapsed).toBe(false)
    expect(config.headerFixed).toBe(true)
    expect(config.showTabs).toBe(true)
    expect(config.pageAnimate).toBe(true)
    expect(config.pageAnimateType).toBe('fade')
  })

  it('should accept initial config overrides', () => {
    const wrapper = mount(ProviderComponent, {
      props: { initialConfig: { navMode: 'horizontal', sidebarCollapsed: true } },
      slots: { default: () => h(ConsumerComponent) },
    })

    const config = wrapper.findComponent(ConsumerComponent).vm.layout.config
    expect(config.navMode).toBe('horizontal')
    expect(config.sidebarCollapsed).toBe(true)
  })

  it('should toggle sidebar', async () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const consumer = wrapper.findComponent(ConsumerComponent).vm.layout
    expect(consumer.config.sidebarCollapsed).toBe(false)

    consumer.actions.toggleSidebar()
    await nextTick()
    expect(consumer.config.sidebarCollapsed).toBe(true)

    consumer.actions.toggleSidebar()
    await nextTick()
    expect(consumer.config.sidebarCollapsed).toBe(false)
  })

  it('should set nav mode', async () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const consumer = wrapper.findComponent(ConsumerComponent).vm.layout
    consumer.actions.setNavMode('horizontal-mix')
    await nextTick()
    expect(consumer.config.navMode).toBe('horizontal-mix')
  })

  it('should update all config actions', async () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const { actions, config } = wrapper.findComponent(ConsumerComponent).vm.layout

    actions.setHeaderFixed(false)
    actions.setFooterVisible(false)
    actions.setContentFullScreen(true)
    actions.setShowBreadcrumb(false)
    actions.setShowTabs(false)
    actions.setPageAnimate(false)
    actions.setPageAnimateType('zoom')
    actions.setSidebarCollapsed(true)
    await nextTick()

    expect(config.headerFixed).toBe(false)
    expect(config.footerVisible).toBe(false)
    expect(config.contentFullScreen).toBe(true)
    expect(config.showBreadcrumb).toBe(false)
    expect(config.showTabs).toBe(false)
    expect(config.pageAnimate).toBe(false)
    expect(config.pageAnimateType).toBe('zoom')
    expect(config.sidebarCollapsed).toBe(true)
  })

  it('should throw when useLayout is called without provider', () => {
    expect(() => {
      mount(ConsumerComponent)
    }).toThrow('[app-layout]')
  })
})

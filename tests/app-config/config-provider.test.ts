import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createAppConfig, installAppConfig, useAppConfig } from '@/app-config/config-provider'

const ProviderComponent = defineComponent({
  props: { input: { type: Object, default: () => ({}) } },
  setup(props) {
    return createAppConfig(props.input)
  },
  render() {
    return h('div', this.$slots.default?.())
  },
})

const ConsumerComponent = defineComponent({
  setup() {
    const config = useAppConfig()
    return { config }
  },
  render() {
    return h('div', JSON.stringify(this.config.design))
  },
})

describe('createAppConfig / useAppConfig', () => {
  it('should provide default config values', () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const consumer = wrapper.findComponent(ConsumerComponent)
    const ctx = consumer.vm.config
    expect(ctx.design.darkMode).toBe(false)
    expect(ctx.design.primaryColor).toBe('#2080f0')
    expect(ctx.project.navMode).toBe('vertical')
    expect(ctx.runtime.env).toBe('development')
    expect(ctx.website.title).toBe('Admin System')
  })

  it('should accept partial overrides', () => {
    const wrapper = mount(ProviderComponent, {
      props: {
        input: {
          design: { darkMode: true, primaryColor: '#ff0000', borderRadius: 8, fontSize: 16 },
        },
      },
      slots: { default: () => h(ConsumerComponent) },
    })

    const ctx = wrapper.findComponent(ConsumerComponent).vm.config
    expect(ctx.design.darkMode).toBe(true)
    expect(ctx.design.primaryColor).toBe('#ff0000')
  })

  it('should update design config reactively', async () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const ctx = wrapper.findComponent(ConsumerComponent).vm.config
    ctx.updateDesign({ darkMode: true })
    await nextTick()
    expect(ctx.design.darkMode).toBe(true)
  })

  it('should update project config reactively', async () => {
    const wrapper = mount(ProviderComponent, {
      slots: { default: () => h(ConsumerComponent) },
    })

    const ctx = wrapper.findComponent(ConsumerComponent).vm.config
    ctx.updateProject({ showTabs: false, navMode: 'horizontal' })
    await nextTick()
    expect(ctx.project.showTabs).toBe(false)
    expect(ctx.project.navMode).toBe('horizontal')
  })

  it('should throw when useAppConfig is called without provider', () => {
    expect(() => {
      mount(ConsumerComponent)
    }).toThrow('[app-config]')
  })
})

describe('installAppConfig', () => {
  it('should inject config via app.provide (safe outside setup)', () => {
    const app = createApp(defineComponent({ render: () => h('div') }))
    const ctx = installAppConfig(app, {
      design: { darkMode: true, primaryColor: '#123456', borderRadius: 4, fontSize: 16 },
    })

    expect(ctx.design.darkMode).toBe(true)
    expect(ctx.design.primaryColor).toBe('#123456')
    expect(ctx.project.navMode).toBe('vertical')
  })

  it('should work when used in plugin install() then consumed in component', () => {
    const wrapper = mount(ConsumerComponent, {
      global: {
        plugins: [
          {
            install(app) {
              installAppConfig(app, {
                runtime: { apiBaseURL: '/v2', env: 'production', debug: false },
              })
            },
          },
        ],
      },
    })

    const ctx = wrapper.vm.config
    expect(ctx.runtime.apiBaseURL).toBe('/v2')
    expect(ctx.runtime.env).toBe('production')
  })
})

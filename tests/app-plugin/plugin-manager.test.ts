import { describe, expect, it, vi, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import {
  createPluginManager,
  getDiscreteApi,
  resetDiscreteApi,
} from '@/app-plugin/plugin-manager'
import type { UILibraryAdapter, DiscreteApiProvider } from '@/app-plugin/types'

afterEach(() => {
  resetDiscreteApi()
})

describe('createPluginManager', () => {
  it('should install UI library adapter', () => {
    const installFn = vi.fn()
    const adapter: UILibraryAdapter = {
      name: 'test-ui',
      install: installFn,
    }

    const plugin = createPluginManager({ uiLibrary: adapter })
    const app = createApp(defineComponent({ render: () => h('div') }))
    plugin.install(app)

    expect(installFn).toHaveBeenCalledWith(app)
  })

  it('should register directives', () => {
    const directiveFn = { mounted: vi.fn() }
    const plugin = createPluginManager({
      directives: [{ name: 'focus', directive: directiveFn }],
    })

    const app = createApp(defineComponent({ render: () => h('div') }))
    const directiveSpy = vi.spyOn(app, 'directive')
    plugin.install(app)

    expect(directiveSpy).toHaveBeenCalledWith('focus', directiveFn)
  })

  it('should setup discrete api when adapter provides it', () => {
    const mockApi: DiscreteApiProvider = {
      message: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
      dialog: { warning: vi.fn(), error: vi.fn(), info: vi.fn() },
      notification: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
      loadingBar: { start: vi.fn(), finish: vi.fn(), error: vi.fn() },
    }

    const adapter: UILibraryAdapter = {
      name: 'test-ui',
      install: vi.fn(),
      setupDiscreteApi: () => mockApi,
    }

    const plugin = createPluginManager({ uiLibrary: adapter })
    const app = createApp(defineComponent({ render: () => h('div') }))
    plugin.install(app)

    const api = getDiscreteApi()
    expect(api).toBe(mockApi)
  })

  it('should clear discreteApi when adapter has no setupDiscreteApi', () => {
    const plugin = createPluginManager({
      uiLibrary: { name: 'bare', install: vi.fn() },
    })
    const app = createApp(defineComponent({ render: () => h('div') }))
    plugin.install(app)

    expect(() => getDiscreteApi()).toThrow('[app-plugin]')
  })

  it('should reset discreteApi via resetDiscreteApi', () => {
    const mockApi: DiscreteApiProvider = {
      message: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
      dialog: { warning: vi.fn(), error: vi.fn(), info: vi.fn() },
      notification: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
      loadingBar: { start: vi.fn(), finish: vi.fn(), error: vi.fn() },
    }

    const adapter: UILibraryAdapter = {
      name: 'test-ui',
      install: vi.fn(),
      setupDiscreteApi: () => mockApi,
    }

    const plugin = createPluginManager({ uiLibrary: adapter })
    const app = createApp(defineComponent({ render: () => h('div') }))
    plugin.install(app)
    expect(getDiscreteApi()).toBe(mockApi)

    resetDiscreteApi()
    expect(() => getDiscreteApi()).toThrow('[app-plugin]')
  })

  it('should have correct plugin metadata', () => {
    const plugin = createPluginManager({})
    expect(plugin.name).toBe('app-plugin-manager')
    expect(plugin.order).toBe(10)
  })
})

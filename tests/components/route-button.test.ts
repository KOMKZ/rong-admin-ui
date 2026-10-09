import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import RRouteButton from '../../src/components/route-button/RRouteButton.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/shop/products/create', component: { template: '<div />' } },
      { path: '/users/:id', component: { template: '<div />' } },
    ],
  })
}

describe('RRouteButton', () => {
  it('renders a real anchor styled as a button with resolved href', () => {
    const wrapper = mount(RRouteButton, {
      props: { to: '/shop/products/create' },
      global: { plugins: [createTestRouter()] },
    })

    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toContain('/shop/products/create')
    expect(anchor.classes().some((c) => c.includes('n-button'))).toBe(true)
  })

  it('navigates on plain click through the router', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(RRouteButton, {
      props: { to: '/shop/products/create' },
      global: { plugins: [router] },
    })

    await wrapper.find('a').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/shop/products/create')
  })

  it('does not emit navigate for modified clicks (browser opens a new tab instead)', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(RRouteButton, {
      props: { to: '/users/5' },
      global: { plugins: [router] },
    })

    await wrapper.find('a').trigger('click', { ctrlKey: true })

    expect(wrapper.emitted('navigate')).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('does not emit navigate and keeps current page for target="_blank"', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(RRouteButton, {
      props: { to: '/users/5', target: '_blank' },
      global: { plugins: [router] },
    })

    await wrapper.find('a').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('navigate')).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('emits navigate notification once per activation', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(RRouteButton, {
      props: { to: '/users/5' },
      global: { plugins: [router] },
    })

    await wrapper.find('a').trigger('click')

    expect(wrapper.emitted('navigate')).toHaveLength(1)
  })

  it('adds safe rel for target="_blank"', () => {
    const wrapper = mount(RRouteButton, {
      props: { to: '/users/5', target: '_blank' },
      global: { plugins: [createTestRouter()] },
    })

    const anchor = wrapper.find('a')
    expect(anchor.attributes('target')).toBe('_blank')
    expect(anchor.attributes('rel')).toContain('noopener')
    expect(anchor.attributes('rel')).toContain('noreferrer')
  })

  it('renders a disabled button without href when disabled', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(RRouteButton, {
      props: { to: '/users/5', disabled: true },
      global: { plugins: [router] },
    })

    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(false)
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('disabled')).toBeDefined()

    await button.trigger('click')
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it('passes through visual attrs (type, size) to the rendered button appearance', () => {
    const wrapper = mount(RRouteButton, {
      props: { to: '/users/5' },
      attrs: { type: 'primary', size: 'small' },
      global: { plugins: [createTestRouter()] },
    })

    const anchor = wrapper.find('a')
    expect(anchor.classes().some((c) => c.includes('n-button--primary-type'))).toBe(true)
    expect(anchor.classes().some((c) => c.includes('n-button--small'))).toBe(true)
  })
})

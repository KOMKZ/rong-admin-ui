import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import REmptyState from '../../src/components/empty-state/REmptyState.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/create', component: { template: '<div />' } },
    ],
  })
}

describe('REmptyState', () => {
  it('renders with default props', () => {
    const wrapper = mount(REmptyState)
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No data')
  })

  it('renders custom title and description', () => {
    const wrapper = mount(REmptyState, {
      props: { title: 'Empty', description: 'Nothing here' },
    })
    expect(wrapper.text()).toContain('Empty')
    expect(wrapper.text()).toContain('Nothing here')
  })

  it('renders action button when actionLabel is set', () => {
    const wrapper = mount(REmptyState, {
      props: { actionLabel: 'Create' },
    })
    expect(wrapper.find('[data-testid="empty-state-action"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create')
  })

  it('emits action on button click', async () => {
    const wrapper = mount(REmptyState, {
      props: { actionLabel: 'Add' },
    })
    await wrapper.find('[data-testid="empty-state-action"]').trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('renders actionTo as a real route anchor and navigates without command emission', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(REmptyState, {
      props: { actionLabel: 'Create', actionTo: '/create' },
      global: { plugins: [router] },
    })

    const anchor = wrapper.find('a[data-testid="empty-state-action"]')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toContain('/create')
    expect(wrapper.find('button[data-testid="empty-state-action"]').exists()).toBe(false)

    await anchor.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/create')
    expect(wrapper.emitted('action')).toBeUndefined()
  })

  it('keeps modified actionTo clicks native and does not emit command action', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(REmptyState, {
      props: { actionLabel: 'Create', actionTo: '/create' },
      global: { plugins: [router] },
    })

    await wrapper.find('a[data-testid="empty-state-action"]').trigger('click', { ctrlKey: true })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.emitted('action')).toBeUndefined()
  })

  it('applies size class', () => {
    const wrapper = mount(REmptyState, { props: { size: 'small' } })
    expect(wrapper.find('.r-empty-state--small').exists()).toBe(true)
  })

  it('applies large size class', () => {
    const wrapper = mount(REmptyState, { props: { size: 'large' } })
    expect(wrapper.find('.r-empty-state--large').exists()).toBe(true)
  })

  it('hides title when not provided', () => {
    const wrapper = mount(REmptyState, { props: { title: '' } })
    expect(wrapper.find('.r-empty-state__title').exists()).toBe(false)
  })

  it('renders default slot content', () => {
    const wrapper = mount(REmptyState, {
      slots: { default: '<span class="custom-extra">Extra</span>' },
    })
    expect(wrapper.find('.custom-extra').exists()).toBe(true)
  })
})

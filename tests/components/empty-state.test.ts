import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import REmptyState from '../../src/components/empty-state/REmptyState.vue'

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

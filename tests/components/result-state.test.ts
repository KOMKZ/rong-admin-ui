import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RResultState from '../../src/components/result-state/RResultState.vue'

describe('RResultState', () => {
  it('renders success state with default title', () => {
    const wrapper = mount(RResultState, { props: { status: 'success' } })
    expect(wrapper.find('[data-testid="result-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Success')
  })

  it('renders error state', () => {
    const wrapper = mount(RResultState, { props: { status: 'error' } })
    expect(wrapper.text()).toContain('Error')
  })

  it('renders warning state', () => {
    const wrapper = mount(RResultState, { props: { status: 'warning' } })
    expect(wrapper.text()).toContain('Warning')
  })

  it('renders info state', () => {
    const wrapper = mount(RResultState, { props: { status: 'info' } })
    expect(wrapper.text()).toContain('Information')
  })

  it('renders 403 state', () => {
    const wrapper = mount(RResultState, { props: { status: '403' } })
    expect(wrapper.text()).toContain('403 Forbidden')
  })

  it('renders 404 state', () => {
    const wrapper = mount(RResultState, { props: { status: '404' } })
    expect(wrapper.text()).toContain('404 Not Found')
  })

  it('renders 500 state', () => {
    const wrapper = mount(RResultState, { props: { status: '500' } })
    expect(wrapper.text()).toContain('500 Server Error')
  })

  it('uses custom title and description', () => {
    const wrapper = mount(RResultState, {
      props: { status: 'success', title: 'Custom Title', description: 'Custom description text' },
    })
    expect(wrapper.text()).toContain('Custom Title')
    expect(wrapper.text()).toContain('Custom description text')
  })

  it('hides icon when showIcon is false', () => {
    const wrapper = mount(RResultState, { props: { status: 'success', showIcon: false } })
    expect(wrapper.find('.r-result-state__icon-wrapper').exists()).toBe(false)
  })

  it('renders actions slot', () => {
    const wrapper = mount(RResultState, {
      props: { status: 'error' },
      slots: { actions: '<button>Retry</button>' },
    })
    expect(wrapper.text()).toContain('Retry')
    expect(wrapper.find('.r-result-state__actions').exists()).toBe(true)
  })

  it('renders extra slot', () => {
    const wrapper = mount(RResultState, {
      props: { status: 'info' },
      slots: { extra: '<p>Extra info</p>' },
    })
    expect(wrapper.find('.r-result-state__extra').exists()).toBe(true)
    expect(wrapper.text()).toContain('Extra info')
  })
})

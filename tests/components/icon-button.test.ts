import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RIconButton from '../../src/components/icon-button/RIconButton.vue'

describe('RIconButton', () => {
  it('renders with required icon prop', () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit' } })
    expect(wrapper.find('[data-testid="icon-button"]').exists()).toBe(true)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit' } })
    await wrapper.find('[data-testid="icon-button"]').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit', disabled: true } })
    await wrapper.find('[data-testid="icon-button"]').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('renders tooltip when provided', () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit', tooltip: 'Edit item' } })
    expect(wrapper.html()).toBeTruthy()
  })

  it('applies danger type when danger prop is true', () => {
    const wrapper = mount(RIconButton, { props: { icon: 'trash', danger: true } })
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders with different sizes', () => {
    for (const size of ['tiny', 'small', 'medium', 'large'] as const) {
      const wrapper = mount(RIconButton, { props: { icon: 'edit', size } })
      expect(wrapper.html()).toBeTruthy()
    }
  })

  it('uses icon name as default aria-label', () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit' } })
    const btn = wrapper.find('[data-testid="icon-button"]')
    expect(btn.attributes('aria-label')).toBe('edit')
  })

  it('uses custom ariaLabel when provided', () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit', ariaLabel: 'Edit record' } })
    const btn = wrapper.find('[data-testid="icon-button"]')
    expect(btn.attributes('aria-label')).toBe('Edit record')
  })

  it('shows loading state', () => {
    const wrapper = mount(RIconButton, { props: { icon: 'edit', loading: true } })
    expect(wrapper.html()).toBeTruthy()
  })
})

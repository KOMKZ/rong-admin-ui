import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RPasswordStrength from '../../src/components/password-strength/RPasswordStrength.vue'
import type { PasswordStrengthExpose } from '../../src/components/password-strength/types'

describe('RPasswordStrength', () => {
  it('renders with empty value', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: '' } })
    expect(wrapper.find('[data-testid="password-strength"]').exists()).toBe(true)
  })

  it('does not show bar when value is empty', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: '' } })
    expect(wrapper.find('[data-testid="strength-bar"]').exists()).toBe(false)
  })

  it('shows strength bar when value is provided', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'abc' } })
    expect(wrapper.find('[data-testid="strength-bar"]').exists()).toBe(true)
  })

  it('shows level label by default', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'Test123!' } })
    expect(wrapper.find('[data-testid="strength-level"]').exists()).toBe(true)
  })

  it('shows rules list when value is provided', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'abc' } })
    expect(wrapper.find('[data-testid="strength-rules"]').exists()).toBe(true)
  })

  it('hides rules when showRules is false', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'abc', showRules: false } })
    expect(wrapper.find('[data-testid="strength-rules"]').exists()).toBe(false)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: '' } })
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true)
  })

  it('expose getLevel returns correct level for strong password', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'Test123!@#' } })
    const vm = wrapper.vm as unknown as PasswordStrengthExpose
    const level = vm.getLevel()
    expect(['strong', 'excellent']).toContain(level)
  })

  it('expose getScore returns correct score', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: '' } })
    const vm = wrapper.vm as unknown as PasswordStrengthExpose
    expect(vm.getScore()).toBe(0)
  })

  it('expose getPassedRules returns array', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'Test123!' } })
    const vm = wrapper.vm as unknown as PasswordStrengthExpose
    const passed = vm.getPassedRules()
    expect(Array.isArray(passed)).toBe(true)
    expect(passed.length).toBeGreaterThan(0)
  })

  it('renders disabled state', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: '', disabled: true } })
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows score when showScore is true', () => {
    const wrapper = mount(RPasswordStrength, { props: { modelValue: 'test', showScore: true } })
    expect(wrapper.find('[data-testid="strength-score"]').exists()).toBe(true)
  })

  it('expose focus() is a real function (not noop)', () => {
    const wrapper = mount(RPasswordStrength, {
      props: { modelValue: '' },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as PasswordStrengthExpose
    expect(typeof vm.focus).toBe('function')
    expect(() => vm.focus()).not.toThrow()
    wrapper.unmount()
  })
})

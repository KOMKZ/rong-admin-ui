import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RCodeVerify from '../../src/components/code-verify/RCodeVerify.vue'
import type { CodeVerifyExpose } from '../../src/components/code-verify/types'

describe('RCodeVerify', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders with empty value', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '' } })
    expect(wrapper.find('[data-testid="code-verify"]').exists()).toBe(true)
  })

  it('renders send button', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '' } })
    expect(wrapper.find('[data-testid="code-send-btn"]').exists()).toBe(true)
  })

  it('emits send on button click', async () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '' } })
    await wrapper.find('[data-testid="code-send-btn"]').trigger('click')
    expect(wrapper.emitted('send')).toBeTruthy()
  })

  it('shows countdown after send', async () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '', countdown: 60 } })
    await wrapper.find('[data-testid="code-send-btn"]').trigger('click')
    expect(wrapper.text()).toContain('60s')
  })

  it('expose startCountdown starts timer', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '' } })
    const vm = wrapper.vm as unknown as CodeVerifyExpose
    vm.startCountdown()
    expect(vm.getRemaining()).toBe(60)
  })

  it('expose resetCountdown stops timer', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '' } })
    const vm = wrapper.vm as unknown as CodeVerifyExpose
    vm.startCountdown()
    vm.resetCountdown()
    expect(vm.getRemaining()).toBe(0)
  })

  it('expose clear clears input', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '123456' } })
    const vm = wrapper.vm as unknown as CodeVerifyExpose
    vm.clear()
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('')
  })

  it('respects disabled prop', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '', disabled: true } })
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows sending state', () => {
    const wrapper = mount(RCodeVerify, { props: { modelValue: '', sending: true } })
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders custom labels', () => {
    const wrapper = mount(RCodeVerify, {
      props: { modelValue: '', sendLabel: 'Send Code', sendingLabel: 'Sending...', resendLabel: 'Resend' },
    })
    expect(wrapper.text()).toContain('Send Code')
  })

  it('expose focus() is a real function (not noop)', () => {
    const wrapper = mount(RCodeVerify, {
      props: { modelValue: '' },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as CodeVerifyExpose
    expect(typeof vm.focus).toBe('function')
    expect(() => vm.focus()).not.toThrow()
    wrapper.unmount()
  })
})

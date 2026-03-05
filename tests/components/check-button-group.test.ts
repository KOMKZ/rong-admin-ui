import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RCheckButtonGroup from '../../src/components/check-button-group/RCheckButtonGroup.vue'
import type { CheckButtonOption, CheckButtonGroupExpose } from '../../src/components/check-button-group/types'

const options: CheckButtonOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week', icon: 'calendar' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year', disabled: true },
]

describe('RCheckButtonGroup', () => {
  it('renders all options', () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: null } })
    expect(wrapper.findAll('button[data-testid^="check-button-"]').length).toBe(4)
  })

  it('marks selected button', () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: 'day' } })
    expect(wrapper.find('[data-testid="check-button-day"]').classes()).toContain('r-check-button--checked')
  })

  it('emits on click (single mode)', async () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: null } })
    await wrapper.find('[data-testid="check-button-week"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('week')
  })

  it('deselects on re-click', async () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: 'day' } })
    await wrapper.find('[data-testid="check-button-day"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toBeNull()
  })

  it('supports multiple mode', async () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: ['day'], multiple: true } })
    await wrapper.find('[data-testid="check-button-week"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual(['day', 'week'])
  })

  it('respects disabled option', () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: null } })
    const btn = wrapper.find('[data-testid="check-button-year"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('expose selectAll works in multiple mode', () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: [], multiple: true } })
    const vm = wrapper.vm as unknown as CheckButtonGroupExpose
    vm.selectAll()
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual(['day', 'week', 'month'])
  })

  it('expose clearAll works', () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: ['day'], multiple: true } })
    const vm = wrapper.vm as unknown as CheckButtonGroupExpose
    vm.clearAll()
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([])
  })

  it('renders block mode', () => {
    const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: null, block: true } })
    expect(wrapper.classes()).toContain('r-check-button-group--block')
  })

  it('renders different sizes', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const wrapper = mount(RCheckButtonGroup, { props: { options, modelValue: null, size } })
      expect(wrapper.classes()).toContain(`r-check-button-group--${size}`)
    }
  })
})

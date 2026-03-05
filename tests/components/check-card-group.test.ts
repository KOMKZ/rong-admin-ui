import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RCheckCardGroup from '../../src/components/check-card-group/RCheckCardGroup.vue'
import type { CheckCardOption, CheckCardGroupExpose } from '../../src/components/check-card-group/types'

const options: CheckCardOption[] = [
  { value: 'a', title: 'Option A', description: 'First option' },
  { value: 'b', title: 'Option B', description: 'Second option', icon: 'star' },
  { value: 'c', title: 'Option C', disabled: true },
]

describe('RCheckCardGroup', () => {
  it('renders all options', () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: null } })
    expect(wrapper.findAll('button[data-testid^="check-card-"]').length).toBe(3)
  })

  it('marks selected card', () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: 'a' } })
    expect(wrapper.find('[data-testid="check-card-a"]').classes()).toContain('r-check-card--checked')
  })

  it('emits update:modelValue on click (single mode)', async () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: null } })
    await wrapper.find('[data-testid="check-card-b"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[0][0]).toBe('b')
  })

  it('deselects on re-click in single mode', async () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: 'a' } })
    await wrapper.find('[data-testid="check-card-a"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[0][0]).toBeNull()
  })

  it('supports multiple selection mode', async () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: ['a'], multiple: true } })
    await wrapper.find('[data-testid="check-card-b"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[0][0]).toEqual(['a', 'b'])
  })

  it('respects disabled option', () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: null } })
    expect(wrapper.find('[data-testid="check-card-c"]').attributes('disabled')).toBeDefined()
  })

  it('expose selectAll selects all non-disabled', () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: [], multiple: true } })
    const vm = wrapper.vm as unknown as CheckCardGroupExpose
    vm.selectAll()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[0][0]).toEqual(['a', 'b'])
  })

  it('expose clearAll clears selection', () => {
    const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: ['a'], multiple: true } })
    const vm = wrapper.vm as unknown as CheckCardGroupExpose
    vm.clearAll()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[0][0]).toEqual([])
  })

  it('renders with tag and tagType', () => {
    const opts: CheckCardOption[] = [{ value: 'x', title: 'X', tag: 'Hot', tagType: 'success' }]
    const wrapper = mount(RCheckCardGroup, { props: { options: opts, modelValue: null } })
    expect(wrapper.text()).toContain('Hot')
  })

  it('renders with different sizes', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const wrapper = mount(RCheckCardGroup, { props: { options, modelValue: null, size } })
      expect(wrapper.classes()).toContain(`r-check-card-group--${size}`)
    }
  })
})

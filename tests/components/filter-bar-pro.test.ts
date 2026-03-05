import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RFilterBarPro from '../../src/components/filter-bar/RFilterBarPro.vue'
import type { FilterBarProExpose } from '../../src/components/filter-bar/types'
import type { FormFieldSchema } from '../../src/components/form-renderer/types'

const baseSchema: FormFieldSchema[] = [
  { key: 'keyword', label: '关键字', type: 'input' },
  { key: 'status', label: '状态', type: 'select', options: [{ label: '正常', value: 'active' }] },
  { key: 'role', label: '角色', type: 'select', options: [{ label: '管理员', value: 'admin' }] },
  { key: 'dept', label: '部门', type: 'input' },
]

describe('RFilterBarPro', () => {
  it('renders with required props', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {} },
    })
    expect(wrapper.find('.r-filter-bar-pro').exists()).toBe(true)
  })

  it('renders search and reset buttons', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {} },
    })
    expect(wrapper.find('[data-testid="filter-search-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="filter-reset-btn"]').exists()).toBe(true)
  })

  it('shows advanced toggle when collapsible and has more fields', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {}, collapsible: true, maxVisibleFields: 2 },
    })
    expect(wrapper.find('[data-testid="filter-toggle-btn"]').exists()).toBe(true)
  })

  it('hides advanced toggle when not collapsible', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {}, collapsible: false },
    })
    expect(wrapper.find('[data-testid="filter-toggle-btn"]').exists()).toBe(false)
  })

  it('renders quick filters when provided', () => {
    const quickFilters = [
      { key: 'status', label: '正常', value: 'active' },
      { key: 'status', label: '禁用', value: 'disabled' },
    ]
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {}, quickFilters },
    })
    expect(wrapper.find('[data-testid="quick-filters"]').exists()).toBe(true)
  })

  it('emits search on search button click', async () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: { keyword: 'test' } },
    })
    await wrapper.find('[data-testid="filter-search-btn"]').trigger('click')
    expect(wrapper.emitted('search')).toBeTruthy()
  })

  it('emits reset and clears values on reset button click', async () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: { keyword: 'test' } },
    })
    await wrapper.find('[data-testid="filter-reset-btn"]').trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('shows filter chips for active values', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: { keyword: 'hello' } },
    })
    expect(wrapper.find('[data-testid="filter-chips"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chip-keyword"]').exists()).toBe(true)
  })

  it('exposes reset/search/getValues/setValues methods', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {} },
    })
    const vm = wrapper.vm as unknown as FilterBarProExpose
    expect(typeof vm.reset).toBe('function')
    expect(typeof vm.search).toBe('function')
    expect(typeof vm.getValues).toBe('function')
    expect(typeof vm.setValues).toBe('function')
    expect(typeof vm.toggleAdvanced).toBe('function')
  })

  it('getValues returns current filter state', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: { keyword: 'abc' } },
    })
    const vm = wrapper.vm as unknown as FilterBarProExpose
    const vals = vm.getValues()
    expect(vals.keyword).toBe('abc')
  })

  it('setValues updates model and emits', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {} },
    })
    const vm = wrapper.vm as unknown as FilterBarProExpose
    vm.setValues({ keyword: 'new' })
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('renders saved schemes button when storageKey is set', () => {
    const wrapper = mount(RFilterBarPro, {
      props: { schema: baseSchema, modelValue: {}, storageKey: 'test-key' },
    })
    expect(wrapper.find('[data-testid="filter-schemes-btn"]').exists()).toBe(true)
  })
})

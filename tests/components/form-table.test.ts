import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RFormTable from '../../src/components/form-table/RFormTable.vue'
import type { FormTableColumn, FormTableRow, FormTableExpose } from '../../src/components/form-table/types'

const columns: FormTableColumn[] = [
  { key: 'name', title: '姓名', schema: { key: 'name', label: '姓名', type: 'input', rules: [{ required: true, message: '必填' }] } },
  { key: 'email', title: '邮箱', schema: { key: 'email', label: '邮箱', type: 'input' } },
  {
    key: 'role',
    title: '角色',
    schema: {
      key: 'role', label: '角色', type: 'select',
      options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }],
    },
  },
]

const defaultRow: FormTableRow = { _key: 'r1', name: '', email: '', role: null }

describe('RFormTable', () => {
  it('renders with columns and rows', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    expect(wrapper.find('[data-testid="form-table"]').exists()).toBe(true)
  })

  it('shows empty message when no rows', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [] } })
    expect(wrapper.text()).toContain('暂无数据')
  })

  it('renders add button', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [] } })
    expect(wrapper.find('[data-testid="form-table-add-btn"]').exists()).toBe(true)
  })

  it('emits add event and new row on add click', async () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [] } })
    await wrapper.find('[data-testid="form-table-add-btn"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.length).toBe(1)
    const rows = emitted[0][0] as FormTableRow[]
    expect(rows.length).toBe(1)
    expect(rows[0]._key).toBeTruthy()
  })

  it('renders row index numbers', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    expect(wrapper.text()).toContain('1')
  })

  it('renders remove button per row', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    expect(wrapper.find('[data-testid="form-table-remove-0"]').exists()).toBe(true)
  })

  it('emits remove on row remove', async () => {
    const rows = [defaultRow, { _key: 'r2', name: 'Test', email: '', role: null }]
    const wrapper = mount(RFormTable, { props: { columns, modelValue: rows } })
    await wrapper.find('[data-testid="form-table-remove-0"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    expect((emitted[0][0] as FormTableRow[]).length).toBe(1)
  })

  it('expose validate returns errors for empty required fields', async () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    const vm = wrapper.vm as unknown as FormTableExpose
    const results = await vm.validate()
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].field).toBe('name')
  })

  it('expose validate returns empty for valid data', async () => {
    const validRow: FormTableRow = { _key: 'v1', name: 'John', email: 'a@b.com', role: 'admin' }
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [validRow] } })
    const vm = wrapper.vm as unknown as FormTableExpose
    const results = await vm.validate()
    expect(results.length).toBe(0)
  })

  it('expose clearAll removes all rows', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    const vm = wrapper.vm as unknown as FormTableExpose
    vm.clearAll()
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([])
  })

  it('expose getRows returns current rows', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    const vm = wrapper.vm as unknown as FormTableExpose
    expect(vm.getRows().length).toBe(1)
  })

  it('respects maxRows limit', async () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow], maxRows: 1 } })
    expect(wrapper.find('[data-testid="form-table-add-btn"]').exists()).toBe(false)
  })

  it('renders input and select fields', () => {
    const wrapper = mount(RFormTable, { props: { columns, modelValue: [defaultRow] } })
    expect(wrapper.find('[data-testid="form-table-input-0-name"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="form-table-select-0-role"]').exists()).toBe(true)
  })
})

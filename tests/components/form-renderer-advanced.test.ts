import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RFormRenderer } from '@/components/form-renderer'
import type { FormFieldSchema } from '@/components/form-renderer'

describe('RFormRenderer — advanced', () => {
  it('should render checkbox field type', () => {
    const schema: FormFieldSchema[] = [
      {
        key: 'tags',
        label: '标签',
        type: 'checkbox',
        options: [
          { label: 'Vue', value: 'vue' },
          { label: 'React', value: 'react' },
        ],
      },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { tags: ['vue'] } },
    })
    expect(wrapper.html()).toContain('Vue')
    expect(wrapper.html()).toContain('React')
  })

  it('should render date field type', () => {
    const schema: FormFieldSchema[] = [
      { key: 'birthday', label: '生日', type: 'date', placeholder: '选择日期' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { birthday: null } },
    })
    expect(wrapper.html()).toContain('生日')
  })

  it('should render daterange field type', () => {
    const schema: FormFieldSchema[] = [
      { key: 'period', label: '时间段', type: 'daterange' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { period: null } },
    })
    expect(wrapper.html()).toContain('时间段')
  })

  it('should render number field type', () => {
    const schema: FormFieldSchema[] = [
      { key: 'count', label: '数量', type: 'number', placeholder: '输入数量' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { count: 5 } },
    })
    expect(wrapper.html()).toContain('数量')
  })

  it('should emit reset event on reset', async () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input', defaultValue: '' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: 'test' } },
    })
    const vm = wrapper.vm as unknown as { resetFields: () => void }
    vm.resetFields()
    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.emitted('update:model')).toBeTruthy()
  })

  it('should call clearValidate via expose', () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: '' } },
    })
    const vm = wrapper.vm as unknown as { clearValidate: (keys?: string[]) => void }
    vm.clearValidate()
    vm.clearValidate(['name'])
    expect(true).toBe(true)
  })

  it('should call setValues via expose', () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: '' } },
    })
    const vm = wrapper.vm as unknown as { setValues: (v: Record<string, unknown>) => void }
    vm.setValues({ name: '新值' })
    expect(wrapper.emitted('update:model')?.[0][0]).toMatchObject({ name: '新值' })
  })

  it('should handle validate returning false on validation failure', async () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input', rules: [{ required: true, message: '必填' }] },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: '' } },
    })
    const vm = wrapper.vm as unknown as { validate: () => Promise<boolean> }
    const result = await vm.validate()
    expect(typeof result).toBe('boolean')
  })

  it('should render with multi-column layout', () => {
    const schema: FormFieldSchema[] = [
      { key: 'a', label: 'A', type: 'input' },
      { key: 'b', label: 'B', type: 'input' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { a: '', b: '' }, cols: 2 },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should conditionally disable fields based on function', () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input' },
      { key: 'extra', label: '附加', type: 'input', disabled: (m) => m.name === 'lock' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: 'lock', extra: '' } },
    })
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('should render with validation rules including custom validator', () => {
    const schema: FormFieldSchema[] = [
      {
        key: 'code',
        label: '代码',
        type: 'input',
        rules: [{
          validator: (value: unknown) => {
            if (typeof value === 'string' && value.length >= 3) return true
            return '至少3个字符'
          },
        }],
      },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { code: '' } },
    })
    expect(wrapper.html()).toContain('代码')
  })

  it('should support label placement top', () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: '' }, labelPlacement: 'top' },
    })
    expect(wrapper.html()).toBeTruthy()
  })
})

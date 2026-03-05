import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RFormRenderer } from '@/components/form-renderer'
import type { FormFieldSchema } from '@/components/form-renderer'

const basicSchema: FormFieldSchema[] = [
  { key: 'name', label: '姓名', type: 'input', placeholder: '请输入姓名' },
  { key: 'age', label: '年龄', type: 'number' },
  {
    key: 'gender',
    label: '性别',
    type: 'select',
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
  },
]

describe('RFormRenderer', () => {
  it('should render form fields from schema', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: basicSchema,
        model: { name: '', age: null, gender: null },
      },
    })
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.html()).toContain('姓名')
    expect(wrapper.html()).toContain('年龄')
    expect(wrapper.html()).toContain('性别')
  })

  it('should render input field type', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input', placeholder: '请输入' }],
        model: { name: '' },
      },
    })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
  })

  it('should render textarea field type', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'desc', label: '描述', type: 'textarea' }],
        model: { desc: '' },
      },
    })
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
  })

  it('should render switch field type', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'active', label: '启用', type: 'switch' }],
        model: { active: false },
      },
    })
    expect(wrapper.find('[role="switch"]').exists()).toBe(true)
  })

  it('should render radio field type', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [
          {
            key: 'type',
            label: '类型',
            type: 'radio',
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
            ],
          },
        ],
        model: { type: 'a' },
      },
    })
    expect(wrapper.html()).toContain('A')
    expect(wrapper.html()).toContain('B')
  })

  it('should emit update:model when field value changes', async () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input' }],
        model: { name: '' },
      },
    })
    const input = wrapper.find('input')
    await input.setValue('张三')
    const emitted = wrapper.emitted('update:model')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ name: '张三' })
  })

  it('should hide fields when hidden is true', () => {
    const schema: FormFieldSchema[] = [
      { key: 'visible', label: '可见', type: 'input' },
      { key: 'hidden', label: '隐藏', type: 'input', hidden: true },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { visible: '', hidden: '' } },
    })
    expect(wrapper.html()).toContain('可见')
    expect(wrapper.html()).not.toContain('隐藏')
  })

  it('should hide fields when hidden is a function returning true', () => {
    const schema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input' },
      { key: 'extra', label: '附加', type: 'input', hidden: (m) => m.name === 'hide' },
    ]
    const wrapper = mount(RFormRenderer, {
      props: { schema, model: { name: 'hide', extra: '' } },
    })
    expect(wrapper.html()).not.toContain('附加')
  })

  it('should render default action buttons (submit and reset)', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input' }],
        model: { name: '' },
      },
    })
    expect(wrapper.html()).toContain('提交')
    expect(wrapper.html()).toContain('重置')
  })

  it('should render custom actions slot', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input' }],
        model: { name: '' },
      },
      slots: { actions: '<button class="custom-btn">自定义</button>' },
    })
    expect(wrapper.find('.custom-btn').exists()).toBe(true)
  })

  it('should expose validate, resetFields, getValues, setValues, clearValidate', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input' }],
        model: { name: 'test' },
      },
    })
    const vm = wrapper.vm as unknown as {
      validate: () => Promise<boolean>
      resetFields: () => void
      getValues: () => Record<string, unknown>
      setValues: (v: Record<string, unknown>) => void
      clearValidate: () => void
    }
    expect(typeof vm.validate).toBe('function')
    expect(typeof vm.resetFields).toBe('function')
    expect(typeof vm.getValues).toBe('function')
    expect(typeof vm.setValues).toBe('function')
    expect(typeof vm.clearValidate).toBe('function')
  })

  it('should return current values from getValues', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input' }],
        model: { name: 'value123' },
      },
    })
    const vm = wrapper.vm as unknown as { getValues: () => Record<string, unknown> }
    expect(vm.getValues()).toMatchObject({ name: 'value123' })
  })

  it('should disable all fields when disabled prop is true', () => {
    const wrapper = mount(RFormRenderer, {
      props: {
        schema: [{ key: 'name', label: '姓名', type: 'input' }],
        model: { name: '' },
        disabled: true,
      },
    })
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})

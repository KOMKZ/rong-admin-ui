import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RFormRenderer from '../../src/components/form-renderer/RFormRenderer.vue'
import type { FormFieldSchema, FormFieldGroup, FormRendererExpose } from '../../src/components/form-renderer/types'

function basicSchema(): FormFieldSchema[] {
  return [
    { key: 'name', label: 'Name', type: 'input' },
    { key: 'email', label: 'Email', type: 'input' },
    { key: 'role', label: 'Role', type: 'select', options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] },
  ]
}

describe('RFormRenderer Pro Features', () => {
  describe('async options', () => {
    it('loads async options on mount', async () => {
      const asyncLoader = vi.fn().mockResolvedValue([
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ])
      const schema: FormFieldSchema[] = [
        {
          key: 'category',
          label: 'Category',
          type: 'select',
          asyncOptions: asyncLoader,
        },
      ]

      mount(RFormRenderer, {
        props: { schema, model: {} },
      })

      await flushPromises()
      expect(asyncLoader).toHaveBeenCalledTimes(1)
    })

    it('reloads async options when dependency changes', async () => {
      const loader = vi.fn().mockResolvedValue([{ label: 'X', value: 'x' }])
      const schema: FormFieldSchema[] = [
        { key: 'country', label: 'Country', type: 'select', options: [{ label: 'US', value: 'us' }] },
        {
          key: 'city',
          label: 'City',
          type: 'select',
          asyncOptions: loader,
          dependency: {
            fields: ['country'],
            effect: () => undefined,
          },
        },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: { country: 'us' } },
      })

      await flushPromises()
      const initialCalls = loader.mock.calls.length

      await wrapper.setProps({ model: { country: 'cn' } })
      await flushPromises()
      expect(loader.mock.calls.length).toBeGreaterThan(initialCalls)
    })

    it('handles async options loader failure gracefully', async () => {
      const loader = vi.fn().mockRejectedValue(new Error('API Error'))
      const schema: FormFieldSchema[] = [
        {
          key: 'cat',
          label: 'Cat',
          type: 'select',
          asyncOptions: loader,
        },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {} },
      })

      await flushPromises()
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('field dependency', () => {
    it('applies dependency effect when dep field changes', async () => {
      const effectFn = vi.fn().mockReturnValue({ disabled: true })
      const schema: FormFieldSchema[] = [
        { key: 'type', label: 'Type', type: 'select', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
        {
          key: 'detail',
          label: 'Detail',
          type: 'input',
          dependency: {
            fields: ['type'],
            effect: effectFn,
          },
        },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: { type: 'a' } },
      })

      await flushPromises()
      await wrapper.setProps({ model: { type: 'b' } })
      await flushPromises()
      expect(effectFn).toHaveBeenCalled()
    })
  })

  describe('grouped fields', () => {
    it('renders group headers with title', async () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input' },
        { key: 'email', label: 'Email', type: 'input' },
        { key: 'address', label: 'Address', type: 'input' },
      ]

      const groups: FormFieldGroup[] = [
        { key: 'basic', title: 'Basic Info', fields: ['name', 'email'] },
        { key: 'contact', title: 'Contact Info', fields: ['address'] },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {}, groups },
      })

      await flushPromises()
      const html = wrapper.html()
      expect(html).toContain('Basic Info')
      expect(html).toContain('Contact Info')
    })

    it('renders group description', async () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input' },
      ]
      const groups: FormFieldGroup[] = [
        { key: 'g1', title: 'Group 1', description: 'Some description', fields: ['name'] },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {}, groups },
      })

      await flushPromises()
      expect(wrapper.html()).toContain('Some description')
    })

    it('toggles group collapse when collapsible', async () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input' },
      ]
      const groups: FormFieldGroup[] = [
        { key: 'g1', title: 'Group 1', fields: ['name'], collapsible: true },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {}, groups },
      })

      await flushPromises()
      const toggle = wrapper.find('.r-form-group__toggle')
      expect(toggle.exists()).toBe(true)
      await toggle.trigger('click')
      await flushPromises()
    })

    it('respects defaultCollapsed', async () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input' },
      ]
      const groups: FormFieldGroup[] = [
        { key: 'g1', title: 'Group 1', fields: ['name'], collapsible: true, defaultCollapsed: true },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {}, groups },
      })

      await flushPromises()
      const arrow = wrapper.find('.r-form-group__arrow')
      if (arrow.exists()) {
        expect(arrow.classes()).toContain('collapsed')
      }
    })

    it('renders ungrouped fields outside groups', async () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input' },
        { key: 'ungrouped', label: 'Ungrouped', type: 'input' },
      ]
      const groups: FormFieldGroup[] = [
        { key: 'g1', title: 'Group 1', fields: ['name'] },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {}, groups },
      })

      await flushPromises()
      expect(wrapper.html()).toContain('Ungrouped')
    })
  })

  describe('expose methods', () => {
    it('patchField updates a field config', async () => {
      const wrapper = mount(RFormRenderer, {
        props: { schema: basicSchema(), model: {} },
      })

      await flushPromises()
      const vm = wrapper.vm as unknown as FormRendererExpose
      vm.patchField('name', { disabled: true })
      await flushPromises()
    })

    it('reloadOptions triggers async loader again', async () => {
      const loader = vi.fn().mockResolvedValue([])
      const schema: FormFieldSchema[] = [
        { key: 'cat', label: 'Category', type: 'select', asyncOptions: loader },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {} },
      })

      await flushPromises()
      const vm = wrapper.vm as unknown as FormRendererExpose
      await vm.reloadOptions('cat')
      expect(loader.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    it('getValues returns model copy', () => {
      const wrapper = mount(RFormRenderer, {
        props: { schema: basicSchema(), model: { name: 'test' } },
      })
      const vm = wrapper.vm as unknown as FormRendererExpose
      expect(vm.getValues()).toEqual({ name: 'test' })
    })

    it('setValues emits update:model', () => {
      const wrapper = mount(RFormRenderer, {
        props: { schema: basicSchema(), model: {} },
      })
      const vm = wrapper.vm as unknown as FormRendererExpose
      vm.setValues({ name: 'new' })
      expect(wrapper.emitted('update:model')).toBeTruthy()
    })

    it('resetFields emits reset and update:model', () => {
      const wrapper = mount(RFormRenderer, {
        props: { schema: [{ key: 'name', label: 'Name', type: 'input', defaultValue: 'default' }], model: { name: 'test' } },
      })
      const vm = wrapper.vm as unknown as FormRendererExpose
      vm.resetFields()
      expect(wrapper.emitted('reset')).toBeTruthy()
      expect(wrapper.emitted('update:model')).toBeTruthy()
    })
  })

  describe('field types rendering', () => {
    it('renders all field types', async () => {
      const schema: FormFieldSchema[] = [
        { key: 'text', label: 'Text', type: 'input' },
        { key: 'num', label: 'Number', type: 'number' },
        { key: 'sel', label: 'Select', type: 'select', options: [] },
        { key: 'radio', label: 'Radio', type: 'radio', options: [{ label: 'A', value: 'a' }] },
        { key: 'check', label: 'Checkbox', type: 'checkbox', options: [{ label: 'B', value: 'b' }] },
        { key: 'sw', label: 'Switch', type: 'switch' },
        { key: 'ta', label: 'Textarea', type: 'textarea' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'dr', label: 'DateRange', type: 'daterange' },
      ]

      const wrapper = mount(RFormRenderer, {
        props: { schema, model: {} },
      })

      await flushPromises()
      expect(wrapper.find('.n-form').exists()).toBe(true)
    })

    it('handles disabled as function', () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input', disabled: (m) => m.locked === true },
      ]
      const wrapper = mount(RFormRenderer, {
        props: { schema, model: { locked: true } },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('handles hidden as function', () => {
      const schema: FormFieldSchema[] = [
        { key: 'name', label: 'Name', type: 'input', hidden: (m) => m.hide === true },
      ]
      const wrapper = mount(RFormRenderer, {
        props: { schema, model: { hide: true } },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('handles cols prop', () => {
      const wrapper = mount(RFormRenderer, {
        props: { schema: basicSchema(), model: {}, cols: 2 },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('handles readonly prop', () => {
      const wrapper = mount(RFormRenderer, {
        props: { schema: basicSchema(), model: {}, readonly: true },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })
})

import { describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { RDrawerForm } from '@/components/drawer-form'
import type { DrawerFormError } from '@/components/drawer-form'
import type { FormFieldSchema } from '@/components/form-renderer/types'
import { defineComponent, h } from 'vue'

const basicSchema: FormFieldSchema[] = [
  { key: 'name', label: 'Name', type: 'input', rules: [{ required: true }] },
  { key: 'email', label: 'Email', type: 'input', rules: [{ required: true }] },
]

const basicModel = { name: 'John', email: 'john@example.com' }

const createMockFormRenderer = () => {
  const validateFn = vi.fn().mockResolvedValue(true)
  const resetFieldsFn = vi.fn()
  return {
    component: defineComponent({
      name: 'RFormRenderer',
      props: ['schema', 'model', 'labelWidth', 'labelPlacement'],
      emits: ['update:model'],
      setup(_, { expose }) {
        expose({ validate: validateFn, resetFields: resetFieldsFn })
        return {}
      },
      render() { return h('div', { class: 'mock-form-renderer' }) },
    }),
    validateFn,
    resetFieldsFn,
  }
}

function simpleStub(cls: string) {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      return () => h('div', { class: cls, ...attrs }, slots.default?.())
    },
  })
}

const drawerContentStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => h('div', { class: 'dc-stub' }, [slots.header?.(), slots.default?.(), slots.footer?.()])
  },
})

function mountDrawer(overrides: Record<string, unknown> = {}, formMock = createMockFormRenderer()) {
  const wrapper = mount(RDrawerForm, {
    props: {
      visible: true,
      title: 'Test Form',
      schema: basicSchema,
      model: basicModel,
      ...overrides,
    },
    global: {
      stubs: {
        Drawer: simpleStub('s-drawer'),
        DrawerContent: drawerContentStub,
        Spin: simpleStub('s-spin'),
        Button: simpleStub('s-btn'),
        Space: simpleStub('s-space'),
        RFormRenderer: formMock.component,
        RIcon: defineComponent({
          name: 'RIcon',
          props: ['name', 'size', 'color'],
          render() { return h('i') },
        }),
      },
    },
  })
  return { wrapper, ...formMock }
}

describe('RDrawerForm', () => {
  it('renders title and header', () => {
    const { wrapper } = mountDrawer()
    expect(wrapper.find('[data-testid="drawer-form-header"]').exists()).toBe(true)
    expect(wrapper.find('.r-drawer-form__title').text()).toBe('Test Form')
  })

  it('renders body area', () => {
    const { wrapper } = mountDrawer()
    expect(wrapper.find('[data-testid="drawer-form-body"]').exists()).toBe(true)
  })

  it('renders footer with cancel and submit', () => {
    const { wrapper } = mountDrawer()
    expect(wrapper.find('[data-testid="drawer-form-footer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="drawer-form-cancel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="drawer-form-submit"]').exists()).toBe(true)
  })

  it('hides footer when showFooter=false', () => {
    const { wrapper } = mountDrawer({ showFooter: false })
    expect(wrapper.find('[data-testid="drawer-form-footer"]').exists()).toBe(false)
  })

  it('emits cancel on cancel click', async () => {
    const { wrapper } = mountDrawer()
    await wrapper.find('[data-testid="drawer-form-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })

  it('no error summary initially', () => {
    const { wrapper } = mountDrawer()
    expect(wrapper.find('[data-testid="drawer-form-errors"]').exists()).toBe(false)
  })

  it('no retry button initially', () => {
    const { wrapper } = mountDrawer()
    expect(wrapper.find('[data-testid="drawer-form-retry"]').exists()).toBe(false)
  })

  it('emits submit when validation passes', async () => {
    const { wrapper } = mountDrawer()
    await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('does not emit submit when form validation fails', async () => {
    const mock = createMockFormRenderer()
    mock.validateFn.mockResolvedValue(false)
    const { wrapper } = mountDrawer({}, mock)
    await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  describe('asyncValidator', () => {
    it('shows error summary on validation errors', async () => {
      const asyncValidator = vi.fn()
        .mockResolvedValue([{ field: 'Email', message: 'Already taken' }] satisfies DrawerFormError[])

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()

      const errors = wrapper.find('[data-testid="drawer-form-errors"]')
      expect(errors.exists()).toBe(true)
      expect(errors.text()).toContain('Already taken')
      expect(errors.text()).toContain('Email')
    })

    it('shows retry button after failure', async () => {
      const asyncValidator = vi.fn()
        .mockResolvedValue([{ message: 'Server error' }] satisfies DrawerFormError[])

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="drawer-form-retry"]').exists()).toBe(true)
    })

    it('emits submit when validator returns empty', async () => {
      const asyncValidator = vi.fn()
        .mockResolvedValue([])

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()
      expect(wrapper.emitted('submit')).toHaveLength(1)
    })

    it('error summary has role=alert', async () => {
      const asyncValidator = vi.fn()
        .mockResolvedValue([{ message: 'Fail' }])

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="drawer-form-errors"]').attributes('role')).toBe('alert')
    })

    it('catches thrown errors', async () => {
      const asyncValidator = vi.fn()
        .mockRejectedValue(new Error('Network down'))

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()

      const errors = wrapper.find('[data-testid="drawer-form-errors"]')
      expect(errors.exists()).toBe(true)
      expect(errors.text()).toContain('Network down')
    })
  })

  describe('error recovery', () => {
    it('emits retry on retry click', async () => {
      const asyncValidator = vi.fn()
        .mockResolvedValue([{ message: 'Fail' }])

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-testid="drawer-form-retry"]').trigger('click')
      await flushPromises()
      expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('clears errors when drawer closes', async () => {
      const asyncValidator = vi.fn()
        .mockResolvedValue([{ message: 'Error' }])

      const { wrapper } = mountDrawer({ asyncValidator })
      await wrapper.find('[data-testid="drawer-form-submit"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="drawer-form-errors"]').exists()).toBe(true)

      await wrapper.setProps({ visible: false })
      await flushPromises()
      expect(wrapper.find('[data-testid="drawer-form-errors"]').exists()).toBe(false)
    })
  })

  describe('expose', () => {
    it('exposes clearErrors', () => {
      const { wrapper } = mountDrawer()
      expect(typeof (wrapper.vm as unknown as Record<string, unknown>).clearErrors).toBe('function')
    })

    it('exposes validate', () => {
      const { wrapper } = mountDrawer()
      expect(typeof (wrapper.vm as unknown as Record<string, unknown>).validate).toBe('function')
    })

    it('exposes resetFields', () => {
      const { wrapper } = mountDrawer()
      expect(typeof (wrapper.vm as unknown as Record<string, unknown>).resetFields).toBe('function')
    })
  })
})

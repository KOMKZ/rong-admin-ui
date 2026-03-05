import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RStepForm from '../../src/components/step-form/RStepForm.vue'
import type { StepDefinition, StepFormExpose } from '../../src/components/step-form/types'

const basicSteps: StepDefinition[] = [
  {
    key: 'basic',
    title: '基本信息',
    description: '填写基本资料',
    schema: [
      { key: 'name', label: '姓名', type: 'input' },
      { key: 'email', label: '邮箱', type: 'input' },
    ],
  },
  {
    key: 'permissions',
    title: '权限配置',
    schema: [
      { key: 'role', label: '角色', type: 'select', options: [{ label: '管理员', value: 'admin' }] },
    ],
  },
  {
    key: 'confirm',
    title: '确认提交',
  },
]

const validatedSteps: StepDefinition[] = [
  {
    key: 'step1',
    title: '步骤一',
    schema: [{ key: 'name', label: '姓名', type: 'input' }],
    validate: async (values) => {
      if (!values.name) return '姓名必填'
      return true
    },
  },
  {
    key: 'step2',
    title: '步骤二',
  },
]

describe('RStepForm', () => {
  it('renders with required props', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {} },
    })
    expect(wrapper.find('[data-testid="step-form"]').exists()).toBe(true)
  })

  it('renders step indicators', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {} },
    })
    expect(wrapper.find('[data-testid="step-indicators"]').exists()).toBe(true)
  })

  it('renders step content area', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {} },
    })
    expect(wrapper.find('[data-testid="step-content"]').exists()).toBe(true)
  })

  it('renders action buttons', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {} },
    })
    expect(wrapper.find('[data-testid="step-actions"]').exists()).toBe(true)
  })

  it('shows next button on first step', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {}, currentStep: 0 },
    })
    expect(wrapper.find('[data-testid="step-next-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="step-prev-btn"]').exists()).toBe(false)
  })

  it('shows prev and next on middle step', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {}, currentStep: 1 },
    })
    expect(wrapper.find('[data-testid="step-prev-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="step-next-btn"]').exists()).toBe(true)
  })

  it('shows submit button on last step', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {}, currentStep: 2 },
    })
    expect(wrapper.find('[data-testid="step-submit-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="step-next-btn"]').exists()).toBe(false)
  })

  it('exposes next/prev/reset/submit/goTo methods', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {} },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    expect(typeof vm.next).toBe('function')
    expect(typeof vm.prev).toBe('function')
    expect(typeof vm.reset).toBe('function')
    expect(typeof vm.submit).toBe('function')
    expect(typeof vm.goTo).toBe('function')
    expect(typeof vm.getCurrentValues).toBe('function')
  })

  it('advances step on next()', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {} },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    const result = await vm.next()
    expect(result).toBe(true)
    expect(wrapper.emitted('update:currentStep')?.[0]).toEqual([1])
  })

  it('goes back on prev()', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {}, currentStep: 1 },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    vm.prev()
    expect(wrapper.emitted('update:currentStep')?.[0]).toEqual([0])
  })

  it('validates and blocks next on failure', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: validatedSteps, modelValue: {} },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    const result = await vm.next()
    expect(result).toBe(false)
    expect(wrapper.emitted('stepValidateError')).toBeTruthy()
  })

  it('validates and allows next on success', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: validatedSteps, modelValue: { name: 'John' } },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    const result = await vm.next()
    expect(result).toBe(true)
  })

  it('shows error message on validation failure', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: validatedSteps, modelValue: {} },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    await vm.next()
    await flushPromises()
    expect(wrapper.find('[data-testid="step-error"]').exists()).toBe(true)
  })

  it('emits finish on last step submit', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: { name: 'test' }, currentStep: 2 },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    await vm.submit()
    expect(wrapper.emitted('finish')).toBeTruthy()
  })

  it('shows finish state after submit', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: {}, currentStep: 2 },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    await vm.submit()
    await flushPromises()
    expect(wrapper.find('[data-testid="step-finish"]').exists()).toBe(true)
  })

  it('reset returns to initial state', async () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: { name: 'test' }, currentStep: 2 },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    await vm.submit()
    vm.reset()
    expect(wrapper.emitted('update:currentStep')?.at(-1)).toEqual([0])
  })

  it('getCurrentValues returns current model', () => {
    const wrapper = mount(RStepForm, {
      props: { steps: basicSteps, modelValue: { name: 'abc', role: 'admin' } },
    })
    const vm = wrapper.vm as unknown as StepFormExpose
    const vals = vm.getCurrentValues()
    expect(vals.name).toBe('abc')
    expect(vals.role).toBe('admin')
  })
})

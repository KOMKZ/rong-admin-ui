import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RCrudFormDialog } from '@/components/crud-form-dialog'
import type { FormFieldSchema } from '@/components/form-renderer'
import type { CrudMode } from '@/components/crud-form-dialog'

const schema: FormFieldSchema[] = [
  { key: 'name', label: '姓名', type: 'input' },
  { key: 'email', label: '邮箱', type: 'input' },
]

const baseModel = { name: '', email: '' }

function mountDialog(overrides: Record<string, unknown> = {}) {
  return mount(RCrudFormDialog, {
    props: {
      visible: true,
      mode: 'create' as CrudMode,
      schema,
      model: { ...baseModel },
      ...overrides,
    },
    attachTo: document.body,
  })
}

describe('RCrudFormDialog', () => {
  it('should render when visible', () => {
    const wrapper = mountDialog()
    expect(document.body.innerHTML).toContain('姓名')
    expect(document.body.innerHTML).toContain('邮箱')
    wrapper.unmount()
  })

  it('should show "新增" as default title for create mode', () => {
    const wrapper = mountDialog({ mode: 'create' })
    expect(document.body.innerHTML).toContain('新增')
    wrapper.unmount()
  })

  it('should show "编辑" as default title for edit mode', () => {
    const wrapper = mountDialog({ mode: 'edit' })
    expect(document.body.innerHTML).toContain('编辑')
    wrapper.unmount()
  })

  it('should show "查看" as default title for view mode', () => {
    const wrapper = mountDialog({ mode: 'view' })
    expect(document.body.innerHTML).toContain('查看')
    wrapper.unmount()
  })

  it('should use custom title when provided', () => {
    const wrapper = mountDialog({ title: '用户详情' })
    expect(document.body.innerHTML).toContain('用户详情')
    wrapper.unmount()
  })

  it('should disable form fields in view mode', () => {
    const wrapper = mountDialog({ mode: 'view' })
    const inputs = document.querySelectorAll('input')
    for (const input of inputs) {
      expect(input.disabled).toBe(true)
    }
    wrapper.unmount()
  })

  it('should show "创建" button text for create mode', () => {
    const wrapper = mountDialog({ mode: 'create' })
    expect(document.body.innerHTML).toContain('创建')
    wrapper.unmount()
  })

  it('should show "保存" button text for edit mode', () => {
    const wrapper = mountDialog({ mode: 'edit' })
    expect(document.body.innerHTML).toContain('保存')
    wrapper.unmount()
  })

  it('should show "关闭" button text for view mode', () => {
    const wrapper = mountDialog({ mode: 'view' })
    expect(document.body.innerHTML).toContain('关闭')
    wrapper.unmount()
  })

  it('should emit cancel and update:visible when cancel clicked', async () => {
    const wrapper = mountDialog()
    const buttons = document.querySelectorAll('button')
    const cancelBtn = Array.from(buttons).find((b) => b.textContent?.includes('取消'))
    cancelBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('should emit update:visible(false) when confirm in view mode', async () => {
    const wrapper = mountDialog({ mode: 'view' })
    const buttons = document.querySelectorAll('button')
    const confirmBtn = Array.from(buttons).find((b) => b.textContent?.includes('确认'))
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:visible')).toBeTruthy()
    wrapper.unmount()
  })

  it('should expose open method', () => {
    const wrapper = mountDialog({ visible: false })
    const vm = wrapper.vm as unknown as { open: (mode: CrudMode) => void }
    expect(typeof vm.open).toBe('function')
    wrapper.unmount()
  })

  it('should expose close method', () => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as unknown as { close: () => void }
    expect(typeof vm.close).toBe('function')
    vm.close()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('should expose validate method', () => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as unknown as { validate: () => Promise<boolean> }
    expect(typeof vm.validate).toBe('function')
    wrapper.unmount()
  })

  it('should expose getFormRef method', () => {
    const wrapper = mountDialog()
    const vm = wrapper.vm as unknown as { getFormRef: () => unknown }
    expect(typeof vm.getFormRef).toBe('function')
    wrapper.unmount()
  })

  it('should emit update:model when open is called with model', () => {
    const wrapper = mountDialog({ visible: false })
    const vm = wrapper.vm as unknown as {
      open: (mode: CrudMode, model?: Record<string, unknown>) => void
    }
    vm.open('edit', { name: 'Test', email: 'test@test.com' })
    const emitted = wrapper.emitted('update:model')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ name: 'Test', email: 'test@test.com' })
    wrapper.unmount()
  })

  it('should apply custom width', () => {
    const wrapper = mountDialog({ width: 800 })
    expect(document.body.innerHTML).toBeTruthy()
    wrapper.unmount()
  })

  it('should apply custom cols', () => {
    const wrapper = mountDialog({ cols: 2 })
    expect(document.body.innerHTML).toBeTruthy()
    wrapper.unmount()
  })
})

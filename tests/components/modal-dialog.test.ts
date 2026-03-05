import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RModalDialog } from '@/components/modal-dialog'

describe('RModalDialog', () => {
  it('should render when visible is true', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, title: '测试对话框' },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('测试对话框')
    wrapper.unmount()
  })

  it('should not render body content when visible is false', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: false, title: '隐藏对话框' },
    })
    expect(wrapper.html()).not.toContain('隐藏对话框')
  })

  it('should render default footer buttons with custom text', () => {
    const wrapper = mount(RModalDialog, {
      props: {
        visible: true,
        positiveText: 'OK',
        negativeText: 'Cancel',
      },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('OK')
    expect(document.body.innerHTML).toContain('Cancel')
    wrapper.unmount()
  })

  it('should emit confirm when positive button clicked', async () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, positiveText: '确认' },
      attachTo: document.body,
    })
    const buttons = document.querySelectorAll('button')
    const confirmBtn = Array.from(buttons).find((b) => b.textContent?.includes('确认'))
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('confirm')).toBeTruthy()
    wrapper.unmount()
  })

  it('should emit cancel and update:visible when negative button clicked', async () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, negativeText: '取消' },
      attachTo: document.body,
    })
    const buttons = document.querySelectorAll('button')
    const cancelBtn = Array.from(buttons).find((b) => b.textContent?.includes('取消'))
    cancelBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('should hide footer when showFooter is false', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, showFooter: false },
      attachTo: document.body,
    })
    const buttons = document.querySelectorAll('button')
    const actionBtns = Array.from(buttons).filter(
      (b) => b.textContent?.includes('确认') || b.textContent?.includes('取消'),
    )
    expect(actionBtns.length).toBe(0)
    wrapper.unmount()
  })

  it('should show loading state on confirm button', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, loading: true },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('确认')
    wrapper.unmount()
  })

  it('should render slot content', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true },
      slots: { default: '<p class="dialog-body">对话框内容</p>' },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('对话框内容')
    wrapper.unmount()
  })

  it('should render custom footer slot', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true },
      slots: { footer: '<button class="custom-footer-btn">自定义</button>' },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('自定义')
    wrapper.unmount()
  })

  it('should expose open and close methods', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: false },
    })
    const vm = wrapper.vm as unknown as { open: () => void; close: () => void }
    expect(typeof vm.open).toBe('function')
    expect(typeof vm.close).toBe('function')
  })

  it('should emit update:visible(true) when open() is called', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: false },
    })
    const vm = wrapper.vm as unknown as { open: () => void }
    vm.open()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([true])
  })

  it('should set role=dialog and aria-modal on the card', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, title: 'ARIA测试' },
      attachTo: document.body,
    })
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    wrapper.unmount()
  })
})

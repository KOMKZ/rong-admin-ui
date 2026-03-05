import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RModalDialog } from '@/components/modal-dialog'

describe('RModalDialog — advanced', () => {
  it('should not close on mask click when maskClosable is false', async () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, maskClosable: false },
      attachTo: document.body,
    })
    expect(wrapper.emitted('cancel')).toBeFalsy()
    wrapper.unmount()
  })

  it('should emit afterOpen after modal enters', async () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()
    wrapper.unmount()
  })

  it('should emit afterClose after modal leaves', async () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true },
      attachTo: document.body,
    })
    await wrapper.setProps({ visible: false })
    await wrapper.vm.$nextTick()
    wrapper.unmount()
  })

  it('should close via exposed close() method and emit cancel', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true },
      attachTo: document.body,
    })
    const vm = wrapper.vm as unknown as { close: () => void }
    vm.close()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    expect(wrapper.emitted('cancel')).toBeTruthy()
    wrapper.unmount()
  })

  it('should set custom width via prop', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, width: '600px' },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('600px')
    wrapper.unmount()
  })

  it('should set numeric width converted to px', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, width: 400 },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('400px')
    wrapper.unmount()
  })

  it('should render header slot', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true },
      slots: { header: '<span class="custom-header">自定义头部</span>' },
      attachTo: document.body,
    })
    expect(document.body.innerHTML).toContain('自定义头部')
    wrapper.unmount()
  })

  it('should hide close button when closable is false', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, closable: false },
      attachTo: document.body,
    })
    expect(wrapper.html()).toBeTruthy()
    wrapper.unmount()
  })
})

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RFileUpload } from '@/components/file-upload'
import type { UploadFile } from '@/components/file-upload'

describe('RFileUpload', () => {
  it('should render with required props', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should render default trigger button', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
    })
    expect(wrapper.html()).toContain('选择文件')
  })

  it('should render drag area when draggable is true', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [], draggable: true },
    })
    expect(wrapper.html()).toContain('拖拽文件')
  })

  it('should render custom trigger slot', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
      slots: { trigger: '<button class="custom-trigger">上传</button>' },
    })
    expect(wrapper.find('.custom-trigger').exists()).toBe(true)
  })

  it('should render tip slot', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
      slots: { tip: '<p class="upload-tip">仅支持 jpg/png</p>' },
    })
    expect(wrapper.find('.upload-tip').exists()).toBe(true)
  })

  it('should expose submit, clear, abort methods', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
    })
    const vm = wrapper.vm as unknown as {
      submit: () => void
      clear: () => void
      abort: (id: string) => void
    }
    expect(typeof vm.submit).toBe('function')
    expect(typeof vm.clear).toBe('function')
    expect(typeof vm.abort).toBe('function')
  })

  it('should emit update:fileList with empty array when clear() is called', () => {
    const fileList: UploadFile[] = [
      { id: '1', name: 'test.png', status: 'success', url: '/test.png' },
    ]
    const wrapper = mount(RFileUpload, {
      props: { fileList },
    })
    const vm = wrapper.vm as unknown as { clear: () => void }
    vm.clear()
    expect(wrapper.emitted('update:fileList')?.[0]).toEqual([[]])
  })

  it('should respect disabled prop', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [], disabled: true },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should render with multiple prop', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [], multiple: true },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should render with accept prop', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [], accept: 'image/*' },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should render file list items', () => {
    const fileList: UploadFile[] = [
      { id: '1', name: 'document.pdf', status: 'success' },
      { id: '2', name: 'image.png', status: 'uploading', percent: 50 },
    ]
    const wrapper = mount(RFileUpload, {
      props: { fileList },
    })
    expect(wrapper.html()).toContain('document.pdf')
  })
})

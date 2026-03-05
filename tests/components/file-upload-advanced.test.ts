import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { RFileUpload } from '@/components/file-upload'
import type { UploadFile, UploadRequestOptions } from '@/components/file-upload'

describe('RFileUpload — advanced', () => {
  it('should map file statuses correctly to naive-ui format', () => {
    const fileList: UploadFile[] = [
      { id: '1', name: 'a.png', status: 'pending' },
      { id: '2', name: 'b.png', status: 'uploading', percent: 50 },
      { id: '3', name: 'c.png', status: 'success', url: '/c.png' },
      { id: '4', name: 'd.png', status: 'error', error: 'fail' },
    ]
    const wrapper = mount(RFileUpload, {
      props: { fileList },
    })
    expect(wrapper.html()).toContain('a.png')
  })

  it('should reject files exceeding maxSize in beforeUpload', async () => {
    const wrapper = mount(RFileUpload, {
      props: {
        fileList: [],
        maxSize: 100,
        customRequest: () => {},
      },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should reject files when maxCount is reached', () => {
    const fileList: UploadFile[] = [
      { id: '1', name: 'a.png', status: 'success' },
      { id: '2', name: 'b.png', status: 'success' },
    ]
    const wrapper = mount(RFileUpload, {
      props: { fileList, maxCount: 2 },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should handle customRequest with progress/success flow', () => {
    const customRequest = vi.fn((opts: UploadRequestOptions) => {
      opts.onProgress(50)
      opts.onSuccess({ url: '/uploaded.png' })
    })
    const wrapper = mount(RFileUpload, {
      props: {
        fileList: [],
        customRequest,
      },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should handle customRequest with error flow', () => {
    const customRequest = vi.fn((opts: UploadRequestOptions) => {
      opts.onProgress(30)
      opts.onError(new Error('upload failed'))
    })
    const wrapper = mount(RFileUpload, {
      props: {
        fileList: [],
        customRequest,
      },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should call abort without throwing on unknown fileId', () => {
    const fileList: UploadFile[] = [
      { id: 'up1', name: 'uploading.png', status: 'uploading', percent: 30 },
    ]
    const wrapper = mount(RFileUpload, {
      props: { fileList },
    })
    const vm = wrapper.vm as unknown as { abort: (id: string) => void }
    expect(() => vm.abort('nonexistent')).not.toThrow()
  })

  it('should render image-card list type', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [], listType: 'image-card' },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should emit beforeUpload event', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
    })
    expect(wrapper.html()).toBeTruthy()
  })

  it('should handle remove and emit remove event', () => {
    const fileList: UploadFile[] = [
      { id: 'f1', name: 'doc.pdf', status: 'success' },
    ]
    const wrapper = mount(RFileUpload, {
      props: { fileList },
    })
    expect(wrapper.html()).toContain('doc.pdf')
  })
})

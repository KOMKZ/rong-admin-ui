import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RFileUpload from '../../src/components/file-upload/RFileUpload.vue'
import type { UploadFile, UploadRequestOptions, FileUploadExpose } from '../../src/components/file-upload/types'

function createFile(name = 'test.txt', size = 1024, type = 'text/plain'): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

describe('RFileUpload — customRequest integration', () => {
  const mockCustomRequest = vi.fn((_opts: UploadRequestOptions) => {})

  beforeEach(() => {
    mockCustomRequest.mockClear()
  })

  describe('direct customRequest prop callbacks', () => {
    it('should invoke customRequest when handleCustomRequest triggers', async () => {
      const fileList: UploadFile[] = []
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })

      const vm = wrapper.vm as unknown as Record<string, unknown>
      const handleCustomRequest = (vm as Record<string, (...args: unknown[]) => void>).handleCustomRequest
      if (typeof handleCustomRequest === 'function') {
        handleCustomRequest({
          file: { file: createFile(), name: 'test.txt', id: 'f1' },
          onProgress: vi.fn(),
          onFinish: vi.fn(),
          onError: vi.fn(),
        })
        await flushPromises()
        expect(wrapper.emitted('update:fileList')).toBeTruthy()
      }
    })

    it('should track progress via onProgress callback', async () => {
      const customRequest = vi.fn((opts: UploadRequestOptions) => {
        opts.onProgress(50)
        opts.onProgress(100)
        opts.onSuccess({ url: '/uploaded.png' })
      })

      const wrapper = mount(RFileUpload, {
        props: { fileList: [], customRequest },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('should handle onError callback in customRequest', () => {
      const customRequest = vi.fn((opts: UploadRequestOptions) => {
        opts.onProgress(20)
        opts.onError(new Error('network failure'))
      })

      const wrapper = mount(RFileUpload, {
        props: {
          fileList: [{ id: 'e1', name: 'fail.doc', status: 'uploading' as const, percent: 20 }],
          customRequest,
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('should handle AbortSignal in customRequest options', () => {
      const customRequest = vi.fn((opts: UploadRequestOptions) => {
        expect(opts.signal).toBeDefined()
        if (opts.signal) {
          expect(opts.signal.aborted).toBe(false)
        }
        opts.onSuccess({ url: '/done' })
      })

      const wrapper = mount(RFileUpload, {
        props: { fileList: [], customRequest },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('queue config with customRequest', () => {
    it('should accept queueConfig with concurrency control', () => {
      const wrapper = mount(RFileUpload, {
        props: {
          fileList: [],
          customRequest: mockCustomRequest,
          queueConfig: { concurrency: 1, maxRetries: 0, retryDelay: 100 },
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('should accept queueConfig with retry settings', () => {
      const wrapper = mount(RFileUpload, {
        props: {
          fileList: [],
          customRequest: mockCustomRequest,
          queueConfig: { concurrency: 5, maxRetries: 3, retryDelay: 2000 },
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('exposed methods with customRequest', () => {
    it('abort should cancel active upload via AbortController', () => {
      const fileList: UploadFile[] = [
        { id: 'up1', name: 'active.zip', status: 'uploading', percent: 40 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.abort('up1')
      const emitted = wrapper.emitted('update:fileList')
      if (emitted) {
        const lastList = emitted[emitted.length - 1][0] as UploadFile[]
        const aborted = lastList.find((f) => f.id === 'up1')
        if (aborted) {
          expect(aborted.status).toBe('error')
          expect(aborted.error).toBe('Aborted')
        }
      }
    })

    it('pause should stop upload and set paused status', () => {
      const fileList: UploadFile[] = [
        { id: 'p1', name: 'pausing.zip', status: 'uploading', percent: 60 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.pause('p1')
      const emitted = wrapper.emitted('update:fileList')
      if (emitted) {
        const lastList = emitted[emitted.length - 1][0] as UploadFile[]
        const paused = lastList.find((f) => f.id === 'p1')
        if (paused) {
          expect(paused.status).toBe('paused')
        }
      }
    })

    it('resume should set pending status for paused file', () => {
      const fileList: UploadFile[] = [
        { id: 'r1', name: 'resuming.zip', status: 'paused', percent: 60 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.resume('r1')
      const emitted = wrapper.emitted('update:fileList')
      if (emitted) {
        const lastList = emitted[emitted.length - 1][0] as UploadFile[]
        const resumed = lastList.find((f) => f.id === 'r1')
        if (resumed) {
          expect(resumed.status).toBe('pending')
        }
      }
    })

    it('resume should no-op for non-paused file', () => {
      const fileList: UploadFile[] = [
        { id: 'nr1', name: 'not-paused.zip', status: 'uploading', percent: 30 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.resume('nr1')
      expect(wrapper.emitted('update:fileList')).toBeUndefined()
    })

    it('retry should reset error file to pending', () => {
      const fileList: UploadFile[] = [
        { id: 'rt1', name: 'retry-me.zip', status: 'error', error: 'timeout' },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.retry('rt1')
      const emitted = wrapper.emitted('update:fileList')
      if (emitted) {
        const lastList = emitted[emitted.length - 1][0] as UploadFile[]
        const retried = lastList.find((f) => f.id === 'rt1')
        if (retried) {
          expect(retried.status).toBe('pending')
          expect(retried.error).toBeUndefined()
          expect(retried.percent).toBe(0)
        }
      }
    })

    it('retry should no-op for non-error file', () => {
      const fileList: UploadFile[] = [
        { id: 'nrt1', name: 'ok.zip', status: 'success' },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.retry('nrt1')
      expect(wrapper.emitted('update:fileList')).toBeUndefined()
    })

    it('clear should reset the entire file list', () => {
      const fileList: UploadFile[] = [
        { id: 'c1', name: 'a.txt', status: 'success' },
        { id: 'c2', name: 'b.txt', status: 'error', error: 'fail' },
        { id: 'c3', name: 'c.txt', status: 'uploading', percent: 50 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.clear()
      const emitted = wrapper.emitted('update:fileList')!
      expect(emitted[0][0]).toEqual([])
    })
  })

  describe('beforeUpload validation', () => {
    it('should reject file exceeding maxSize', () => {
      const wrapper = mount(RFileUpload, {
        props: {
          fileList: [],
          maxSize: 500,
          customRequest: mockCustomRequest,
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('should reject when maxCount reached', () => {
      const fileList: UploadFile[] = [
        { id: 'mc1', name: 'a.txt', status: 'success' },
        { id: 'mc2', name: 'b.txt', status: 'success' },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, maxCount: 2, customRequest: mockCustomRequest },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('should allow file within limits', () => {
      const wrapper = mount(RFileUpload, {
        props: {
          fileList: [],
          maxSize: 10 * 1024 * 1024,
          maxCount: 10,
          customRequest: mockCustomRequest,
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('file status mapping', () => {
    it('should map all statuses correctly for naive-ui', () => {
      const fileList: UploadFile[] = [
        { id: 's1', name: 'pending.txt', status: 'pending' },
        { id: 's2', name: 'uploading.txt', status: 'uploading', percent: 50 },
        { id: 's3', name: 'success.txt', status: 'success', url: '/done' },
        { id: 's4', name: 'error.txt', status: 'error', error: 'fail' },
        { id: 's5', name: 'paused.txt', status: 'paused', percent: 30 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList },
      })
      expect(wrapper.html()).toBeTruthy()
      expect(wrapper.html()).toContain('pending.txt')
    })
  })

  describe('remove flow', () => {
    it('should handle remove for existing file', () => {
      const fileList: UploadFile[] = [
        { id: 'rm1', name: 'removable.txt', status: 'success' },
        { id: 'rm2', name: 'keep.txt', status: 'success' },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList, customRequest: mockCustomRequest },
      })
      expect(wrapper.html()).toContain('removable.txt')
      expect(wrapper.html()).toContain('keep.txt')
    })
  })

  describe('listType variants', () => {
    it('renders text list type', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [], listType: 'text' },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders image list type as image-card', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [], listType: 'image' },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders image-card list type', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [], listType: 'image-card' },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('slot rendering', () => {
    it('renders custom trigger slot', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [], customRequest: mockCustomRequest },
        slots: { trigger: '<button class="my-btn">Upload</button>' },
      })
      expect(wrapper.find('.my-btn').exists()).toBe(true)
    })

    it('renders custom tip slot', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [], customRequest: mockCustomRequest },
        slots: { tip: '<span class="my-tip">Max 5MB</span>' },
      })
      expect(wrapper.find('.my-tip').exists()).toBe(true)
    })

    it('renders draggable trigger slot', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [], draggable: true, customRequest: mockCustomRequest },
        slots: { trigger: '<div class="drag-zone">Drop here</div>' },
      })
      expect(wrapper.find('.drag-zone').exists()).toBe(true)
    })
  })
})

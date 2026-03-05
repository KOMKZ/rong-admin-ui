import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RFileUpload from '../../src/components/file-upload/RFileUpload.vue'
import type { UploadFile, FileUploadExpose } from '../../src/components/file-upload/types'

describe('RFileUpload Pro Features', () => {
  const baseFiles: UploadFile[] = []

  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: baseFiles },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders in draggable mode', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: baseFiles, draggable: true },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders with disabled', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: baseFiles, disabled: true },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders file list with items', () => {
      const files: UploadFile[] = [
        { id: '1', name: 'test.txt', status: 'success', size: 1024 },
        { id: '2', name: 'img.png', status: 'uploading', percent: 50 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList: files },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders paused files', () => {
      const files: UploadFile[] = [
        { id: '1', name: 'big.zip', status: 'paused', percent: 30 },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList: files },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders error files', () => {
      const files: UploadFile[] = [
        { id: '1', name: 'fail.txt', status: 'error', error: 'Upload failed' },
      ]
      const wrapper = mount(RFileUpload, {
        props: { fileList: files },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('exposed methods', () => {
    it('exposes clear method', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'success' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      expect(typeof vm.clear).toBe('function')
      vm.clear()
      expect(wrapper.emitted('update:fileList')).toBeTruthy()
    })

    it('exposes submit method', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'pending' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      expect(typeof vm.submit).toBe('function')
      vm.submit()
    })

    it('exposes abort method', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'uploading' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      expect(typeof vm.abort).toBe('function')
      vm.abort('1')
    })

    it('exposes pause method', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'uploading' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      expect(typeof vm.pause).toBe('function')
      vm.pause('1')
    })

    it('exposes resume method', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'paused' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      expect(typeof vm.resume).toBe('function')
      vm.resume('1')
    })

    it('exposes retry method', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'error' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      expect(typeof vm.retry).toBe('function')
      vm.retry('1')
    })
  })

  describe('queue config', () => {
    it('accepts queueConfig prop', () => {
      const wrapper = mount(RFileUpload, {
        props: {
          fileList: baseFiles,
          queueConfig: { concurrency: 2, maxRetries: 3, retryDelay: 500 },
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('chunkedStrategy', () => {
    it('accepts chunkedStrategy prop', () => {
      const wrapper = mount(RFileUpload, {
        props: {
          fileList: baseFiles,
          chunkedStrategy: {
            chunkSize: 5 * 1024 * 1024,
            uploadChunk: vi.fn(),
            mergeChunks: vi.fn(),
          },
        },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('customRequest integration', () => {
    it('accepts customRequest prop', () => {
      const req = vi.fn()
      const wrapper = mount(RFileUpload, {
        props: { fileList: baseFiles, customRequest: req },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('maxCount and maxSize', () => {
    it('renders with maxCount', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: baseFiles, maxCount: 5 },
      })
      expect(wrapper.html()).toBeTruthy()
    })

    it('renders with maxSize', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: baseFiles, maxSize: 10 * 1024 * 1024 },
      })
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('events', () => {
    it('emits update:fileList on clear', () => {
      const wrapper = mount(RFileUpload, {
        props: { fileList: [{ id: '1', name: 'x.txt', status: 'success' as const }] },
      })
      const vm = wrapper.vm as unknown as FileUploadExpose
      vm.clear()
      expect(wrapper.emitted('update:fileList')).toBeTruthy()
      const emitted = wrapper.emitted('update:fileList')!
      expect(emitted[0][0]).toEqual([])
    })
  })
})

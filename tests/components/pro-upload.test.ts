import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RProUpload from '@/components/pro-upload/RProUpload.vue'
import type { ProUploadFileItem } from '@/components/pro-upload/types'

function createMockFile(name = 'photo.jpg', size = 1024, type = 'image/jpeg'): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

function createExistingItem(overrides: Partial<ProUploadFileItem> = {}): ProUploadFileItem {
  return {
    uid: 'existing-1',
    name: 'avatar.jpg',
    size: 5000,
    type: 'image/jpeg',
    status: 'success',
    progress: 100,
    url: '/api/admin/files/storage/local:avatar@abc123.jpg',
    storageId: 'local:avatar@abc123.jpg',
    fileId: 1,
    ...overrides,
  }
}

describe('RProUpload', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL
  let originalRevokeObjectURL: typeof URL.revokeObjectURL

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  describe('Rendering', () => {
    it('renders trigger in default state', () => {
      const wrapper = mount(RProUpload)
      expect(wrapper.find('[data-testid="pro-upload"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="pro-upload-trigger"]').exists()).toBe(true)
    })

    it('renders in disabled state', () => {
      const wrapper = mount(RProUpload, { props: { disabled: true } })
      expect(wrapper.find('.rpu--disabled').exists()).toBe(true)
    })

    it('renders in readonly state without trigger', () => {
      const wrapper = mount(RProUpload, {
        props: { readonly: true, value: [createExistingItem()] },
      })
      expect(wrapper.find('[data-testid="pro-upload-trigger"]').exists()).toBe(false)
    })

    it('hides trigger when maxCount reached', () => {
      const wrapper = mount(RProUpload, {
        props: { maxCount: 1, value: [createExistingItem()] },
      })
      expect(wrapper.find('[data-testid="pro-upload-trigger"]').exists()).toBe(false)
    })
  })

  describe('File validation', () => {
    it('emits exceed on file count limit', async () => {
      const wrapper = mount(RProUpload, {
        props: { maxCount: 2, multiple: true, value: [createExistingItem(), createExistingItem({ uid: 'existing-2', name: 'b.jpg' })] },
      })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(wrapper.emitted('exceed')?.[0]?.[0]).toMatchObject({
        type: 'count',
        limit: 2,
      })
    })

    it('emits exceed on file size limit', async () => {
      const wrapper = mount(RProUpload, {
        props: { maxSizeMB: 1 },
      })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const largeFile = createMockFile('big.jpg', 2 * 1024 * 1024)
      Object.defineProperty(input.element, 'files', { value: [largeFile], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(wrapper.emitted('exceed')?.[0]?.[0]).toMatchObject({
        type: 'size',
        limit: 1,
      })
    })

    it('emits exceed on invalid file type', async () => {
      const wrapper = mount(RProUpload, {
        props: { accept: '.jpg,.png' },
      })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const pdfFile = createMockFile('doc.pdf', 1024, 'application/pdf')
      Object.defineProperty(input.element, 'files', { value: [pdfFile], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(wrapper.emitted('exceed')?.[0]?.[0]).toMatchObject({
        type: 'accept',
      })
    })
  })

  describe('Controlled mode', () => {
    it('reflects external value changes', async () => {
      const items = [createExistingItem()]
      const wrapper = mount(RProUpload, { props: { value: items } })

      expect(wrapper.findAll('[role="listitem"]').length).toBe(1)

      await wrapper.setProps({
        value: [...items, createExistingItem({ uid: 'existing-2', name: 'photo2.jpg' })],
      })
      expect(wrapper.findAll('[role="listitem"]').length).toBe(2)
    })

    it('emits update:value on file add', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: { value: [], customRequest },
      })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      const emitted = wrapper.emitted('update:value')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toHaveLength(1)
    })
  })

  describe('Upload flow', () => {
    it('calls customRequest with correct options', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: {
          customRequest,
          storage: 'avatar',
          businessId: '123',
          businessType: 'user',
        },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(customRequest).toHaveBeenCalledTimes(1)
      const callArgs = customRequest.mock.calls[0][0]
      expect(callArgs.file).toBeInstanceOf(File)
      expect(callArgs.formData).toBeInstanceOf(FormData)
      expect(callArgs.formData.get('type')).toBe('avatar')
      expect(callArgs.formData.get('business_id')).toBe('123')
      expect(callArgs.formData.get('business_type')).toBe('user')
      expect(typeof callArgs.onProgress).toBe('function')
      expect(typeof callArgs.onSuccess).toBe('function')
      expect(typeof callArgs.onError).toBe('function')
    })

    it('parses response and emits success', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, {
        props: { customRequest, storage: 'avatar' },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onSuccess({
        code: 0,
        data: {
          id: 42,
          storage_id: 'local:avatar@abc.jpg',
          url: '/api/admin/files/storage/local:avatar@abc.jpg',
          original_name: 'photo.jpg',
          size: 1024,
          content_type: 'image/jpeg',
        },
      })
      await flushPromises()

      const successEvents = wrapper.emitted('success')
      expect(successEvents).toBeTruthy()
      expect(successEvents![0][0]).toMatchObject({
        status: 'success',
        storageId: 'local:avatar@abc.jpg',
        fileId: 42,
        progress: 100,
      })
    })

    it('handles upload error and retries', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, {
        props: {
          customRequest,
          retryConfig: { maxRetries: 0, retryDelay: 0 },
        },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onError(new Error('Server error'))
      await flushPromises()

      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeTruthy()
      expect(errorEvents![0][0]).toMatchObject({ status: 'error' })
    })
  })

  describe('beforeUpload', () => {
    it('prevents upload when returning false', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: {
          customRequest,
          beforeUpload: () => false,
        },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(customRequest).not.toHaveBeenCalled()
    })

    it('supports async beforeUpload', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: {
          customRequest,
          beforeUpload: async () => {
            return true
          },
        },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()
      await flushPromises()

      expect(customRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('Remove file', () => {
    it('emits remove and updates list', async () => {
      const existing = createExistingItem()
      const wrapper = mount(RProUpload, {
        props: { value: [existing] },
      })

      const removeBtn = wrapper.find('.rpu-item__action--remove')
      await removeBtn.trigger('click')
      await flushPromises()

      expect(wrapper.emitted('remove')?.[0]?.[0]).toMatchObject({ uid: 'existing-1' })
      const updatedList = wrapper.emitted('update:value')
      expect(updatedList![updatedList!.length - 1][0]).toHaveLength(0)
    })
  })

  describe('Single file replacement (avatar)', () => {
    it('replaces file when multiple=false and maxCount=1', async () => {
      const customRequest = vi.fn()
      const existing = createExistingItem()
      const wrapper = mount(RProUpload, {
        props: {
          value: [existing],
          multiple: false,
          maxCount: 1,
          customRequest,
        },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const newFile = createMockFile('new-avatar.png', 2048, 'image/png')
      Object.defineProperty(input.element, 'files', { value: [newFile], writable: true })
      await input.trigger('change')
      await flushPromises()

      const updatedList = wrapper.emitted('update:value')
      const lastUpdate = updatedList![updatedList!.length - 1][0] as ProUploadFileItem[]
      expect(lastUpdate).toHaveLength(1)
      expect(lastUpdate[0].name).toBe('new-avatar.png')
    })
  })

  describe('Expose API', () => {
    it('exposes getFileList', () => {
      const wrapper = mount(RProUpload, {
        props: { value: [createExistingItem()] },
      })
      const exposed = wrapper.vm as unknown as { getFileList: () => ProUploadFileItem[] }
      expect(exposed.getFileList()).toHaveLength(1)
    })

    it('exposes clear', async () => {
      const wrapper = mount(RProUpload, {
        props: { value: [createExistingItem()] },
      })
      const exposed = wrapper.vm as unknown as { clear: () => void }
      exposed.clear()
      await flushPromises()

      const updatedList = wrapper.emitted('update:value')
      expect(updatedList![updatedList!.length - 1][0]).toHaveLength(0)
    })
  })

  describe('Preview', () => {
    it('emits preview event on thumbnail click', async () => {
      const existing = createExistingItem()
      const wrapper = mount(RProUpload, {
        props: { value: [existing] },
      })

      const thumb = wrapper.find('.rpu-item__thumb')
      await thumb.trigger('click')

      expect(wrapper.emitted('preview')?.[0]?.[0]).toMatchObject({ uid: 'existing-1' })
    })
  })

  describe('Abort', () => {
    it('aborts an in-progress upload', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, { props: { customRequest } })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      const list = wrapper.emitted('update:value')!
      const item = (list[list.length - 1][0] as ProUploadFileItem[])[0]

      const exposed = wrapper.vm as unknown as { abort: (uid: string) => void }
      exposed.abort(item.uid)

      expect(capturedOptions.signal.aborted).toBe(true)
    })
  })

  describe('Submit pending files', () => {
    it('submits pending files to queue', async () => {
      const customRequest = vi.fn()
      const pendingItem: ProUploadFileItem = {
        uid: 'p1',
        name: 'doc.jpg',
        size: 500,
        type: 'image/jpeg',
        status: 'pending',
        progress: 0,
        raw: createMockFile('doc.jpg', 500),
      }

      const wrapper = mount(RProUpload, {
        props: { value: [pendingItem], customRequest },
      })

      const exposed = wrapper.vm as unknown as { submit: () => void }
      exposed.submit()
      await flushPromises()

      expect(customRequest).toHaveBeenCalledTimes(1)
    })

    it('does nothing when no pending files', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: { value: [createExistingItem()], customRequest },
      })

      const exposed = wrapper.vm as unknown as { submit: () => void }
      exposed.submit()
      await flushPromises()

      expect(customRequest).not.toHaveBeenCalled()
    })
  })

  describe('Retry flow', () => {
    it('retries failed file and re-queues', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, {
        props: { customRequest, retryConfig: { maxRetries: 0, retryDelay: 0 } },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onError(new Error('fail'))
      await flushPromises()

      const list = wrapper.emitted('update:value')!
      const errorItem = (list[list.length - 1][0] as ProUploadFileItem[])[0]
      expect(errorItem.status).toBe('error')

      const exposed = wrapper.vm as unknown as { retry: (uid: string) => void }
      exposed.retry(errorItem.uid)
      await flushPromises()

      expect(customRequest).toHaveBeenCalledTimes(2)
    })

    it('ignores retry for non-error file', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: { value: [createExistingItem()], customRequest },
      })

      const exposed = wrapper.vm as unknown as { retry: (uid: string) => void }
      exposed.retry('existing-1')
      await flushPromises()

      expect(customRequest).not.toHaveBeenCalled()
    })
  })

  describe('Progress callback', () => {
    it('updates progress on onProgress call', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, { props: { customRequest } })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onProgress(50)
      await flushPromises()

      const list = wrapper.emitted('update:value')!
      const item = (list[list.length - 1][0] as ProUploadFileItem[])[0]
      expect(item.progress).toBe(50)
    })
  })

  describe('MIME wildcard accept', () => {
    it('accepts image/* wildcard', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: { accept: 'image/*', customRequest },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile('photo.webp', 1024, 'image/webp')
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(customRequest).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('exceed')).toBeUndefined()
    })
  })

  describe('Non-image file', () => {
    it('does not generate thumbUrl for non-image file', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: { customRequest, listType: 'text' },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile('doc.pdf', 1024, 'application/pdf')
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      const list = wrapper.emitted('update:value')!
      const item = (list[list.length - 1][0] as ProUploadFileItem[])[0]
      expect(item.thumbUrl).toBeUndefined()
    })
  })

  describe('Custom buildUploadPayload', () => {
    it('uses custom payload builder', async () => {
      const customRequest = vi.fn()
      const buildUploadPayload = vi.fn((file: File) => {
        const fd = new FormData()
        fd.append('custom_file', file)
        fd.append('custom_field', 'test')
        return fd
      })

      const wrapper = mount(RProUpload, {
        props: { customRequest, buildUploadPayload },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(buildUploadPayload).toHaveBeenCalledTimes(1)
      const callArgs = customRequest.mock.calls[0][0]
      expect(callArgs.formData.get('custom_field')).toBe('test')
    })
  })

  describe('Custom parseResponse', () => {
    it('uses custom response parser', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })
      const parseResponse = vi.fn(() => ({
        storageId: 'custom-sid',
        fileId: 99,
        url: 'https://custom.url/file.jpg',
      }))

      const wrapper = mount(RProUpload, {
        props: { customRequest, parseResponse },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onSuccess({ raw: 'data' })
      await flushPromises()

      expect(parseResponse).toHaveBeenCalledWith({ raw: 'data' })
      const successEvents = wrapper.emitted('success')!
      expect(successEvents[0][0]).toMatchObject({ storageId: 'custom-sid', fileId: 99 })
    })
  })

  describe('beforeUpload error handling', () => {
    it('skips file when beforeUpload throws', async () => {
      const customRequest = vi.fn()
      const wrapper = mount(RProUpload, {
        props: {
          customRequest,
          beforeUpload: () => { throw new Error('validation error') },
        },
      })

      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      expect(customRequest).not.toHaveBeenCalled()
    })
  })

  describe('parseResponse edge cases', () => {
    it('handles null response gracefully', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, { props: { customRequest } })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onSuccess(null)
      await flushPromises()

      const successEvents = wrapper.emitted('success')!
      expect(successEvents[0][0]).toMatchObject({ status: 'success', progress: 100 })
    })

    it('handles flat response without data wrapper', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, { props: { customRequest } })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      capturedOptions.onSuccess({ storage_id: 'flat-sid', url: '/flat' })
      await flushPromises()

      const successEvents = wrapper.emitted('success')!
      expect(successEvents[0][0]).toMatchObject({ storageId: 'flat-sid', url: '/flat' })
    })
  })

  describe('Remove uploading file', () => {
    it('aborts upload when removing an uploading file', async () => {
      let capturedOptions: any
      const customRequest = vi.fn((opts: any) => {
        capturedOptions = opts
      })

      const wrapper = mount(RProUpload, { props: { customRequest } })
      const input = wrapper.find('[data-testid="pro-upload-input"]')
      const file = createMockFile()
      Object.defineProperty(input.element, 'files', { value: [file], writable: true })
      await input.trigger('change')
      await flushPromises()

      const removeBtn = wrapper.find('.rpu-item__action--remove')
      await removeBtn.trigger('click')
      await flushPromises()

      expect(capturedOptions.signal.aborted).toBe(true)
      expect(wrapper.emitted('remove')).toBeTruthy()
    })
  })

  describe('Text list type', () => {
    it('renders drop zone with text list type', () => {
      const wrapper = mount(RProUpload, {
        props: { listType: 'text', draggable: true },
      })
      expect(wrapper.find('.rpu__drop-zone').exists()).toBe(true)
    })

    it('renders button trigger when not draggable', () => {
      const wrapper = mount(RProUpload, {
        props: { listType: 'text', draggable: false },
      })
      expect(wrapper.find('.rpu__btn-trigger').exists()).toBe(true)
    })
  })
})

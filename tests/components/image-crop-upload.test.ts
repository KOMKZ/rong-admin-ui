import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RImageCropUpload from '@/components/image-crop-upload/RImageCropUpload.vue'
import RImageCropperDialog from '@/components/image-crop-upload/RImageCropperDialog.vue'
import type { ImageCropResult } from '@/components/image-crop-upload'

function createMockFile(name = 'photo.jpg', size = 1024, type = 'image/jpeg'): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

const CropperDialogStub = defineComponent({
  name: 'RImageCropperDialog',
  props: {
    visible: { type: Boolean, required: true },
    file: { type: File, required: false },
  },
  emits: ['confirm', 'cancel', 'error', 'update:visible'],
  setup(props, { emit }) {
    function confirm(): void {
      const sourceFile = props.file ?? createMockFile()
      const canvas = document.createElement('canvas')
      const file = createMockFile('cropped.jpg', 512, 'image/jpeg')
      emit('confirm', { file, sourceFile, canvas } satisfies ImageCropResult)
    }

    function cancel(): void {
      emit('cancel')
    }

    return { confirm, cancel }
  },
  template: `
    <div v-if="visible" data-testid="crop-dialog-stub">
      <button data-testid="crop-confirm-stub" @click="confirm">confirm</button>
      <button data-testid="crop-cancel-stub" @click="cancel">cancel</button>
    </div>
  `,
})

const cropperImageMock = {
  $ready: vi.fn(() => Promise.resolve(document.createElement('img'))),
  $resetTransform: vi.fn(() => cropperImageMock),
  $center: vi.fn(() => cropperImageMock),
  $move: vi.fn(() => cropperImageMock),
  $zoom: vi.fn(() => cropperImageMock),
  $rotate: vi.fn(() => cropperImageMock),
}

const cropperSelectionMock = {
  $change: vi.fn(() => cropperSelectionMock),
  $toCanvas: vi.fn(),
}

const cropperConstructorMock = vi.fn().mockImplementation(() => ({
  destroy: vi.fn(),
  getCropperImage: () => cropperImageMock,
  getCropperSelection: () => cropperSelectionMock,
}))

vi.mock('cropperjs', () => ({
  default: cropperConstructorMock,
}))

describe('RImageCropUpload', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL
  let originalRevokeObjectURL: typeof URL.revokeObjectURL

  beforeEach(() => {
    vi.clearAllMocks()
    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('renders upload shell', () => {
    const wrapper = mount(RImageCropUpload, {
      global: { stubs: { RImageCropperDialog: CropperDialogStub } },
    })

    expect(wrapper.find('[data-testid="image-crop-upload"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pro-upload"]').exists()).toBe(true)
  })

  it('opens crop dialog and uploads cropped file after confirm', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RImageCropUpload, {
      props: {
        customRequest,
        storage: 'avatar',
        maxCount: 1,
        accept: 'image/*',
      },
      global: { stubs: { RImageCropperDialog: CropperDialogStub } },
    })

    const input = wrapper.find('[data-testid="pro-upload-input"]')
    const file = createMockFile('source.png', 1024, 'image/png')
    Object.defineProperty(input.element, 'files', { value: [file], writable: true })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.find('[data-testid="crop-dialog-stub"]').exists()).toBe(true)
    await wrapper.find('[data-testid="crop-confirm-stub"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('crop-success')).toBeTruthy()
    expect(customRequest).toHaveBeenCalledTimes(1)
    const callArgs = customRequest.mock.calls[0][0]
    expect(callArgs.file.name).toBe('cropped.jpg')
    expect(callArgs.formData.get('storage')).toBe('avatar')
  })

  it('skips upload when crop is cancelled', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RImageCropUpload, {
      props: {
        customRequest,
        accept: 'image/*',
      },
      global: { stubs: { RImageCropperDialog: CropperDialogStub } },
    })

    const input = wrapper.find('[data-testid="pro-upload-input"]')
    const file = createMockFile('source.jpg', 1024, 'image/jpeg')
    Object.defineProperty(input.element, 'files', { value: [file], writable: true })
    await input.trigger('change')
    await flushPromises()

    await wrapper.find('[data-testid="crop-cancel-stub"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('crop-cancel')?.[0]?.[0]).toMatchObject({
      name: file.name,
      type: file.type,
    })
    expect(customRequest).not.toHaveBeenCalled()
  })

  it('bypasses crop dialog for non-image files', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RImageCropUpload, {
      props: {
        customRequest,
        accept: '.pdf',
      },
      global: { stubs: { RImageCropperDialog: CropperDialogStub } },
    })

    const input = wrapper.find('[data-testid="pro-upload-input"]')
    const file = createMockFile('doc.pdf', 1024, 'application/pdf')
    Object.defineProperty(input.element, 'files', { value: [file], writable: true })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.find('[data-testid="crop-dialog-stub"]').exists()).toBe(false)
    expect(customRequest).toHaveBeenCalledTimes(1)
    expect(customRequest.mock.calls[0][0].file).toMatchObject({
      name: file.name,
      type: file.type,
    })
  })

  it('keeps crop area transparent and centers configured fixed selection', async () => {
    const source = createMockFile('portrait.png', 1024, 'image/png')
    const wrapper = mount(RImageCropperDialog, {
      props: {
        visible: true,
        file: source,
        options: { aspectRatio: 1, cropBoxWidth: 360, cropBoxHeight: 360 },
      },
      global: {
        stubs: {
          Teleport: true,
          NModal: { template: '<div><slot /></div>' },
          NCard: { template: '<section><slot /><slot name="footer" /></section>' },
          NSpin: { template: '<div><slot /></div>' },
          NButton: { template: '<button @click="$emit(`click`, $event)"><slot /></button>' },
          NButtonGroup: { template: '<div><slot /></div>' },
          NSpace: { template: '<div><slot /></div>' },
          RIcon: true,
        },
      },
    })

    const stage = wrapper.get('[data-testid="image-cropper-stage"]').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 640 })
    Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 480 })
    stage.getBoundingClientRect = vi.fn(() => ({
      width: 640,
      height: 480,
      x: 0,
      y: 0,
      top: 0,
      right: 640,
      bottom: 480,
      left: 0,
      toJSON: () => ({}),
    }))

    const image = wrapper.get('img').element as HTMLImageElement
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 320 })
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 960 })
    await image.dispatchEvent(new Event('load'))
    await flushPromises()

    const template = cropperConstructorMock.mock.calls[0][1].template as string
    expect(template).not.toContain('covered')
    expect(template).toContain('<cropper-shade>')
    expect(template).toContain('<cropper-handle action="move" plain>')
    expect(template).not.toContain('movable')
    expect(template).not.toContain('resizable')
    expect(cropperImageMock.$center).toHaveBeenCalledWith('cover')
    expect(cropperSelectionMock.$change).toHaveBeenCalledWith(140, 60, 360, 360, 1, true)
  })

  it('moves the source image with fine tune controls', async () => {
    const source = createMockFile('avatar.png', 1024, 'image/png')
    const wrapper = mount(RImageCropperDialog, {
      props: {
        visible: true,
        file: source,
        options: { aspectRatio: 1 },
      },
      global: {
        stubs: {
          Teleport: true,
          NModal: { template: '<div><slot /></div>' },
          NCard: { template: '<section><slot /><slot name="footer" /></section>' },
          NSpin: { template: '<div><slot /></div>' },
          NButton: { template: '<button @click="$emit(`click`, $event)"><slot /></button>' },
          NButtonGroup: { template: '<div><slot /></div>' },
          NSpace: { template: '<div><slot /></div>' },
          RIcon: true,
        },
      },
    })

    const image = wrapper.get('img').element as HTMLImageElement
    await image.dispatchEvent(new Event('load'))
    await flushPromises()

    await wrapper.get('[data-testid="image-cropper-move-left"]').trigger('click')
    await wrapper.get('[data-testid="image-cropper-move-up"]').trigger('click')
    await wrapper.get('[data-testid="image-cropper-move-down"]').trigger('click')
    await wrapper.get('[data-testid="image-cropper-move-right"]').trigger('click')

    expect(cropperImageMock.$move).toHaveBeenNthCalledWith(1, -12, 0)
    expect(cropperImageMock.$move).toHaveBeenNthCalledWith(2, 0, -12)
    expect(cropperImageMock.$move).toHaveBeenNthCalledWith(3, 0, 12)
    expect(cropperImageMock.$move).toHaveBeenNthCalledWith(4, 12, 0)
  })
})

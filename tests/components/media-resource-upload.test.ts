import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import RMediaResourceUpload from '@/components/media-resource-upload/RMediaResourceUpload.vue'
import {
  mediaResourceToUploadFile,
  uploadFileToMediaResource,
} from '@/components/media-resource-upload/mediaResourceAdapter'
import type { MediaResource } from '@/components/media-resource-upload/types'
import { cropperDialogStub, createImageCropSourceFile } from '../helpers/crop-dialog-stub'

const cover: MediaResource = {
  storageId: 'local:sys_pub@cover.jpg',
  url: '/api/files/storage/local:sys_pub@cover.jpg',
  mediaClass: 'image',
  contentType: 'image/jpeg',
  filename: 'cover.jpg',
  size: 1024,
  width: 1200,
  height: 630,
}

const modalDialogStub = defineComponent({
  name: 'RModalDialog',
  props: { visible: Boolean },
  emits: ['update:visible'],
  setup(props, { slots }) {
    return () => (props.visible ? h('section', slots.default?.()) : null)
  },
})

const stubCustomRequest = vi.fn()

async function selectImageFile(
  wrapper: ReturnType<typeof mount>,
  file: File,
): Promise<void> {
  const input = wrapper.find('[data-testid="pro-upload-input"]')
  Object.defineProperty(input.element, 'files', { value: [file], writable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('RMediaResourceUpload', () => {
  it('hydrates an existing resource with its preview URL', () => {
    const wrapper = mount(RMediaResourceUpload, {
      props: { modelValue: cover, mediaClass: 'image', customRequest: stubCustomRequest },
    })
    const image = wrapper.find('img')
    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe(cover.url)
  })

  it('maps a complete upload result to the resource contract', () => {
    const file = mediaResourceToUploadFile(cover)
    expect(uploadFileToMediaResource(file, 'image')).toEqual(cover)
  })

  it('rejects successful upload responses without a URL', () => {
    expect(() =>
      uploadFileToMediaResource(
        {
          uid: '1',
          name: 'cover.jpg',
          size: 1,
          type: 'image/jpeg',
          status: 'success',
          progress: 100,
          storageId: 'local:sys_pub@cover.jpg',
        },
        'image',
      ),
    ).toThrow('storage_id and url')
  })

  it('rejects successful upload responses without a storage ID', () => {
    expect(() =>
      uploadFileToMediaResource(
        {
          uid: '1',
          name: 'cover.jpg',
          size: 1,
          type: 'image/jpeg',
          status: 'success',
          progress: 100,
          url: '/api/files/storage/local:sys_pub@cover.jpg',
        },
        'image',
      ),
    ).toThrow('storage_id and url')
  })

  it('clears the resource when the upload item is removed', async () => {
    const wrapper = mount(RMediaResourceUpload, {
      props: { modelValue: cover, mediaClass: 'image', customRequest: stubCustomRequest },
    })

    wrapper.findComponent({ name: 'RProUpload' }).vm.$emit('remove')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
    expect(wrapper.emitted('remove')).toEqual([[cover]])
  })

  it('opens the uploaded video in a playable preview', async () => {
    const video: MediaResource = {
      storageId: 'local:sys_pub@preview.mp4',
      url: '/api/files/storage/local:sys_pub@preview.mp4',
      mediaClass: 'video',
      contentType: 'video/mp4',
      filename: 'preview.mp4',
      size: 2 * 1024 * 1024,
      durationMs: 12_000,
    }
    const wrapper = mount(RMediaResourceUpload, {
      props: { modelValue: video, mediaClass: 'video', customRequest: stubCustomRequest },
      global: { stubs: { RModalDialog: modalDialogStub } },
    })

    await wrapper.find('.rpu-item__thumb').trigger('click')

    const player = wrapper.find<HTMLVideoElement>('[data-testid="pro-upload-preview-video"]')
    expect(player.attributes('src')).toBe(video.url)
    expect(player.attributes()).toHaveProperty('controls')
  })

  it('preserves a generated private thumbnail in the resource contract', () => {
    const thumbnail: MediaResource = {
      storageId: 'local:sys_pri@preview.thumbnail.jpg',
      url: '/api/files/storage/local:sys_pri@preview.thumbnail.jpg',
      mediaClass: 'image',
      contentType: 'image/jpeg',
      filename: 'preview.thumbnail.jpg',
      size: 512,
    }
    const video = uploadFileToMediaResource(
      {
        uid: '1',
        name: 'preview.mp4',
        size: 2,
        type: 'video/mp4',
        status: 'success',
        progress: 100,
        responseData: {
          data: {
            storage_id: 'local:sys_pri@preview.mp4',
            url: '/api/files/storage/local:sys_pri@preview.mp4',
            filename: 'preview.mp4',
            size: 2,
            content_type: 'video/mp4',
            thumbnail: {
              storage_id: thumbnail.storageId,
              url: thumbnail.url,
              filename: thumbnail.filename,
              size: thumbnail.size,
              content_type: thumbnail.contentType,
            },
          },
        },
      },
      'video',
    )
    expect(video.thumbnail).toMatchObject(thumbnail)
  })
})

describe('RMediaResourceUpload crop', () => {
  const squareCropOptions = {
    aspectRatio: 1,
    cropBoxWidth: 360,
    cropBoxHeight: 360,
    outputWidth: 128,
    outputHeight: 128,
    outputQuality: 0.9,
  }

  it('opens the crop dialog before uploading when cropOptions is set', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RMediaResourceUpload, {
      props: {
        modelValue: null,
        mediaClass: 'image',
        customRequest,
        cropOptions: squareCropOptions,
      },
      global: { stubs: { RImageCropperDialog: cropperDialogStub } },
    })

    await selectImageFile(wrapper, createImageCropSourceFile('cover-raw.png', 'image/png'))

    expect(wrapper.find('[data-testid="crop-dialog-stub"]').exists()).toBe(true)
    expect(customRequest).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'RImageCropperDialog' }).props('options')).toMatchObject(
      squareCropOptions,
    )

    await wrapper.find('[data-testid="crop-confirm-stub"]').trigger('click')
    await flushPromises()

    expect(customRequest).toHaveBeenCalledTimes(1)
    expect(customRequest.mock.calls[0][0].file.name).toBe('cover-cropped.jpg')
  })

  it('maps the cropped upload result to the media resource contract', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RMediaResourceUpload, {
      props: {
        modelValue: null,
        mediaClass: 'image',
        customRequest,
        cropOptions: squareCropOptions,
      },
      global: { stubs: { RImageCropperDialog: cropperDialogStub } },
    })

    await selectImageFile(wrapper, createImageCropSourceFile('cover-raw.png', 'image/png'))
    await wrapper.find('[data-testid="crop-confirm-stub"]').trigger('click')
    await flushPromises()

    wrapper.findComponent({ name: 'RProUpload' }).vm.$emit('success', {
      uid: 'cropped-1',
      name: 'cover-cropped.jpg',
      size: 512,
      type: 'image/jpeg',
      status: 'success',
      progress: 100,
      storageId: 'local:sys_pub@cover-cropped.jpg',
      url: '/api/files/storage/local:sys_pub@cover-cropped.jpg',
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [
        expect.objectContaining({
          storageId: 'local:sys_pub@cover-cropped.jpg',
          url: '/api/files/storage/local:sys_pub@cover-cropped.jpg',
          mediaClass: 'image',
          filename: 'cover-cropped.jpg',
        }),
      ],
    ])
  })

  it('skips upload when the crop is cancelled', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RMediaResourceUpload, {
      props: {
        modelValue: null,
        mediaClass: 'image',
        customRequest,
        cropOptions: squareCropOptions,
      },
      global: { stubs: { RImageCropperDialog: cropperDialogStub } },
    })

    await selectImageFile(wrapper, createImageCropSourceFile('cover-raw.jpg'))
    await wrapper.find('[data-testid="crop-cancel-stub"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="crop-dialog-stub"]').exists()).toBe(false)
    expect(customRequest).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('uploads images directly when cropOptions is absent', async () => {
    const customRequest = vi.fn()
    const wrapper = mount(RMediaResourceUpload, {
      props: { modelValue: null, mediaClass: 'image', customRequest },
      global: { stubs: { RImageCropperDialog: cropperDialogStub } },
    })

    await selectImageFile(wrapper, createImageCropSourceFile('cover-raw.jpg'))

    expect(wrapper.find('[data-testid="crop-dialog-stub"]').exists()).toBe(false)
    expect(customRequest).toHaveBeenCalledTimes(1)
    expect(customRequest.mock.calls[0][0].file.name).toBe('cover-raw.jpg')
  })
})

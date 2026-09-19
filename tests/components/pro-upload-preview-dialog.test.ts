import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RProUploadPreviewDialog from '@/components/pro-upload/RProUploadPreviewDialog.vue'
import type { ProUploadFileItem } from '@/components/pro-upload/types'

const modalDialogStub = defineComponent({
  name: 'RModalDialog',
  props: { visible: Boolean },
  emits: ['update:visible'],
  setup(props, { slots }) {
    return () => (props.visible ? h('section', slots.default?.()) : null)
  },
})

const videoFile: ProUploadFileItem = {
  uid: 'video-1',
  name: 'preview.mp4',
  size: 2 * 1024 * 1024,
  type: 'video/mp4',
  status: 'success',
  progress: 100,
  url: 'https://cdn.example.com/preview.mp4',
  mediaInfo: { media_class: 'video', content_type: 'video/mp4' },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RProUploadPreviewDialog', () => {
  it('stops and rewinds video when the dialog closes', async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const wrapper = mount(RProUploadPreviewDialog, {
      props: { visible: true, file: videoFile },
      global: { stubs: { RModalDialog: modalDialogStub } },
    })
    const video = wrapper.find<HTMLVideoElement>('[data-testid="pro-upload-preview-video"]')
    video.element.currentTime = 8

    await wrapper.setProps({ visible: false })

    expect(pause).toHaveBeenCalled()
    expect(video.element.currentTime).toBe(0)
  })
})

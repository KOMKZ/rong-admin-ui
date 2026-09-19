import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RProUpload from '@/components/pro-upload/RProUpload.vue'
import type { ProUploadFileItem } from '@/components/pro-upload/types'

function createVideoItem(): ProUploadFileItem {
  return {
    uid: 'existing-video-1',
    name: 'preview.mp4',
    size: 2_100_000,
    type: 'video/mp4',
    status: 'success',
    progress: 100,
    url: 'https://cdn.example.com/preview.mp4',
    mediaInfo: { media_class: 'video', content_type: 'video/mp4' },
  }
}

describe('RProUpload video preview', () => {
  it('opens a playable video preview from a picture thumbnail with the keyboard', async () => {
    const existing = createVideoItem()
    const wrapper = mount(RProUpload, {
      attachTo: document.body,
      props: { value: [existing] },
    })

    const thumbnail = wrapper.find('.rpu-item__thumb')
    expect(thumbnail.attributes('role')).toBe('button')
    expect(thumbnail.attributes('tabindex')).toBe('0')
    expect(thumbnail.find('video').attributes('src')).toBe(existing.url)
    expect(thumbnail.find('.rpu-item__play').exists()).toBe(true)

    await thumbnail.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const preview = document.body.querySelector<HTMLVideoElement>(
      '[data-testid="pro-upload-preview-video"]',
    )
    expect(preview?.getAttribute('src')).toBe(existing.url)
    expect(preview?.hasAttribute('controls')).toBe(true)
    expect(wrapper.emitted('preview')?.[0]?.[0]).toMatchObject({ uid: 'existing-video-1' })

    wrapper.unmount()
  })

  it('opens the real preview dialog from the text-list filename', async () => {
    const existing = createVideoItem()
    const wrapper = mount(RProUpload, {
      attachTo: document.body,
      props: { value: [existing], listType: 'text' },
    })

    const trigger = wrapper.find('button.rpu-item__name--preview')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toBe(`预览 ${existing.name}`)

    await trigger.trigger('click')
    await flushPromises()

    const player = document.body.querySelector<HTMLVideoElement>(
      '[data-testid="pro-upload-preview-video"]',
    )
    expect(player?.getAttribute('src')).toBe(existing.url)
    expect(player?.hasAttribute('controls')).toBe(true)
    expect(wrapper.emitted('preview')?.[0]?.[0]).toMatchObject({ uid: 'existing-video-1' })

    wrapper.unmount()
  })
})

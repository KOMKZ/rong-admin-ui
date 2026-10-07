import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RImagePreview } from '@/components/image-preview'

describe('RImagePreview', () => {
  it('renders thumbnail src from urls', () => {
    const wrapper = mount(RImagePreview, {
      props: { urls: ['https://cdn.example.com/a.png'], width: 48, height: 48 },
    })
    const image = wrapper.find('img')
    expect(image.attributes('src')).toBe('https://cdn.example.com/a.png')
  })

  it('keeps thumbnail src as preview target when previewUrls is absent', () => {
    const wrapper = mount(RImagePreview, {
      props: { urls: ['https://cdn.example.com/a.png'] },
    })
    expect(wrapper.find('img').attributes('data-preview-src')).toBe(
      'https://cdn.example.com/a.png',
    )
  })

  it('separates zoom target from thumbnail via previewUrls', () => {
    const wrapper = mount(RImagePreview, {
      props: {
        urls: ['https://cdn.example.com/a-thumb.png'],
        previewUrls: ['https://cdn.example.com/a.png'],
      },
    })
    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.example.com/a-thumb.png')
    expect(wrapper.find('img').attributes('data-preview-src')).toBe(
      'https://cdn.example.com/a.png',
    )
  })

  it('maps previewUrls by original index when empty thumbnails are filtered out', () => {
    const wrapper = mount(RImagePreview, {
      props: {
        urls: ['', 'https://cdn.example.com/b-thumb.png'],
        previewUrls: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'],
      },
    })
    const images = wrapper.findAll('img')
    expect(images).toHaveLength(1)
    expect(images[0].attributes('src')).toBe('https://cdn.example.com/b-thumb.png')
    expect(images[0].attributes('data-preview-src')).toBe('https://cdn.example.com/b.png')
  })

  it('falls back to thumbnail src when previewUrls entry is blank', () => {
    const wrapper = mount(RImagePreview, {
      props: {
        urls: ['https://cdn.example.com/a-thumb.png'],
        previewUrls: ['  '],
      },
    })
    expect(wrapper.find('img').attributes('data-preview-src')).toBe(
      'https://cdn.example.com/a-thumb.png',
    )
  })

  it('renders empty placeholder without urls', () => {
    const wrapper = mount(RImagePreview, { props: { urls: [] } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('无')
  })
})

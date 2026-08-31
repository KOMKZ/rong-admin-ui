import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import RJsonResourceViewer from '../../src/components/resource-preview/RJsonResourceViewer.vue'
import { detectJsonResources } from '../../src/components/resource-preview'

const modalStub = defineComponent({
  name: 'NaiveModalStub',
  props: {
    show: Boolean,
  },
  setup(props, { slots }) {
    return () =>
      props.show
        ? h('div', { class: 'n-modal-stub', 'data-stub': 'Modal' }, slots.default?.())
        : null
  },
})

describe('resource-preview', () => {
  it('detects nested image and video resources from json values', () => {
    const resources = detectJsonResources({
      book: {
        cover_url: 'https://img3.doubanio.com/view/subject/s/public/s3073167.jpg',
        local_cover_path: 'output/booklistvideo/douban_1322455.jpg',
      },
      output: {
        video_url: '/media/render/result.mp4',
      },
    })

    expect(resources.map((item) => item.kind)).toEqual(['image', 'image', 'video'])
    expect(resources[0]).toMatchObject({
      label: 'cover_url',
      path: '$.book.cover_url',
      previewable: true,
    })
    expect(resources[1].url).toBe('/output/booklistvideo/douban_1322455.jpg')
    expect(resources[2]).toMatchObject({
      label: 'video_url',
      url: '/media/render/result.mp4',
      previewable: true,
    })
  })

  it('detects nested json strings and storage-like resources without forcing a preview url', () => {
    const resources = detectJsonResources(
      '{"output":{"cover_storage_id":"oss:sys_pub:0064/s27237850.jpg"}}',
    )

    expect(resources).toHaveLength(1)
    expect(resources[0]).toMatchObject({
      kind: 'image',
      label: 'cover_storage_id',
      value: 'oss:sys_pub:0064/s27237850.jpg',
      url: '',
      previewable: false,
    })
  })

  it('opens resources in the expanded json dialog by default', async () => {
    const wrapper = mount(RJsonResourceViewer, {
      props: {
        title: 'Output',
        value: {
          cover_url: 'https://example.test/cover.webp',
          video_url: 'https://example.test/render.mp4',
        },
      },
      global: {
        stubs: {
          Modal: modalStub,
        },
      },
    })

    expect(wrapper.find('[data-testid="json-resource-viewer"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="resource-preview-item"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('"cover_url":')

    await wrapper.find('[data-testid="json-resource-viewer-body"]').trigger('click')

    expect(wrapper.findAll('[data-testid="resource-preview-item"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('2 资源')
  })
})

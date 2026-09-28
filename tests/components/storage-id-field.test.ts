import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RStorageIdField from '@/components/form-renderer/RStorageIdField.vue'
import type { ProUploadRequestOptions } from '@/components/pro-upload'

describe('RStorageIdField', () => {
  it('appends schema policy and delegates transport to the app customRequest', async () => {
    const customRequest = vi.fn((options: ProUploadRequestOptions) => {
      options.onSuccess({
        storage_id: 'oss:sys_pub:0@poster.png',
        url: 'https://cdn.example.com/poster.png',
      })
    })
    const wrapper = mount(RStorageIdField, {
      props: {
        field: {
          key: 'poster_storage_id',
          label: '邀请海报底图',
          type: 'storage_id',
          storage: 'sys_pub',
          businessType: 'system_setting',
          mediaClass: 'image',
          customRequest,
        },
        modelValue: '',
      },
    })

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File(['poster'], 'poster.png', { type: 'image/png' })],
    })
    await input.trigger('change')
    await vi.waitFor(() => expect(customRequest).toHaveBeenCalledOnce())
    await vi.waitFor(() =>
      expect(wrapper.find('img').attributes('src')).toBe('https://cdn.example.com/poster.png'),
    )

    const options = customRequest.mock.calls[0]?.[0]
    expect(options?.formData.get('storage')).toBe('sys_pub')
    expect(options?.formData.get('business_type')).toBe('system_setting')
    expect(options?.formData.get('media_class')).toBe('image')

    const emitted = wrapper.emitted('update:modelValue') ?? []
    const storageId = emitted.at(-1)?.[0]
    expect(storageId).toBe('oss:sys_pub:0@poster.png')
    await wrapper.setProps({ modelValue: storageId })
    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.example.com/poster.png')
  })
})

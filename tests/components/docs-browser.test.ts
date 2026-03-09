import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RDocsBrowser, type DocsApiAdapter } from '../../src/components/docs-browser'

function createApiMock(): DocsApiAdapter {
  return {
    getDirectories: vi.fn().mockResolvedValue({
      directories: [{ name: 'docs', path: 'docs' }],
    }),
    getFileList: vi.fn().mockResolvedValue({
      files: [
        {
          name: 'intro.txt',
          path: 'intro.txt',
          size: 120,
          is_dir: false,
          mod_time: Date.now(),
          directory: 'docs',
        },
      ],
      total: 1,
      order: 'desc',
      directories: { docs: 1 },
    }),
    getFileContent: vi.fn().mockResolvedValue({
      name: 'intro.txt',
      path: 'intro.txt',
      content: 'Intro',
      size: 120,
    }),
  }
}

describe('RDocsBrowser', () => {
  it('loads file content from activeFileTag', async () => {
    const api = createApiMock()
    const wrapper = mount(RDocsBrowser, {
      props: {
        api,
        enableCache: false,
        activeFileTag: 'docs::intro.txt',
      },
    })

    await flushPromises()
    expect(api.getFileContent).toHaveBeenCalledWith('docs', 'intro.txt')
    expect(wrapper.find('.r-docs-file-item.is-active').exists()).toBe(true)
  })

  it('emits file-tag-change when selecting file', async () => {
    const api = createApiMock()
    const wrapper = mount(RDocsBrowser, {
      props: {
        api,
        enableCache: false,
      },
    })

    await flushPromises()
    await wrapper.get('[data-testid="docs-file-intro.txt"]').trigger('click')

    expect(wrapper.emitted('file-tag-change')?.[0]).toEqual(['docs::intro.txt'])
  })

  it('opens print dialog and calls window.print', async () => {
    const api = createApiMock()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    const wrapper = mount(RDocsBrowser, {
      props: {
        api,
        enableCache: false,
        activeFileTag: 'docs::intro.txt',
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.get('[data-testid="docs-print-open"]').trigger('click')
    const confirmBtn = document.querySelector('[data-testid="docs-print-confirm"]') as HTMLButtonElement
    expect(confirmBtn).toBeTruthy()
    confirmBtn.click()
    await flushPromises()

    expect(printSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    printSpy.mockRestore()
    rafSpy.mockRestore()
  })
})

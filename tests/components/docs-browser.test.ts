import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import {
  RDocsBrowser,
  type DocFileItem,
  type DocSortBy,
  type DocSortOrder,
  type DocsApiAdapter,
} from '../../src/components/docs-browser'

function sortFiles(files: DocFileItem[], order: DocSortOrder, sortBy: DocSortBy): DocFileItem[] {
  const direction = order === 'asc' ? 1 : -1
  return [...files].sort((a, b) => {
    if (sortBy === 'name') {
      const nameResult = a.name.localeCompare(b.name)
      if (nameResult !== 0) return nameResult * direction
      return a.path.localeCompare(b.path) * direction
    }
    const timeResult = (a.mod_time - b.mod_time) * direction
    if (timeResult !== 0) return timeResult
    return a.path.localeCompare(b.path) * direction
  })
}

function createApiMock(fileList?: DocFileItem[]): DocsApiAdapter {
  const files =
    fileList ??
    [
      {
        name: 'intro.txt',
        path: 'intro.txt',
        size: 120,
        is_dir: false,
        mod_time: Date.now(),
        directory: 'docs',
      },
    ]

  return {
    getDirectories: vi.fn().mockResolvedValue({
      directories: [{ name: 'docs', path: 'docs' }],
    }),
    getFileList: vi.fn().mockImplementation(async (order: DocSortOrder = 'desc', sortBy: DocSortBy = 'mod_time') => ({
      files: sortFiles(files, order, sortBy),
      total: files.length,
      order,
      directories: { docs: files.length },
    })),
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

  it('supports sorting by filename', async () => {
    const api = createApiMock([
      {
        name: 'zeta.md',
        path: 'zeta.md',
        size: 320,
        is_dir: false,
        mod_time: 200,
        directory: 'docs',
      },
      {
        name: 'alpha.md',
        path: 'alpha.md',
        size: 180,
        is_dir: false,
        mod_time: 100,
        directory: 'docs',
      },
    ])

    const wrapper = mount(RDocsBrowser, {
      props: {
        api,
        enableCache: false,
      },
    })

    await flushPromises()
    await wrapper.get('[data-testid="docs-sort-mode-toggle"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="docs-sort-menu"]').exists()).toBe(true)

    await wrapper.get('[data-testid="docs-sort-option-name-asc"]').trigger('click')
    await flushPromises()
    expect(api.getFileList).toHaveBeenLastCalledWith('asc', 'name')

    let order = wrapper.findAll('.r-docs-file-item').map((node) => node.attributes('data-testid'))
    expect(order).toEqual(['docs-file-alpha.md', 'docs-file-zeta.md'])

    await wrapper.get('[data-testid="docs-sort-mode-toggle"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="docs-sort-option-name-desc"]').trigger('click')
    await flushPromises()
    expect(api.getFileList).toHaveBeenLastCalledWith('desc', 'name')

    order = wrapper.findAll('.r-docs-file-item').map((node) => node.attributes('data-testid'))
    expect(order).toEqual(['docs-file-zeta.md', 'docs-file-alpha.md'])
  })
})

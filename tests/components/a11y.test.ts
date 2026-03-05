import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureAxe } from 'vitest-axe'

const axeRun = configureAxe({
  rules: {
    'scrollable-region-focusable': { enabled: false },
    'color-contrast': { enabled: false },
    'aria-toggle-field-name': { enabled: false },
    'region': { enabled: false },
    'empty-table-header': { enabled: false },
  },
})
import { RDataTable } from '@/components/data-table'
import { RFormRenderer } from '@/components/form-renderer'
import { RModalDialog } from '@/components/modal-dialog'
import { RFileUpload } from '@/components/file-upload'
import type { DataTableColumn, FormFieldSchema } from '@/components'

const tableColumns: DataTableColumn[] = [
  { key: 'id', title: 'ID' },
  { key: 'name', title: '名称' },
]
const tableData = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
]

const formSchema: FormFieldSchema[] = [
  { key: 'name', label: '姓名', type: 'input' },
  { key: 'email', label: '邮箱', type: 'input' },
]

describe('a11y: DataTable', () => {
  it('should have region role with aria-label', () => {
    const wrapper = mount(RDataTable, {
      props: { columns: tableColumns, data: tableData },
    })
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toBeTruthy()
  })

  it('should mark aria-busy when loading', () => {
    const wrapper = mount(RDataTable, {
      props: { columns: tableColumns, data: [], loading: true },
    })
    expect(wrapper.find('[role="region"]').attributes('aria-busy')).toBe('true')
  })

  it('should pass axe automated checks', async () => {
    const wrapper = mount(RDataTable, {
      props: { columns: tableColumns, data: tableData },
    })
    const results = await axeRun(wrapper.element as HTMLElement)
    expect(results.violations).toEqual([])
  })
})

describe('a11y: FormRenderer', () => {
  it('should render with form element', () => {
    const wrapper = mount(RFormRenderer, {
      props: { schema: formSchema, model: { name: '', email: '' } },
    })
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should pass axe automated checks', async () => {
    const wrapper = mount(RFormRenderer, {
      props: { schema: formSchema, model: { name: '', email: '' } },
    })
    const results = await axeRun(wrapper.element as HTMLElement)
    expect(results.violations).toEqual([])
  })
})

describe('a11y: ModalDialog', () => {
  it('should have role=dialog and aria-modal', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, title: 'Test' },
      attachTo: document.body,
    })
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    wrapper.unmount()
  })

  it('should have aria-label from title', () => {
    const wrapper = mount(RModalDialog, {
      props: { visible: true, title: '删除确认' },
      attachTo: document.body,
    })
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-label')).toBe('删除确认')
    wrapper.unmount()
  })
})

describe('a11y: FileUpload', () => {
  it('should render accessible trigger button', () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
    })
    expect(wrapper.html()).toContain('选择文件')
  })

  it('should pass axe automated checks', async () => {
    const wrapper = mount(RFileUpload, {
      props: { fileList: [] },
    })
    const results = await axeRun(wrapper.element as HTMLElement)
    expect(results.violations).toEqual([])
  })
})

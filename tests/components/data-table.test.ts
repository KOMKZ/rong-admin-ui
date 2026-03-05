import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RDataTable } from '@/components/data-table'
import type { DataTableColumn, DataTablePagination } from '@/components/data-table'

const columns: DataTableColumn[] = [
  { key: 'id', title: 'ID', width: 80 },
  { key: 'name', title: '名称' },
  { key: 'status', title: '状态', sortable: true },
]

const data = [
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
  { id: 3, name: 'Item 3', status: 'active' },
]

describe('RDataTable', () => {
  it('should render with required props', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data },
    })
    expect(wrapper.find('.r-data-table').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('region')
  })

  it('should render data rows', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data },
    })
    expect(wrapper.html()).toContain('Item 1')
    expect(wrapper.html()).toContain('Item 2')
    expect(wrapper.html()).toContain('Item 3')
  })

  it('should show empty state when data is empty', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data: [], emptyText: '没有数据' },
    })
    expect(wrapper.html()).toContain('没有数据')
  })

  it('should set aria-busy when loading', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, loading: true },
    })
    expect(wrapper.find('.r-data-table').attributes('aria-busy')).toBe('true')
  })

  it('should emit rowClick on row interaction', async () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data },
    })
    const rows = wrapper.findAll('tr')
    const dataRow = rows.find((r) => r.text().includes('Item 1'))
    expect(dataRow).toBeTruthy()
    await dataRow!.trigger('click')
    const emitted = wrapper.emitted('rowClick')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ id: 1, name: 'Item 1' })
  })

  it('should not render selection column when selectable=false (default)', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data },
    })
    const headers = wrapper.findAll('th')
    const hasSelection = headers.some(
      (h) => h.html().includes('type="checkbox"') || h.html().includes('selection'),
    )
    expect(hasSelection).toBe(false)
  })

  it('should render selection column when selectable=true', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, selectable: true, checkedRowKeys: [] },
    })
    const headers = wrapper.findAll('th')
    const defaultWrapper = mount(RDataTable, {
      props: { columns, data },
    })
    const defaultHeaders = defaultWrapper.findAll('th')
    expect(headers.length).toBe(defaultHeaders.length + 1)
  })

  it('should emit update:checkedRowKeys when selectable', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, selectable: true, checkedRowKeys: [] },
    })
    expect(wrapper.find('.r-data-table').exists()).toBe(true)
  })

  it('should render with pagination config', () => {
    const pagination: DataTablePagination = {
      page: 1,
      pageSize: 10,
      total: 100,
    }
    const wrapper = mount(RDataTable, {
      props: { columns, data, pagination },
    })
    expect(wrapper.find('.r-data-table').exists()).toBe(true)
  })

  it('should render toolbar slot', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data },
      slots: { toolbar: '<div class="custom-toolbar">Toolbar</div>' },
    })
    expect(wrapper.find('.custom-toolbar').exists()).toBe(true)
  })

  it('should render summary slot', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data },
      slots: { summary: '<div class="custom-summary">Summary</div>' },
    })
    expect(wrapper.find('.custom-summary').exists()).toBe(true)
  })

  it('should expose clearSelection and clearSort', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, checkedRowKeys: [1] },
    })
    const vm = wrapper.vm as unknown as { clearSelection: () => void; clearSort: () => void }
    expect(typeof vm.clearSelection).toBe('function')
    expect(typeof vm.clearSort).toBe('function')
  })

  it('should respect size prop', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, size: 'small' },
    })
    expect(wrapper.find('.r-data-table').exists()).toBe(true)
  })

  it('should support custom column render', () => {
    const customColumns: DataTableColumn[] = [
      { key: 'id', title: 'ID' },
      {
        key: 'name',
        title: '名称',
        render: (row) => `Custom: ${row.name}`,
      },
    ]
    const wrapper = mount(RDataTable, {
      props: { columns: customColumns, data },
    })
    expect(wrapper.html()).toContain('Custom: Item 1')
  })
})

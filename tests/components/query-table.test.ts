import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { RQueryTable } from '@/components/query-table'
import type { DataTableColumn } from '@/components/data-table'
import type { FormFieldSchema } from '@/components/form-renderer'
import type { QueryTableFetchResult } from '@/components/query-table'

const columns: DataTableColumn[] = [
  { key: 'id', title: 'ID', width: 80 },
  { key: 'name', title: '名称' },
]

const mockData = [
  { id: 1, name: 'User 1' },
  { id: 2, name: 'User 2' },
  { id: 3, name: 'User 3' },
]

function createFetchData(data = mockData, total?: number) {
  return vi.fn().mockResolvedValue({
    data,
    total: total ?? data.length,
  } satisfies QueryTableFetchResult)
}

describe('RQueryTable', () => {
  let fetchData: ReturnType<typeof createFetchData>

  beforeEach(() => {
    fetchData = createFetchData()
  })

  it('should render with testid', () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData },
    })
    expect(wrapper.find('[data-testid="query-table"]').exists()).toBe(true)
  })

  it('should auto-load data on mount when autoLoad=true (default)', async () => {
    mount(RQueryTable, {
      props: { columns, fetchData },
    })
    await flushPromises()
    expect(fetchData).toHaveBeenCalledTimes(1)
    expect(fetchData).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      query: {},
      sort: undefined,
    })
  })

  it('should not auto-load when autoLoad=false', async () => {
    mount(RQueryTable, {
      props: { columns, fetchData, autoLoad: false },
    })
    await flushPromises()
    expect(fetchData).not.toHaveBeenCalled()
  })

  it('should render query form when querySchema provided', () => {
    const querySchema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input' },
    ]
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData, querySchema },
    })
    expect(wrapper.find('.r-query-table__form').exists()).toBe(true)
  })

  it('should not render query form when querySchema is empty', () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData },
    })
    expect(wrapper.find('.r-query-table__form').exists()).toBe(false)
  })

  it('should render toolbar slot', () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData },
      slots: { toolbar: '<div class="tb">Toolbar</div>' },
    })
    expect(wrapper.find('.tb').exists()).toBe(true)
  })

  it('should not render toolbar when slot not provided', () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData },
    })
    expect(wrapper.find('.r-query-table__toolbar').exists()).toBe(false)
  })

  it('should use defaultPageSize prop', async () => {
    mount(RQueryTable, {
      props: { columns, fetchData, defaultPageSize: 20 },
    })
    await flushPromises()
    expect(fetchData).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20 }),
    )
  })

  it('should expose reload method', async () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData },
    })
    await flushPromises()
    expect(fetchData).toHaveBeenCalledTimes(1)
    const vm = wrapper.vm as unknown as { reload: () => Promise<void> }
    await vm.reload()
    expect(fetchData).toHaveBeenCalledTimes(2)
  })

  it('should expose resetQuery method', async () => {
    const querySchema: FormFieldSchema[] = [
      { key: 'name', label: '姓名', type: 'input', defaultValue: '' },
    ]
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData, querySchema },
    })
    await flushPromises()
    const vm = wrapper.vm as unknown as { resetQuery: () => void }
    vm.resetQuery()
    await flushPromises()
    expect(fetchData).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, query: { name: '' } }),
    )
  })

  it('should expose getCheckedKeys and clearSelection', async () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData, selectable: true },
    })
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      getCheckedKeys: () => unknown[]
      clearSelection: () => void
    }
    expect(vm.getCheckedKeys()).toEqual([])
    vm.clearSelection()
    expect(vm.getCheckedKeys()).toEqual([])
  })

  it('should pass selectable prop to inner RDataTable', () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData, selectable: true },
    })
    expect(wrapper.find('.r-data-table').exists()).toBe(true)
  })

  it('should pass bordered and striped props', () => {
    const wrapper = mount(RQueryTable, {
      props: { columns, fetchData, bordered: false, striped: true },
    })
    expect(wrapper.find('.r-data-table').exists()).toBe(true)
  })

  it('should build default query from schema', async () => {
    const querySchema: FormFieldSchema[] = [
      { key: 'status', label: '状态', type: 'select', defaultValue: 'active' },
      { key: 'keyword', label: '关键词', type: 'input' },
    ]
    mount(RQueryTable, {
      props: { columns, fetchData, querySchema },
    })
    await flushPromises()
    expect(fetchData).toHaveBeenCalledWith(
      expect.objectContaining({ query: { status: 'active', keyword: null } }),
    )
  })
})

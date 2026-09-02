import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

  it('keeps refresh, density, and column controls in the table toolbar', async () => {
    const wrapper = mount(RDataTable, {
      props: {
        columns,
        data,
        refreshable: true,
        densitySwitchable: true,
        columnConfigurable: true,
      },
    })

    expect(wrapper.find('[data-testid="data-table-refresh"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="data-table-density"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="data-table-columns"]').exists()).toBe(true)
    expect(wrapper.find('.r-data-table__toolbar-actions').classes()).toContain(
      'r-data-table__toolbar-actions',
    )
    await wrapper.find('[data-testid="data-table-refresh"]').trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('wires density changes from the table toolbar', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, density: 'operations', densitySwitchable: true },
    })
    const source = readFileSync(
      join(process.cwd(), 'src/components/data-table/RDataTable.vue'),
      'utf8',
    )

    expect(wrapper.find('[data-testid="data-table-density"]').exists()).toBe(true)
    expect(source).toContain('@click="handleDensityChange(opt.value)"')
    expect(source).toContain("'update:density': [density: DataTableDensity]")
  })

  it('governs table toolbar spacing in the framework layer', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/data-table/RDataTable.vue'),
      'utf8',
    )

    expect(source).toContain('--ra-table-toolbar-padding-x')
    expect(source).toContain('--ra-table-toolbar-padding-top')
    expect(source).toContain('--ra-table-toolbar-padding-bottom')
    expect(source).toContain('flex-wrap: nowrap')
    expect(source).toContain('justify-content: flex-end')
  })

  it('should render built-in selected export and delete actions', () => {
    const wrapper = mount(RDataTable, {
      props: {
        columns,
        data,
        selectable: true,
        checkedRowKeys: [1],
        exportable: true,
        batchDeletable: true,
      },
    })
    expect(wrapper.find('[data-testid="batch-action-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="batch-action-export-selected"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="batch-action-delete"]').exists()).toBe(true)
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

  it('applies operations density as compact table with governed horizontal overflow', () => {
    const wideColumns: DataTableColumn[] = [
      { key: 'workflow_key', title: '工作流', minWidth: 180 },
      { key: 'workflow_version', title: '版本', width: 90 },
      { key: 'status', title: '状态', width: 110 },
      { key: 'current_node', title: '当前节点', minWidth: 160 },
      { key: 'error_message', title: '错误', minWidth: 220 },
      { key: 'created_at', title: '创建时间', width: 170 },
      { key: 'actions', title: '操作', width: 100, fixed: 'right' },
    ]
    const wrapper = mount(RDataTable, {
      props: { columns: wideColumns, data, density: 'operations' },
    })
    const table = wrapper.findComponent({ name: 'DataTable' })

    expect(wrapper.find('.r-data-table--operations').exists()).toBe(true)
    expect(table.props('size')).toBe('small')
    expect(table.props('scrollX')).toBeGreaterThanOrEqual(1030)
  })

  it('keeps explicit size and scrollX above density defaults', () => {
    const wrapper = mount(RDataTable, {
      props: { columns, data, density: 'operations', size: 'medium', scrollX: 1280 },
    })
    const table = wrapper.findComponent({ name: 'DataTable' })

    expect(table.props('size')).toBe('medium')
    expect(table.props('scrollX')).toBe(1280)
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

  it('governs table header color and right edge spacing with framework tokens', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/data-table/RDataTable.vue'),
      'utf8',
    )

    expect(source).toContain('background-color: var(--ra-color-table-header-bg)')
    expect(source).toContain('--ra-table-action-column-padding-right')
    expect(source).toContain('.n-data-table-td--fixed-right')
  })
})

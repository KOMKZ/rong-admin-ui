import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { NDataTable } from 'naive-ui'
import RDataTable from '../../src/components/data-table/RDataTable.vue'
import type {
  DataTableColumn,
  DataTablePagination,
  ColumnConfigItem,
  DataTableExpose,
} from '../../src/components/data-table/types'

const columns: DataTableColumn[] = [
  { key: 'id', title: 'ID', width: 80 },
  { key: 'name', title: '名称' },
  { key: 'status', title: '状态', sortable: true },
  { key: 'extra', title: 'Extra', defaultVisible: false },
]

const data = [
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
  { id: 3, name: 'Item 3', status: 'active' },
]

const STORAGE_KEY = 'ra-col-cfg-test-table'

describe('RDataTable — Pro features', () => {
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    localStorageMock = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k])
      }),
      length: 0,
      key: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('columnConfigurable prop', () => {
    it('should show config button when columnConfigurable is true', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true },
      })
      const configBtn = wrapper.find('.r-data-table__config-btn')
      expect(configBtn.exists()).toBe(true)
      expect(configBtn.attributes('aria-label')).toBe('Configure columns')
    })

    it('should not show config button when columnConfigurable is false', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: false },
      })
      expect(wrapper.find('.r-data-table__config-btn').exists()).toBe(false)
    })

    it('should toggle config panel on config button click', async () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true },
      })
      expect(wrapper.find('.r-data-table__config-panel').exists()).toBe(false)

      await wrapper.find('.r-data-table__config-btn').trigger('click')
      expect(wrapper.find('.r-data-table__config-panel').exists()).toBe(true)

      await wrapper.find('.r-data-table__config-btn').trigger('click')
      expect(wrapper.find('.r-data-table__config-panel').exists()).toBe(false)
    })

    it('should render config panel with column checkboxes', async () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true },
      })
      await wrapper.find('.r-data-table__config-btn').trigger('click')

      const panel = wrapper.find('.r-data-table__config-panel')
      expect(panel.attributes('role')).toBe('dialog')
      expect(panel.attributes('aria-label')).toBe('Column configuration')

      const labels = wrapper.findAll('.r-data-table__config-item')
      expect(labels.length).toBe(columns.length)
      expect(labels.some((l) => l.text().includes('ID'))).toBe(true)
      expect(labels.some((l) => l.text().includes('Extra'))).toBe(true)
    })
  })

  describe('columnStorageKey and persistence', () => {
    it('should persist column config to localStorage when columnStorageKey is set', async () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: 'my-table' },
      })

      await wrapper.find('.r-data-table__config-btn').trigger('click')
      const firstCheckbox = wrapper.findAll('.r-data-table__config-item input[type="checkbox"]')[0]
      await firstCheckbox.trigger('change')

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ra-col-cfg-my-table',
        expect.any(String),
      )
      const stored = JSON.parse(localStorageMock['ra-col-cfg-my-table']) as ColumnConfigItem[]
      expect(Array.isArray(stored)).toBe(true)
      expect(stored.length).toBe(columns.length)
    })

    it('should init column config from localStorage when valid data exists', () => {
      const stored: ColumnConfigItem[] = columns.map((c, idx) => ({
        key: c.key,
        visible: c.key !== 'extra',
        order: idx,
      }))
      localStorageMock[`ra-col-cfg-${STORAGE_KEY}`] = JSON.stringify(stored)

      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: STORAGE_KEY },
      })

      const config = (wrapper.vm as unknown as { getColumnConfig: () => ColumnConfigItem[] }).getColumnConfig()
      expect(config).toMatchObject(stored)
      expect(config.find((c) => c.key === 'extra')?.visible).toBe(false)
    })

    it('should use defaults when localStorage has invalid JSON', () => {
      localStorageMock[`ra-col-cfg-${STORAGE_KEY}`] = 'invalid{json'

      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: STORAGE_KEY },
      })

      const config = (wrapper.vm as unknown as { getColumnConfig: () => ColumnConfigItem[] }).getColumnConfig()
      expect(config.length).toBe(columns.length)
      expect(config.every((c) => typeof c.visible === 'boolean')).toBe(true)
    })

    it('should use defaults when localStorage returns non-array', () => {
      localStorageMock[`ra-col-cfg-${STORAGE_KEY}`] = JSON.stringify({ not: 'array' })

      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: STORAGE_KEY },
      })

      const config = (wrapper.vm as unknown as { getColumnConfig: () => ColumnConfigItem[] }).getColumnConfig()
      expect(config.length).toBe(columns.length)
    })

    it('should not persist when columnStorageKey is undefined', async () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true },
      })

      await wrapper.find('.r-data-table__config-btn').trigger('click')
      const checkbox = wrapper.findAll('.r-data-table__config-item input[type="checkbox"]')[0]
      await checkbox.trigger('change')

      expect(localStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('toggleColumnVisibility', () => {
    it('should allow hiding columns via setColumnConfig', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true },
      })

      const vm = wrapper.vm as unknown as DataTableExpose
      const config = vm.getColumnConfig()
      expect(config.length).toBe(columns.length)

      const newConfig = config.map((c: ColumnConfigItem) => ({
        ...c,
        visible: c.key !== 'extra',
      }))
      vm.setColumnConfig(newConfig)

      const updated = vm.getColumnConfig()
      expect(updated.find((c: ColumnConfigItem) => c.key === 'extra')?.visible).toBe(false)
      expect(updated.find((c: ColumnConfigItem) => c.key === 'name')?.visible).toBe(true)
    })

    it('should not toggle when column has configurable: false', async () => {
      const cols: DataTableColumn[] = [
        ...columns,
        { key: 'locked', title: 'Locked', configurable: false },
      ]
      const wrapper = mount(RDataTable, {
        props: { columns: cols, data, columnConfigurable: true },
      })

      await wrapper.find('.r-data-table__config-btn').trigger('click')
      const lockedLabel = wrapper.findAll('.r-data-table__config-item').find((l) =>
        l.text().includes('Locked'),
      )
      expect(lockedLabel?.classes()).toContain('disabled')
      const checkbox = lockedLabel!.find('input[type="checkbox"]')
      expect(checkbox.attributes('disabled')).toBeDefined()
    })
  })

  describe('resetColumnConfigToDefaults', () => {
    it('should reset config when Reset button is clicked', async () => {
      const stored: ColumnConfigItem[] = columns.map((c) => ({
        key: c.key,
        visible: false,
        order: 99,
      }))
      localStorageMock[`ra-col-cfg-${STORAGE_KEY}`] = JSON.stringify(stored)

      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: STORAGE_KEY },
      })

      await wrapper.find('.r-data-table__config-btn').trigger('click')
      await wrapper.find('.r-data-table__config-reset').trigger('click')

      const config = (wrapper.vm as unknown as { getColumnConfig: () => ColumnConfigItem[] }).getColumnConfig()
      expect(config.map((c) => c.visible)).toEqual([true, true, true, false])
      expect(config.map((c) => c.order)).toEqual([0, 1, 2, 3])
    })
  })

  describe('server-params-change emission', () => {
    it('should emit server-params-change when sorter changes', async () => {
      const pagination: DataTablePagination = { page: 1, pageSize: 10, total: 100 }
      const wrapper = mount(RDataTable, {
        props: {
          columns,
          data,
          pagination,
          defaultSort: undefined,
        },
      })

      const naiveTable = wrapper.findComponent(NDataTable)
      expect(naiveTable.exists()).toBe(true)

      const sorter: { columnKey: string; order: 'ascend' | 'descend' | false } = {
        columnKey: 'status',
        order: 'ascend',
      }
      await naiveTable.vm.$emit('update:sorter', sorter)

      const emitted = wrapper.emitted('server-params-change')
      expect(emitted).toBeTruthy()
      expect(emitted!.length).toBeGreaterThan(0)
      const params = emitted![emitted!.length - 1][0] as Record<string, unknown>
      expect(params.sort).toEqual({ columnKey: 'status', order: 'ascend' })
      expect(params.pagination).toEqual({ page: 1, pageSize: 10 })
    })

    it('should not emit server-params-change when sorter is null', async () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data },
      })
      const beforeCount = wrapper.emitted('server-params-change')?.length ?? 0

      const naiveTable = wrapper.findComponent(NDataTable)
      await naiveTable.vm.$emit('update:sorter', null)

      const afterCount = wrapper.emitted('server-params-change')?.length ?? 0
      expect(afterCount).toBe(beforeCount)
    })

    it('should emit server-params-change when pagination onChange is called', async () => {
      const pagination: DataTablePagination = { page: 1, pageSize: 10, total: 100 }
      const wrapper = mount(RDataTable, {
        props: { columns, data, pagination },
      })

      const naiveTable = wrapper.findComponent(NDataTable)
      expect(naiveTable.props('remote')).toBe(true)
      const paginationProp = naiveTable.props('pagination') as Record<string, unknown> | false
      expect(paginationProp).not.toBe(false)
      expect(typeof paginationProp).toBe('object')

      const onChange = (paginationProp as Record<string, unknown>).onChange as ((p: number) => void) | undefined
      onChange?.(2)
      expect(wrapper.emitted('update:page')).toBeTruthy()
      expect(wrapper.emitted('update:page')![0][0]).toBe(2)

      const serverParams = wrapper.emitted('server-params-change')
      expect(serverParams).toBeTruthy()
      expect(serverParams!.length).toBeGreaterThan(0)
    })

    it('should default to local mode when pagination disabled', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, pagination: false },
      })
      const naiveTable = wrapper.findComponent(NDataTable)
      expect(naiveTable.props('remote')).toBe(false)
    })
  })

  describe('batch toolbar', () => {
    it('should show batch toolbar when selectable and rows are selected', () => {
      const wrapper = mount(RDataTable, {
        props: {
          columns,
          data,
          selectable: true,
          checkedRowKeys: [1, 2],
        },
      })

      const batchToolbar = wrapper.find('[data-testid="batch-toolbar"]')
      expect(batchToolbar.exists()).toBe(true)
      expect(batchToolbar.text()).toContain('2 item(s) selected')
    })

    it('should not show batch toolbar when no rows selected', () => {
      const wrapper = mount(RDataTable, {
        props: {
          columns,
          data,
          selectable: true,
          checkedRowKeys: [],
        },
      })

      expect(wrapper.find('[data-testid="batch-toolbar"]').exists()).toBe(false)
    })

    it('should not show batch toolbar when selectable is false', () => {
      const wrapper = mount(RDataTable, {
        props: {
          columns,
          data,
          selectable: false,
          checkedRowKeys: [1],
        },
      })

      expect(wrapper.find('[data-testid="batch-toolbar"]').exists()).toBe(false)
    })

    it('should render default batch toolbar text with selected count', () => {
      const wrapper = mount(RDataTable, {
        props: {
          columns,
          data,
          selectable: true,
          checkedRowKeys: [1, 2, 3],
        },
      })

      const batchToolbar = wrapper.find('[data-testid="batch-toolbar"]')
      expect(batchToolbar.exists()).toBe(true)
      expect(batchToolbar.text()).toContain('3 item(s) selected')
    })
  })

  describe('exposed methods', () => {
    it('should expose getColumnConfig and setColumnConfig', async () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: STORAGE_KEY },
      })

      const vm = wrapper.vm as unknown as {
        getColumnConfig: () => ColumnConfigItem[]
        setColumnConfig: (c: ColumnConfigItem[]) => void
      }

      const initial = vm.getColumnConfig()
      expect(initial.length).toBe(columns.length)

      const newConfig: ColumnConfigItem[] = columns.map((c, i) => ({
        key: c.key,
        visible: c.key !== 'extra',
        order: i,
      }))
      vm.setColumnConfig(newConfig)

      expect(vm.getColumnConfig()).toMatchObject(newConfig)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `ra-col-cfg-${STORAGE_KEY}`,
        expect.any(String),
      )
    })

    it('should expose resetColumnConfig', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, columnConfigurable: true, columnStorageKey: STORAGE_KEY },
      })

      const vm = wrapper.vm as unknown as {
        setColumnConfig: (c: ColumnConfigItem[]) => void
        resetColumnConfig: () => void
        getColumnConfig: () => ColumnConfigItem[]
      }

      vm.setColumnConfig([
        { key: 'id', visible: false, order: 99 },
        { key: 'name', visible: false, order: 98 },
        { key: 'status', visible: false, order: 97 },
        { key: 'extra', visible: false, order: 96 },
      ])
      vm.resetColumnConfig()

      const config = vm.getColumnConfig()
      expect(config.map((c) => c.visible)).toEqual([true, true, true, false])
      expect(config.map((c) => c.order)).toEqual([0, 1, 2, 3])
    })

    it('should emit update:sort when clearSort is called', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, defaultSort: { columnKey: 'status', order: 'ascend' } },
      })

      const vm = wrapper.vm as unknown as { clearSort: () => void }
      vm.clearSort()

      const emitted = wrapper.emitted('update:sort')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual({ columnKey: '', order: false })
    })

    it('should emit update:checkedRowKeys when clearSelection is called', () => {
      const wrapper = mount(RDataTable, {
        props: { columns, data, selectable: true, checkedRowKeys: [1, 2] },
      })

      const vm = wrapper.vm as unknown as { clearSelection: () => void }
      vm.clearSelection()

      expect(wrapper.emitted('update:checkedRowKeys')?.[0]).toEqual([[]])
    })
  })

  describe('column config with new columns', () => {
    it('should add new columns to config when columns prop changes', async () => {
      const baseCols = columns.slice(0, 2)
      const wrapper = mount(RDataTable, {
        props: { columns: baseCols, data, columnConfigurable: true },
      })

      const initialConfig = (wrapper.vm as unknown as { getColumnConfig: () => ColumnConfigItem[] }).getColumnConfig()
      expect(initialConfig.length).toBe(2)

      await wrapper.setProps({ columns })
      await wrapper.vm.$nextTick()

      const newConfig = (wrapper.vm as unknown as { getColumnConfig: () => ColumnConfigItem[] }).getColumnConfig()
      expect(newConfig.length).toBe(4)
      expect(newConfig.some((c) => c.key === 'status')).toBe(true)
      expect(newConfig.some((c) => c.key === 'extra')).toBe(true)
    })
  })
})

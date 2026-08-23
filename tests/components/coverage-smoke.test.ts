import { defineComponent, h, onMounted } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RDataGrid from '../../src/components/data-grid/RDataGrid.vue'
import RMenuPresetEditor from '../../src/components/menu-preset-editor/RMenuPresetEditor.vue'
import { useChatSSE } from '../../src/components/chat/composables/useChatSSE'
import type { MenuPreset } from '../../src/components/menu-preset-editor'

const agGridApi = {
  setGridOption: vi.fn(),
  sizeColumnsToFit: vi.fn(),
  applyTransaction: vi.fn(() => ({ add: [{}] })),
  forEachNode: vi.fn(),
  getSelectedRows: vi.fn(() => []),
  exportDataAsCsv: vi.fn(),
  setFilterModel: vi.fn(),
  onFilterChanged: vi.fn(),
}

vi.mock('ag-grid-vue3', () => ({
  AgGridVue: defineComponent({
    name: 'AgGridVue',
    emits: ['grid-ready'],
    setup(_, { emit }) {
      onMounted(() => emit('grid-ready', { api: agGridApi }))
      return () => h('div', { 'data-testid': 'ag-grid-stub' })
    },
  }),
}))

vi.mock('ag-grid-community', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('ag-grid-community')
  return {
    ...actual,
    AllCommunityModule: {},
    ModuleRegistry: {
      registerModules: vi.fn(),
    },
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('public component smoke coverage', () => {
  it('initializes RDataGrid and exposes table actions', async () => {
    const wrapper = mount(RDataGrid, {
      props: {
        columns: [
          { field: 'id', headerName: 'ID', type: 'number' },
          { field: 'name', headerName: 'Name', type: 'text' },
        ],
        rows: [{ id: 1, name: 'Alpha' }],
        height: 320,
      },
      global: {
        stubs: {
          Teleport: true,
          Transition: false,
          ColumnEditDrawer: true,
          FilterDrawer: true,
        },
      },
    })

    await flushPromises()
    expect(wrapper.find('[data-testid="data-grid"]').exists()).toBe(true)

    wrapper.vm.addColumn()
    expect(wrapper.emitted('columnAdd')).toBeTruthy()
  })

  it('renders RMenuPresetEditor and emits preset commands', async () => {
    const presets: MenuPreset[] = [
      {
        id: 'default',
        name: 'Default',
        readonly: true,
        items: [
          {
            id: 1,
            parentId: null,
            name: 'admin',
            path: '/admin',
            meta: { title: 'Admin' },
          },
        ],
      },
      {
        id: 'custom',
        name: 'Custom',
        items: [
          {
            id: 2,
            parentId: null,
            name: 'files',
            path: '/files',
            meta: { title: 'Files' },
          },
        ],
      },
    ]

    const wrapper = mount(RMenuPresetEditor, {
      props: {
        presets,
        activePresetId: 'custom',
        defaultPresetId: 'default',
      },
      global: {
        stubs: {
          NSelect: defineComponent({
            emits: ['update:value'],
            setup(_, { emit }) {
              return () =>
                h('button', { 'data-testid': 'preset-select', onClick: () => emit('update:value', 'default') })
            },
          }),
          NTree: defineComponent({
            emits: ['update:selected-keys'],
            setup(_, { emit }) {
              return () =>
                h('button', { 'data-testid': 'preset-tree', onClick: () => emit('update:selected-keys', [2]) })
            },
          }),
          NModal: true,
          NPopconfirm: { template: '<div><slot name="trigger" /><slot /></div>' },
          NAlert: { template: '<div><slot /></div>' },
          NTag: { template: '<span><slot /></span>' },
          NSwitch: true,
          NSpace: { template: '<div><slot /></div>' },
          NButton: { template: '<button @click="$emit(`click`, $event)"><slot /></button>' },
          NInput: true,
          NTooltip: true,
        },
      },
    })

    expect(wrapper.get('[data-testid="menu-preset-editor"]').text()).toContain('已同步')

    await wrapper.get('[data-testid="preset-select"]').trigger('click')
    expect(wrapper.emitted('update:activePresetId')?.[0]).toEqual(['default'])

    await wrapper.get('[data-testid="preset-tree"]').trigger('click')
    expect(wrapper.exists()).toBe(true)
  })
})

describe('useChatSSE', () => {
  it('streams chunks, progress events, usage, and done callbacks', async () => {
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'data: {"event_type":"search_start","query":"crop"}',
              '',
              'data: {"event_type":"search_done","query":"crop","result_count":2,"provider":"web"}',
              '',
              'data: {"event_type":"fetch_done","url":"https://example.com/a","status_code":200,"latency_ms":12}',
              '',
              'event: agent_start',
              'data: {"agent_id":7,"agent_name":"Worker","total_nodes":3}',
              '',
              'event: llm_token',
              'data: {"token":"hello"}',
              '',
              'data: {"event_type":"tool_call","tool_name":"lookup","tool_args":"{}"}',
              '',
              'data: {"event_type":"tool_result","tool_name":"lookup","tool_summary":"ok","latency_ms":5}',
              '',
              'data: {"event_type":"usage","input_tokens":1,"output_tokens":2,"total_tokens":3}',
              '',
            ].join('\n'),
          ),
        )
        controller.close()
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }))

    const onChunk = vi.fn()
    const onDone = vi.fn()
    const onError = vi.fn()
    let sse: ReturnType<typeof useChatSSE> | undefined
    const wrapper = mount(
      defineComponent({
        setup() {
          sse = useChatSSE()
          return () => h('div')
        },
      }),
    )

    await sse!.startStream({
      url: '/chat',
      body: { message: 'hello' },
      onChunk,
      onDone,
      onError,
    })

    expect(onError).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(sse!.streamContent.value).toBe('hello')
    expect(sse!.searchProgress.value.status).toBe('done')
    expect(sse!.fetchProgress.value.domain).toBe('example.com')
    expect(sse!.agentProgress.value.status).toBe('running')
    expect(sse!.toolCallEvents.value[0]).toMatchObject({ name: 'lookup', result: 'ok' })
    expect(sse!.tokenUsage.value).toMatchObject({ totalTokens: 3 })

    wrapper.unmount()
  })
})

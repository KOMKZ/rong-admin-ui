<script lang="ts" setup>
import './RResourcePickerDialog.css'
  import { computed, reactive, ref, watch, type PropType } from 'vue'
  import { NAlert, NButton, NEmpty, NInput, NPagination, NSelect, NSpace, NSpin, NTag } from 'naive-ui'
  import { RIcon } from '../icon'
  import RDataTable from '../data-table/RDataTable.vue'
  import RModalDialog from '../modal-dialog/RModalDialog.vue'
  import type {
    ResourcePickerConfirmPayload,
    ResourcePickerItem,
    ResourcePickerKey,
    ResourcePickerLoadResult,
    ResourcePickerFilter,
    ResourcePickerTab,
  } from './types'

  interface TabState {
    activated: boolean
    loaded: boolean
    loading: boolean
    error: string
    keyword: string
    page: number
    pageSize: number
    filters: Record<string, unknown>
    total: number
    items: ResourcePickerItem[]
    requestId: number
  }

  const props = defineProps({
    visible: { type: Boolean, required: true },
    modelValue: { type: Object as PropType<ResourcePickerItem | null>, default: null },
    tabs: { type: Array as PropType<ResourcePickerTab[]>, required: true },
    title: { type: String, default: '选择资源' },
    width: { type: [Number, String] as PropType<number | string>, default: '80vw' },
    loadOnOpen: { type: Boolean, default: false },
    initialActiveKey: { type: String, default: '' },
    confirmText: { type: String, default: '使用此资源' },
    cancelText: { type: String, default: '取消' },
    emptyText: { type: String, default: '暂无资源' },
    inactiveText: { type: String, default: '请选择一个资源类型后加载数据' },
    cardMinWidth: { type: Number, default: 220 },
    dataTestId: { type: String, default: 'resource-picker-dialog' },
  })

  const emit = defineEmits<{
    'update:visible': [visible: boolean]
    'update:modelValue': [item: ResourcePickerItem | null]
    confirm: [payload: ResourcePickerConfirmPayload]
    cancel: []
    select: [item: ResourcePickerItem, tabKey: string]
    activate: [tabKey: string]
    loadError: [error: unknown, tabKey: string]
  }>()

  const activeTabKey = ref('')
  const selectedItem = ref<ResourcePickerItem | null>(null)
  const states = reactive<Record<string, TabState>>({})

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
  })

  const activeTab = computed(
    () => props.tabs.find((tab) => tab.key === activeTabKey.value) ?? null,
  )

  const activeState = computed(() =>
    activeTab.value ? ensureState(activeTab.value) : null,
  )

  const selectedKey = computed<ResourcePickerKey | null>(() => selectedItem.value?.id ?? null)

  const canConfirm = computed(() => selectedItem.value !== null && !selectedItem.value.disabled)

  const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(${props.cardMinWidth}px, 1fr))`,
  }))

  const tableView = computed(() => activeTab.value?.view === 'table')

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) return
      selectedItem.value = props.modelValue
      activeTabKey.value = props.initialActiveKey
      if (props.loadOnOpen && props.tabs.length > 0) {
        const key = props.initialActiveKey || props.tabs[0].key
        void activateTab(key)
      }
    },
  )

  watch(
    () => props.modelValue,
    (item) => {
      if (!props.visible) selectedItem.value = item
    },
  )

  function ensureState(tab: ResourcePickerTab): TabState {
    if (!states[tab.key]) {
      states[tab.key] = {
        activated: false,
        loaded: false,
        loading: false,
        error: '',
        keyword: '',
        page: 1,
        pageSize: tab.pageSize ?? 12,
        filters: Object.fromEntries((tab.filters ?? []).map((filter) => [filter.key, null])),
        total: 0,
        items: [],
        requestId: 0,
      }
    }
    return states[tab.key]
  }

  async function activateTab(tabKey: string): Promise<void> {
    const tab = props.tabs.find((item) => item.key === tabKey)
    if (!tab) return
    activeTabKey.value = tab.key
    const state = ensureState(tab)
    const firstActivation = !state.activated
    state.activated = true
    emit('activate', tab.key)
    if (firstActivation && tab.loadOnActivate !== false) {
      await loadTab(tab.key)
    }
  }

  async function loadTab(tabKey: string): Promise<void> {
    const tab = props.tabs.find((item) => item.key === tabKey)
    if (!tab) return
    const state = ensureState(tab)
    const requestId = state.requestId + 1
    state.requestId = requestId
    state.loading = true
    state.error = ''
    try {
      const result = await tab.load({
        tabKey: tab.key,
        keyword: state.keyword.trim(),
        page: state.page,
        pageSize: state.pageSize,
        filters: { ...state.filters },
      })
      if (state.requestId !== requestId) return
      applyLoadResult(state, result)
    } catch (error) {
      if (state.requestId !== requestId) return
      state.error = error instanceof Error ? error.message : '加载资源失败'
      state.items = []
      state.total = 0
      emit('loadError', error, tab.key)
    } finally {
      if (state.requestId === requestId) state.loading = false
    }
  }

  function applyLoadResult(state: TabState, result: ResourcePickerLoadResult): void {
    state.items = result.items
    state.total = result.total
    state.loaded = true
  }

  function handleSearch(): void {
    if (!activeTab.value || !activeState.value) return
    activeState.value.page = 1
    void loadTab(activeTab.value.key)
  }

  function handleReload(): void {
    if (!activeTab.value) return
    void loadTab(activeTab.value.key)
  }

  function handlePageChange(page: number): void {
    if (!activeTab.value || !activeState.value) return
    activeState.value.page = page
    void loadTab(activeTab.value.key)
  }

  function handlePageSizeChange(pageSize: number): void {
    if (!activeTab.value || !activeState.value) return
    activeState.value.pageSize = pageSize
    activeState.value.page = 1
    void loadTab(activeTab.value.key)
  }

  function handleFilterChange(filter: ResourcePickerFilter, value: unknown): void {
    if (!activeState.value) return
    activeState.value.filters[filter.key] = value
    activeState.value.page = 1
  }

  function filterValue(key: string): string | number | null {
    const value = activeState.value?.filters[key]
    return typeof value === 'string' || typeof value === 'number' ? value : null
  }

  function handleFilterSearch(): void {
    handleSearch()
  }

  function handleFilterReset(): void {
    if (!activeTab.value || !activeState.value) return
    for (const filter of activeTab.value.filters ?? []) {
      activeState.value.filters[filter.key] = null
    }
    activeState.value.page = 1
    void loadTab(activeTab.value.key)
  }

  function selectItem(item: ResourcePickerItem): void {
    if (item.disabled || !activeTab.value) return
    selectedItem.value = item
    emit('select', item, activeTab.value.key)
  }

  function selectTableRows(keys: Array<string | number>): void {
    if (!activeState.value) return
    const key = keys[keys.length - 1]
    const item = activeState.value.items.find((candidate) => candidate.id === key)
    if (item) selectItem(item)
    else selectedItem.value = null
  }

  function selectTableRow(row: Record<string, unknown>): void {
    selectItem(row as unknown as ResourcePickerItem)
  }

  function handleCardKeydown(event: KeyboardEvent, item: ResourcePickerItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    selectItem(item)
  }

  function handleConfirm(): void {
    if (!canConfirm.value) return
    const payload: ResourcePickerConfirmPayload = {
      item: selectedItem.value,
      tabKey: activeTabKey.value,
    }
    emit('update:modelValue', selectedItem.value)
    emit('confirm', payload)
    emit('update:visible', false)
  }

  function handleCancel(): void {
    selectedItem.value = props.modelValue
    emit('cancel')
  }
</script>

<template>
  <RModalDialog
    v-model:visible="dialogVisible"
    :title="title"
    :width="width"
    :positive-text="confirmText"
    :negative-text="cancelText"
    :loading="activeState?.loading ?? false"
    :show-footer="true"
    :data-testid="dataTestId"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="r-resource-picker" :data-testid="`${dataTestId}-body`">
      <div class="r-resource-picker__tabs" role="tablist" aria-label="资源类型">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="r-resource-picker__tab"
          :class="{ 'r-resource-picker__tab--active': activeTabKey === tab.key }"
          :aria-selected="activeTabKey === tab.key"
          :data-testid="`${dataTestId}-tab-${tab.key}`"
          @click="activateTab(tab.key)"
        >
          <span class="r-resource-picker__tab-label">{{ tab.label }}</span>
          <span v-if="tab.description" class="r-resource-picker__tab-desc">
            {{ tab.description }}
          </span>
        </button>
      </div>

      <div v-if="activeTab && activeState" class="r-resource-picker__panel" role="tabpanel">
        <div class="r-resource-picker__toolbar">
          <NInput
            v-model:value="activeState.keyword"
            clearable
            :placeholder="activeTab.searchPlaceholder || '快速搜索资源'"
            :disabled="activeState.loading"
            :data-testid="`${dataTestId}-search`"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <RIcon name="search" :size="16" />
            </template>
          </NInput>
          <NSpace size="small">
            <slot
              name="toolbar"
              :tab="activeTab"
              :keyword="activeState.keyword"
              :loading="activeState.loading"
              :loaded="activeState.loaded"
              :reload="handleReload"
            />
            <NButton
              type="primary"
              :disabled="activeState.loading"
              :data-testid="`${dataTestId}-search-button`"
              @click="handleSearch"
            >
              搜索
            </NButton>
            <NButton
              :disabled="activeState.loading"
              :data-testid="`${dataTestId}-reload-button`"
              @click="handleReload"
            >
              刷新
            </NButton>
          </NSpace>
        </div>

        <div v-if="activeTab.filters?.length" class="r-resource-picker__filters">
          <div v-for="criterion in activeTab.filters" :key="criterion.key" class="r-resource-picker__filter">
            <span class="r-resource-picker__filter-label">{{ criterion.label }}</span>
            <NSelect
              v-if="criterion.type === 'select'"
              :value="filterValue(criterion.key)"
              :options="criterion.options ?? []"
              :placeholder="criterion.placeholder"
              :clearable="criterion.clearable !== false"
              :disabled="activeState.loading"
              @update:value="handleFilterChange(criterion, $event)"
            />
            <NInput
              v-else
              :value="String(activeState.filters[criterion.key] ?? '')"
              :placeholder="criterion.placeholder"
              :clearable="criterion.clearable !== false"
              :disabled="activeState.loading"
              @update:value="handleFilterChange(criterion, $event)"
              @keyup.enter="handleFilterSearch"
            />
          </div>
          <NButton :disabled="activeState.loading" @click="handleFilterSearch">筛选</NButton>
          <NButton
            v-if="activeTab.filters?.length"
            :disabled="activeState.loading"
            @click="handleFilterReset"
          >
            重置
          </NButton>
        </div>

        <NAlert v-if="activeState.error" type="error" :bordered="false">
          <div class="r-resource-picker__error">
            <span>{{ activeState.error }}</span>
            <NButton size="small" @click="handleReload">重试</NButton>
          </div>
        </NAlert>

        <NSpin :show="activeState.loading">
          <RDataTable
            v-if="tableView"
            :columns="activeTab.tableColumns ?? []"
            :data="activeState.items as (ResourcePickerItem & Record<string, unknown>)[]"
            :loading="activeState.loading"
            :selectable="true"
            :checked-row-keys="selectedItem ? [selectedItem.id] : []"
            :pagination="{ page: activeState.page, pageSize: activeState.pageSize, total: activeState.total, pageSizes: [12, 24, 48] }"
            :remote="true"
            :empty-text="emptyText"
            row-key="id"
            density="compact"
            @update:checked-row-keys="selectTableRows"
            @row-click="selectTableRow"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
          <div
            v-else-if="activeState.items.length > 0"
            class="r-resource-picker__grid"
            :style="gridStyle"
          >
            <div
              v-for="item in activeState.items"
              :key="item.id"
              class="r-resource-picker__card"
              :class="{
                'r-resource-picker__card--selected': selectedKey === item.id,
                'r-resource-picker__card--disabled': item.disabled,
              }"
              role="option"
              :aria-selected="selectedKey === item.id"
              :aria-disabled="item.disabled || undefined"
              tabindex="0"
              :data-testid="`${dataTestId}-card-${item.id}`"
              @click="selectItem(item)"
              @keydown="handleCardKeydown($event, item)"
            >
              <slot
                name="card"
                :item="item"
                :tab="activeTab"
                :selected="selectedKey === item.id"
                :disabled="!!item.disabled"
                :select="() => selectItem(item)"
              >
                <div class="r-resource-picker__fallback-card">
                  <div class="r-resource-picker__fallback-head">
                    <strong>{{ item.title }}</strong>
                    <RIcon v-if="selectedKey === item.id" name="check-circle" :size="18" />
                  </div>
                  <span v-if="item.subtitle" class="r-resource-picker__muted">
                    {{ item.subtitle }}
                  </span>
                  <p v-if="item.description">{{ item.description }}</p>
                  <div v-if="item.tags?.length" class="r-resource-picker__tags">
                    <NTag v-for="tag in item.tags" :key="tag.label" size="small" :type="tag.type">
                      {{ tag.label }}
                    </NTag>
                  </div>
                </div>
              </slot>
            </div>
          </div>
          <NEmpty
            v-else-if="activeState.loaded && !activeState.error"
            :description="emptyText"
            class="r-resource-picker__empty"
          />
          <NEmpty
            v-else-if="!activeState.loading && !activeState.error"
            description="点击搜索或刷新加载当前类型资源"
            class="r-resource-picker__empty"
          />
        </NSpin>

        <div v-if="activeState.total > activeState.pageSize" class="r-resource-picker__pagination">
          <NPagination
            :page="activeState.page"
            :page-size="activeState.pageSize"
            :item-count="activeState.total"
            :page-sizes="[12, 24, 48]"
            show-size-picker
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </div>

      <NEmpty v-else :description="inactiveText" class="r-resource-picker__inactive">
        <template #icon>
          <RIcon name="folder-search" :size="40" />
        </template>
      </NEmpty>
    </div>
  </RModalDialog>
</template>

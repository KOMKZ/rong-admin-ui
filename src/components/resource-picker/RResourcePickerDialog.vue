<script lang="ts" setup>
  import { computed, reactive, ref, watch, type PropType } from 'vue'
  import { NAlert, NButton, NEmpty, NInput, NPagination, NSpace, NSpin, NTag } from 'naive-ui'
  import { RIcon } from '../icon'
  import RModalDialog from '../modal-dialog/RModalDialog.vue'
  import type {
    ResourcePickerConfirmPayload,
    ResourcePickerItem,
    ResourcePickerKey,
    ResourcePickerLoadResult,
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
    total: number
    items: ResourcePickerItem[]
    requestId: number
  }

  const props = defineProps({
    visible: { type: Boolean, required: true },
    modelValue: { type: Object as PropType<ResourcePickerItem | null>, default: null },
    tabs: { type: Array as PropType<ResourcePickerTab[]>, required: true },
    title: { type: String, default: '选择资源' },
    width: { type: [Number, String] as PropType<number | string>, default: 1040 },
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

  function selectItem(item: ResourcePickerItem): void {
    if (item.disabled || !activeTab.value) return
    selectedItem.value = item
    emit('select', item, activeTab.value.key)
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

        <NAlert v-if="activeState.error" type="error" :bordered="false">
          <div class="r-resource-picker__error">
            <span>{{ activeState.error }}</span>
            <NButton size="small" @click="handleReload">重试</NButton>
          </div>
        </NAlert>

        <NSpin :show="activeState.loading">
          <div
            v-if="activeState.items.length > 0"
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

<style scoped>
  .r-resource-picker {
    display: flex;
    flex-direction: column;
    gap: var(--ra-spacing-4);
    min-height: 520px;
  }

  .r-resource-picker__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ra-spacing-2);
  }

  .r-resource-picker__tab {
    min-width: 132px;
    min-height: 48px;
    padding: var(--ra-spacing-2) var(--ra-spacing-3);
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-surface);
    color: var(--ra-color-text-primary);
    text-align: left;
    cursor: pointer;
    transition: all var(--ra-transition-fast);
  }

  .r-resource-picker__tab:hover {
    border-color: var(--ra-color-brand-light);
    color: var(--ra-color-brand-primary);
  }

  .r-resource-picker__tab:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-resource-picker__tab--active {
    border-color: var(--ra-color-brand-primary);
    background: var(--ra-color-brand-subtle);
  }

  .r-resource-picker__tab-label,
  .r-resource-picker__tab-desc {
    display: block;
  }

  .r-resource-picker__tab-label {
    font-size: var(--ra-font-size-sm);
    font-weight: var(--ra-font-weight-semibold);
  }

  .r-resource-picker__tab-desc {
    margin-top: var(--ra-spacing-1);
    font-size: var(--ra-font-size-xs);
    color: var(--ra-color-text-secondary);
  }

  .r-resource-picker__panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--ra-spacing-4);
  }

  .r-resource-picker__toolbar {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) auto;
    gap: var(--ra-spacing-3);
    align-items: center;
  }

  .r-resource-picker__grid {
    display: grid;
    gap: var(--ra-spacing-3);
  }

  .r-resource-picker__card {
    min-height: 156px;
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-surface);
    cursor: pointer;
    transition: all var(--ra-transition-fast);
  }

  .r-resource-picker__card:hover {
    border-color: var(--ra-color-brand-light);
    box-shadow: var(--ra-shadow-sm);
  }

  .r-resource-picker__card:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-resource-picker__card--selected {
    border-color: var(--ra-color-brand-primary);
    background: var(--ra-color-brand-subtle);
  }

  .r-resource-picker__card--disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .r-resource-picker__fallback-card {
    display: flex;
    flex-direction: column;
    gap: var(--ra-spacing-2);
    height: 100%;
    padding: var(--ra-spacing-3);
  }

  .r-resource-picker__fallback-head,
  .r-resource-picker__error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-2);
  }

  .r-resource-picker__fallback-card p {
    margin: 0;
    color: var(--ra-color-text-secondary);
    font-size: var(--ra-font-size-sm);
    line-height: var(--ra-line-height-base);
  }

  .r-resource-picker__muted {
    color: var(--ra-color-text-secondary);
    font-size: var(--ra-font-size-xs);
  }

  .r-resource-picker__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ra-spacing-1);
    margin-top: auto;
  }

  .r-resource-picker__empty,
  .r-resource-picker__inactive {
    padding: var(--ra-spacing-8) 0;
  }

  .r-resource-picker__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--ra-spacing-2);
  }

  @media (max-width: 768px) {
    .r-resource-picker {
      min-height: 460px;
    }

    .r-resource-picker__toolbar {
      grid-template-columns: 1fr;
    }

    .r-resource-picker__pagination {
      justify-content: flex-start;
      overflow-x: auto;
    }
  }
</style>

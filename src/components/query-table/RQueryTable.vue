<script lang="ts" setup>
import { ref, onMounted, type PropType } from 'vue'
import { NSpace, NButton } from 'naive-ui'
import { default as RDataTable } from '../data-table/RDataTable.vue'
import { default as RFormRenderer } from '../form-renderer/RFormRenderer.vue'
import type { DataTableColumn, DataTableRowKey, DataTableSortState } from '../data-table/types'
import type { FormFieldSchema } from '../form-renderer/types'
import type { QueryTableFetchParams, QueryTableFetchResult, QueryTableExpose } from './types'

const props = defineProps({
  columns: { type: Array as PropType<DataTableColumn[]>, required: true },
  querySchema: { type: Array as PropType<FormFieldSchema[]>, default: () => [] },
  fetchData: {
    type: Function as PropType<(p: QueryTableFetchParams) => Promise<QueryTableFetchResult>>,
    required: true,
  },
  rowKey: {
    type: [String, Function] as PropType<
      string | ((row: Record<string, unknown>) => DataTableRowKey)
    >,
    default: 'id',
  },
  selectable: { type: Boolean, default: false },
  defaultPageSize: { type: Number, default: 10 },
  pageSizes: { type: Array as PropType<number[]>, default: () => [10, 20, 50] },
  autoLoad: { type: Boolean, default: true },
  bordered: { type: Boolean, default: true },
  striped: { type: Boolean, default: false },
})

const loading = ref(false)
const data = ref<Record<string, unknown>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(props.defaultPageSize)
const queryModel = ref<Record<string, unknown>>(buildDefaultQuery())
const checkedKeys = ref<DataTableRowKey[]>([])
const sortState = ref<DataTableSortState>({ columnKey: '', order: false })

function buildDefaultQuery(): Record<string, unknown> {
  const m: Record<string, unknown> = {}
  for (const field of props.querySchema) {
    m[field.key] = field.defaultValue ?? null
  }
  return m
}

async function doFetch(): Promise<void> {
  loading.value = true
  try {
    const result = await props.fetchData({
      page: page.value,
      pageSize: pageSize.value,
      query: { ...queryModel.value },
      sort: sortState.value.columnKey ? sortState.value : undefined,
    })
    data.value = result.data
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  void doFetch()
}

function handleReset(): void {
  queryModel.value = buildDefaultQuery()
  page.value = 1
  sortState.value = { columnKey: '', order: false }
  void doFetch()
}

function handlePageChange(p: number): void {
  page.value = p
  void doFetch()
}

function handlePageSizeChange(s: number): void {
  pageSize.value = s
  page.value = 1
  void doFetch()
}

function handleSortChange(sort: DataTableSortState): void {
  sortState.value = sort
  void doFetch()
}

const expose: QueryTableExpose = {
  reload: doFetch,
  resetQuery: handleReset,
  getCheckedKeys: () => [...checkedKeys.value],
  clearSelection: () => {
    checkedKeys.value = []
  },
}

defineExpose(expose)

onMounted(() => {
  if (props.autoLoad) void doFetch()
})
</script>

<template>
  <div class="r-query-table" data-testid="query-table">
    <!-- Query Form -->
    <div v-if="querySchema.length > 0" class="r-query-table__form">
      <RFormRenderer
        :schema="querySchema"
        :model="queryModel"
        :cols="3"
        label-placement="left"
        :label-width="80"
        size="small"
        @update:model="(m: Record<string, unknown>) => (queryModel = m)"
        @submit="handleSearch"
      >
        <template #actions>
          <NSpace justify="end" style="margin-top: 4px">
            <NButton size="small" @click="handleReset">重置</NButton>
            <NButton size="small" type="primary" @click="handleSearch">搜索</NButton>
          </NSpace>
        </template>
      </RFormRenderer>
    </div>

    <!-- Toolbar -->
    <div v-if="$slots.toolbar" class="r-query-table__toolbar">
      <slot name="toolbar" :checked-keys="checkedKeys" :reload="doFetch" />
    </div>

    <!-- Table -->
    <RDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :row-key="rowKey"
      :selectable="selectable"
      :checked-row-keys="checkedKeys"
      :bordered="bordered"
      :striped="striped"
      :pagination="{ page, pageSize, total, pageSizes }"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @update:checked-row-keys="(keys: DataTableRowKey[]) => (checkedKeys = keys)"
      @update:sort="handleSortChange"
    />
  </div>
</template>

<style scoped>
.r-query-table__form {
  margin-bottom: var(--ra-spacing-4);
  padding: var(--ra-spacing-4);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
}
.r-query-table__toolbar {
  margin-bottom: 12px;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from 'vue'
import { NButton, NInput } from 'naive-ui'
import { RIcon } from '../icon'
import RDashboardBuilder from './RDashboardBuilder.vue'
import type {
  DashboardWidgetRegistryEntry,
  DashboardDefinition,
  DashboardExportPayload,
  DashboardLayoutItem,
  DashboardResponsiveColumns,
  DashboardWorkspaceAdapter,
} from './types'
import { createDashboardExportPayload, parseDashboardImportPayload } from './workspace-io'

const props = withDefaults(
  defineProps<{
    adapter: DashboardWorkspaceAdapter
    widgetRegistry?: Record<string, Component | DashboardWidgetRegistryEntry>
    columns?: number
    breakpointColumns?: Partial<DashboardResponsiveColumns>
    activeDashboardId?: string
    defaultEditing?: boolean
    readonly?: boolean
  }>(),
  {
    widgetRegistry: () => ({}),
    columns: 12,
    breakpointColumns: () => ({}),
    defaultEditing: false,
    readonly: false,
  },
)

const emit = defineEmits<{
  saved: [payload: { dashboard: DashboardDefinition; layout: DashboardLayoutItem[] }]
  error: [error: Error]
  change: [dashboard: DashboardDefinition]
  'update:activeDashboardId': [dashboardId: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const loading = ref(true)
const dashboards = ref<DashboardDefinition[]>([])
const currentDashboardId = ref('')
const refreshToken = ref(0)
const feedback = ref('')
const createName = ref('')
const latestLayout = ref<DashboardLayoutItem[]>([])
const editingMode = ref(props.defaultEditing && !props.readonly)
const dashboardNameDraft = ref('')
const dashboardDescriptionDraft = ref('')

const activeDashboard = computed(
  () => dashboards.value.find((item) => item.id === currentDashboardId.value) || null,
)

const builderAdapter = computed(() => ({
  loadLayout: async () => {
    if (!activeDashboard.value) return []
    return props.adapter.loadLayout(activeDashboard.value.id)
  },
  saveLayout: async (layout: DashboardLayoutItem[]) => {
    if (!activeDashboard.value) return
    await props.adapter.saveLayout(activeDashboard.value.id, layout)
    emit('saved', { dashboard: activeDashboard.value, layout })
  },
  listWidgets: props.adapter.listWidgets,
}))

const builderKey = computed(() => `${currentDashboardId.value}-${refreshToken.value}`)

function setFeedback(text: string): void {
  feedback.value = text
  setTimeout(() => {
    if (feedback.value === text) feedback.value = ''
  }, 2600)
}

function syncDashboardMetaDraft(): void {
  dashboardNameDraft.value = activeDashboard.value?.name || ''
  dashboardDescriptionDraft.value = activeDashboard.value?.description || ''
}

async function reloadDashboards(): Promise<void> {
  loading.value = true
  try {
    let list = await props.adapter.listDashboards()
    if (!list.length) {
      const created = await props.adapter.createDashboard({ name: '默认仪表盘' })
      await props.adapter.saveLayout(created.id, [])
      list = [created]
    }
    dashboards.value = list

    if (
      props.activeDashboardId &&
      dashboards.value.some((item) => item.id === props.activeDashboardId)
    ) {
      currentDashboardId.value = props.activeDashboardId
    }

    if (
      !currentDashboardId.value ||
      !dashboards.value.some((item) => item.id === currentDashboardId.value)
    ) {
      currentDashboardId.value = dashboards.value[0].id
    }

    if (activeDashboard.value) {
      emit('change', activeDashboard.value)
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('加载仪表盘失败')
    emit('error', error)
  } finally {
    loading.value = false
  }
}

function nextDashboardName(): string {
  const base = '未命名仪表盘'
  let index = dashboards.value.length + 1
  let name = `${base} ${index}`
  const used = new Set(dashboards.value.map((item) => item.name))
  while (used.has(name)) {
    index += 1
    name = `${base} ${index}`
  }
  return name
}

async function createBlankDashboard(): Promise<void> {
  try {
    const name = createName.value.trim() || nextDashboardName()
    const created = await props.adapter.createDashboard({ name })
    await props.adapter.saveLayout(created.id, [])
    dashboards.value = [...dashboards.value, created]
    currentDashboardId.value = created.id
    emit('update:activeDashboardId', created.id)
    refreshToken.value += 1
    createName.value = ''
    setFeedback(`已创建：${created.name}`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('创建仪表盘失败')
    emit('error', error)
  }
}

async function deleteCurrentDashboard(): Promise<void> {
  if (!activeDashboard.value || props.readonly) return
  const deleting = activeDashboard.value
  try {
    await props.adapter.deleteDashboard(deleting.id)
    dashboards.value = dashboards.value.filter((item) => item.id !== deleting.id)
    if (!dashboards.value.length) {
      const fallback = await props.adapter.createDashboard({ name: '默认仪表盘' })
      await props.adapter.saveLayout(fallback.id, [])
      dashboards.value = [fallback]
    }
    currentDashboardId.value = dashboards.value[0].id
    emit('update:activeDashboardId', dashboards.value[0].id)
    refreshToken.value += 1
    setFeedback(`已删除：${deleting.name}`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('删除仪表盘失败')
    emit('error', error)
  }
}

function triggerImport(): void {
  if (props.readonly) return
  fileInputRef.value?.click()
}

function downloadJson(filename: string, payload: DashboardExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function exportCurrentDashboard(): Promise<void> {
  if (!activeDashboard.value) return
  try {
    const layout = latestLayout.value.length
      ? latestLayout.value
      : await props.adapter.loadLayout(activeDashboard.value.id)
    const payload = createDashboardExportPayload(activeDashboard.value, layout)
    const fileName = `${activeDashboard.value.name.replace(/\s+/g, '-').toLowerCase()}.json`
    downloadJson(fileName, payload)
    setFeedback(`已导出：${activeDashboard.value.name}`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('导出仪表盘失败')
    emit('error', error)
  }
}

async function handleImportFile(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const parsed = parseDashboardImportPayload(text)
    const created = await props.adapter.createDashboard({
      name: parsed.dashboard.name || nextDashboardName(),
      description: parsed.dashboard.description,
    })
    await props.adapter.saveLayout(created.id, parsed.layout)
    dashboards.value = [...dashboards.value, created]
    currentDashboardId.value = created.id
    emit('update:activeDashboardId', created.id)
    refreshToken.value += 1
    setFeedback(`已导入：${created.name}`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('导入仪表盘 JSON 失败')
    emit('error', error)
  }
}

watch(
  () => props.activeDashboardId,
  (next) => {
    if (!next) return
    if (!dashboards.value.some((item) => item.id === next)) return
    if (currentDashboardId.value === next) return
    currentDashboardId.value = next
    refreshToken.value += 1
  },
)

watch(currentDashboardId, () => {
  latestLayout.value = []
  syncDashboardMetaDraft()
  emit('update:activeDashboardId', currentDashboardId.value)
  if (activeDashboard.value) {
    emit('change', activeDashboard.value)
  }
})

onMounted(() => {
  void reloadDashboards()
})

watch(
  () => props.readonly,
  (next) => {
    if (next) editingMode.value = false
  },
)

function toggleMode(next: boolean): void {
  if (props.readonly) return
  editingMode.value = next
}

async function saveDashboardMeta(): Promise<void> {
  if (!activeDashboard.value) return
  const name = dashboardNameDraft.value.trim()
  if (!name) {
    setFeedback('仪表盘标题不能为空')
    return
  }

  const description = dashboardDescriptionDraft.value.trim() || undefined
  try {
    if (props.adapter.updateDashboard) {
      const updated = await props.adapter.updateDashboard({
        dashboardId: activeDashboard.value.id,
        name,
        description,
      })
      dashboards.value = dashboards.value.map((item) => (item.id === updated.id ? updated : item))
    } else {
      dashboards.value = dashboards.value.map((item) =>
        item.id === activeDashboard.value?.id
          ? {
              ...item,
              name,
              description,
              updatedAt: new Date().toISOString(),
            }
          : item,
      )
    }
    syncDashboardMetaDraft()
    if (activeDashboard.value) {
      emit('change', activeDashboard.value)
    }
    setFeedback('仪表盘信息已保存')
  } catch (err) {
    const error = err instanceof Error ? err : new Error('保存仪表盘信息失败')
    emit('error', error)
  }
}
</script>

<template>
  <div class="r-dashboard-workspace" data-testid="dashboard-workspace">
    <div class="r-dashboard-workspace__header">
      <div class="r-dashboard-workspace__tabs" data-testid="dashboard-tabs">
        <button
          v-for="item in dashboards"
          :key="item.id"
          class="r-dashboard-workspace__tab"
          :class="{ 'r-dashboard-workspace__tab--active': item.id === currentDashboardId }"
          type="button"
          data-testid="dashboard-tab"
          @click="currentDashboardId = item.id"
        >
          <RIcon name="layout-grid" :size="14" />
          <span>{{ item.name }}</span>
        </button>
      </div>

      <div class="r-dashboard-workspace__actions">
        <div
          v-if="!readonly"
          class="r-dashboard-workspace__mode-switch"
          data-testid="dashboard-mode-switch"
        >
          <button
            class="r-dashboard-workspace__mode-btn"
            :class="{ 'r-dashboard-workspace__mode-btn--active': !editingMode }"
            type="button"
            @click="toggleMode(false)"
          >
            正常模式
          </button>
          <button
            class="r-dashboard-workspace__mode-btn"
            :class="{ 'r-dashboard-workspace__mode-btn--active': editingMode }"
            type="button"
            @click="toggleMode(true)"
          >
            编辑模式
          </button>
        </div>

        <template v-if="editingMode && !readonly">
          <NInput v-model:value="createName" size="small" placeholder="新仪表盘标题" />
          <NButton
            size="small"
            type="primary"
            data-testid="dashboard-create"
            @click="createBlankDashboard"
          >
            <template #icon><RIcon name="plus-circle" :size="14" /></template>
            新建
          </NButton>
          <NButton size="small" data-testid="dashboard-export" @click="exportCurrentDashboard">
            <template #icon><RIcon name="download" :size="14" /></template>
            导出 JSON
          </NButton>
          <NButton size="small" data-testid="dashboard-import" @click="triggerImport">
            <template #icon><RIcon name="upload" :size="14" /></template>
            导入 JSON
          </NButton>
          <NButton
            size="small"
            :disabled="readonly || dashboards.length <= 1"
            data-testid="dashboard-delete"
            @click="deleteCurrentDashboard"
          >
            <template #icon><RIcon name="trash" :size="14" /></template>
            删除
          </NButton>
        </template>
      </div>
    </div>

    <div
      v-if="activeDashboard"
      class="r-dashboard-workspace__meta"
      data-testid="dashboard-meta-panel"
    >
      <NInput
        v-model:value="dashboardNameDraft"
        size="small"
        :disabled="!editingMode || readonly"
        placeholder="仪表盘标题"
      />
      <NInput
        v-model:value="dashboardDescriptionDraft"
        size="small"
        :disabled="!editingMode || readonly"
        placeholder="仪表盘描述（可选）"
      />
      <NButton
        v-if="editingMode && !readonly"
        size="small"
        data-testid="dashboard-meta-save"
        @click="saveDashboardMeta"
      >
        <template #icon><RIcon name="save" :size="14" /></template>
        保存信息
      </NButton>
    </div>

    <div
      v-if="feedback"
      class="r-dashboard-workspace__feedback"
      data-testid="dashboard-workspace-feedback"
    >
      {{ feedback }}
    </div>

    <div
      v-if="loading"
      class="r-dashboard-workspace__loading"
      data-testid="dashboard-workspace-loading"
    >
      <RIcon name="loader" :size="16" />
      <span>正在加载仪表盘工作区...</span>
    </div>

    <RDashboardBuilder
      v-else-if="activeDashboard"
      :key="builderKey"
      :adapter="builderAdapter"
      :widget-registry="widgetRegistry"
      :columns="columns"
      :breakpoint-columns="breakpointColumns"
      :default-editing="defaultEditing"
      :editing="editingMode"
      :readonly="readonly"
      data-testid="dashboard-workspace-builder"
      @layout-change="latestLayout = $event"
      @error="$emit('error', $event)"
    />

    <input
      ref="fileInputRef"
      class="r-dashboard-workspace__file"
      type="file"
      accept="application/json"
      @change="handleImportFile"
    />
  </div>
</template>

<style scoped>
.r-dashboard-workspace {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
}

.r-dashboard-workspace__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ra-spacing-3);
  flex-wrap: wrap;
}

.r-dashboard-workspace__tabs {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  flex-wrap: wrap;
}

.r-dashboard-workspace__tab {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-secondary);
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  font-size: var(--ra-font-size-xs);
  cursor: pointer;
}

.r-dashboard-workspace__tab--active {
  border-color: var(--ra-color-border-interactive);
  background: var(--ra-color-brand-subtle);
  color: var(--ra-color-brand-primary);
}

.r-dashboard-workspace__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  flex-wrap: wrap;
}

.r-dashboard-workspace__mode-switch {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  overflow: hidden;
}

.r-dashboard-workspace__mode-btn {
  border: none;
  background: var(--ra-color-bg-surface);
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-xs);
  padding: var(--ra-spacing-1) var(--ra-spacing-2);
  cursor: pointer;
}

.r-dashboard-workspace__mode-btn + .r-dashboard-workspace__mode-btn {
  border-left: 1px solid var(--ra-color-border-default);
}

.r-dashboard-workspace__mode-btn--active {
  background: var(--ra-color-brand-subtle);
  color: var(--ra-color-brand-primary);
  font-weight: var(--ra-font-weight-semibold);
}

.r-dashboard-workspace__meta {
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  gap: var(--ra-spacing-2);
}

.r-dashboard-workspace__feedback {
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: var(--ra-color-bg-surface-secondary);
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-xs);
  padding: var(--ra-spacing-2) var(--ra-spacing-3);
}

.r-dashboard-workspace__loading {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  color: var(--ra-color-text-secondary);
  font-size: var(--ra-font-size-sm);
}

.r-dashboard-workspace__file {
  display: none;
}

@media (max-width: 900px) {
  .r-dashboard-workspace__actions {
    width: 100%;
  }

  .r-dashboard-workspace__meta {
    grid-template-columns: 1fr;
  }
}
</style>

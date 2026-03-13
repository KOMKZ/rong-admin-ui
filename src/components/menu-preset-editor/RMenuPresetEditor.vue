<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TreeOption } from 'naive-ui'
import { NButton } from 'naive-ui'
import { NTooltip } from 'naive-ui'
import {
  Pencil as PencilIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
} from 'lucide-vue-next'
import type {
  MenuPreset,
  MenuPresetEditorProps,
  MenuPresetItem,
  MenuPresetSavePayload,
} from './types'

const props = withDefaults(defineProps<MenuPresetEditorProps>(), {
  defaultPresetId: '',
  loading: false,
})

const emit = defineEmits<{
  'update:activePresetId': [presetId: string]
  'create-preset': [name: string]
  'delete-preset': [presetId: string]
  'set-default-preset': [presetId: string]
  'save-preset': [payload: MenuPresetSavePayload]
}>()

const selectedKeys = ref<Array<string | number>>([])
const keyword = ref('')
const showCreateModal = ref(false)
const showNodeEditModal = ref(false)
const newPresetName = ref('')
const draftItems = ref<MenuPresetItem[]>([])
const editTargetId = ref<string | number | null>(null)
const editForm = ref({
  title: '',
  icon: '',
  hidden: false,
})

const activePreset = computed<MenuPreset | null>(() => {
  return props.presets.find((preset) => preset.id === props.activePresetId) || null
})

const canDeleteActivePreset = computed(() => {
  if (!activePreset.value) return false
  if (activePreset.value.readonly) return false
  return activePreset.value.id !== props.defaultPresetId
})

const isActiveDefault = computed(() => {
  if (!activePreset.value) return false
  return activePreset.value.id === props.defaultPresetId
})

const hasDirty = computed(() => {
  if (!activePreset.value) return false
  return serializeItems(activePreset.value.items) !== serializeItems(draftItems.value)
})

const treeData = computed<TreeOption[]>(() => {
  return toTreeOptions(draftItems.value)
})

watch(
  () => props.activePresetId,
  () => {
    resetDraftFromActive()
  },
  { immediate: true },
)

watch(
  () => props.presets,
  () => {
    resetDraftFromActive()
  },
  { deep: true },
)

function cloneItems(items: MenuPresetItem[]): MenuPresetItem[] {
  return items.map((item) => ({
    ...item,
    meta: item.meta ? { ...item.meta } : undefined,
    children: item.children ? cloneItems(item.children) : undefined,
  }))
}

function resetDraftFromActive(): void {
  selectedKeys.value = []
  keyword.value = ''
  draftItems.value = activePreset.value ? cloneItems(activePreset.value.items) : []
}

function normalizeTree(items: MenuPresetItem[], parentId: string | number | null = null): MenuPresetItem[] {
  return items.map((item, index) => ({
    ...item,
    parentId,
    orderNum: index + 1,
    children: item.children?.length ? normalizeTree(item.children, item.id) : undefined,
  }))
}

function touchDraft(): void {
  draftItems.value = normalizeTree(cloneItems(draftItems.value))
}

function serializeItems(items: MenuPresetItem[]): string {
  return JSON.stringify(
    normalizeTree(cloneItems(items)).map((item) => normalizeSerializable(item)),
  )
}

function normalizeSerializable(item: MenuPresetItem): Record<string, unknown> {
  return {
    id: item.id,
    parentId: item.parentId,
    name: item.name,
    path: item.path,
    icon: item.icon || '',
    orderNum: item.orderNum || 0,
    hidden: Boolean(item.hidden),
    title: String(item.meta?.title || ''),
    children: (item.children || []).map((child) => normalizeSerializable(child)),
  }
}

function toTreeOptions(items: MenuPresetItem[]): TreeOption[] {
  return items.map((item) => ({
    key: item.id,
    label: `${String(item.meta?.title || item.name)} · ${item.path}`,
    children: item.children?.length ? toTreeOptions(item.children) : undefined,
  }))
}

function findNodeById(items: MenuPresetItem[], id: string | number): MenuPresetItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item
    }
    if (item.children?.length) {
      const found = findNodeById(item.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

function removeNodeById(items: MenuPresetItem[], id: string | number): MenuPresetItem | null {
  const index = items.findIndex((item) => item.id === id)
  if (index >= 0) {
    const [removed] = items.splice(index, 1)
    return removed
  }
  for (const item of items) {
    if (!item.children?.length) continue
    const removed = removeNodeById(item.children, id)
    if (removed) return removed
  }
  return null
}

function findChildrenList(items: MenuPresetItem[], id: string | number): MenuPresetItem[] | null {
  for (const item of items) {
    if (item.id === id) {
      if (!item.children) item.children = []
      return item.children
    }
    if (!item.children?.length) continue
    const found = findChildrenList(item.children, id)
    if (found) return found
  }
  return null
}

function handleDrop(payload: {
  node: TreeOption
  dragNode: TreeOption
  dropPosition: 'before' | 'inside' | 'after'
}): void {
  const dragId = payload.dragNode.key as string | number
  const targetId = payload.node.key as string | number
  if (dragId === targetId) return

  const removedNode = removeNodeById(draftItems.value, dragId)
  if (!removedNode) return

  if (payload.dropPosition === 'inside') {
    const children = findChildrenList(draftItems.value, targetId)
    if (children) {
      children.push(removedNode)
    }
  } else {
    const siblings = findParentSiblings(draftItems.value, targetId)
    if (!siblings) return
    const targetIndex = siblings.findIndex((item) => item.id === targetId)
    if (targetIndex < 0) return
    const insertIndex = payload.dropPosition === 'before' ? targetIndex : targetIndex + 1
    siblings.splice(insertIndex, 0, removedNode)
  }

  touchDraft()
}

function findParentSiblings(items: MenuPresetItem[], id: string | number): MenuPresetItem[] | null {
  const targetIndex = items.findIndex((item) => item.id === id)
  if (targetIndex >= 0) {
    return items
  }
  for (const item of items) {
    if (!item.children?.length) continue
    const found = findParentSiblings(item.children, id)
    if (found) return found
  }
  return null
}

function handleSelect(keys: Array<string | number>): void {
  selectedKeys.value = keys
}

function findSiblingsAndIndex(
  items: MenuPresetItem[],
  id: string | number,
): { siblings: MenuPresetItem[]; index: number } | null {
  const index = items.findIndex((item) => item.id === id)
  if (index >= 0) {
    return { siblings: items, index }
  }
  for (const item of items) {
    if (!item.children?.length) continue
    const result = findSiblingsAndIndex(item.children, id)
    if (result) return result
  }
  return null
}

function moveNode(id: string | number, direction: 'up' | 'down'): void {
  const found = findSiblingsAndIndex(draftItems.value, id)
  if (!found) return
  const targetIndex = direction === 'up' ? found.index - 1 : found.index + 1
  if (targetIndex < 0 || targetIndex >= found.siblings.length) return
  const [node] = found.siblings.splice(found.index, 1)
  found.siblings.splice(targetIndex, 0, node)
  touchDraft()
}

function toggleNodeHidden(id: string | number): void {
  const node = findNodeById(draftItems.value, id)
  if (!node) return
  node.hidden = !node.hidden
  touchDraft()
}

function openNodeEditModal(id: string | number): void {
  const node = findNodeById(draftItems.value, id)
  if (!node) return
  editTargetId.value = id
  editForm.value = {
    title: String(node.meta?.title ?? node.name),
    icon: node.icon || '',
    hidden: Boolean(node.hidden),
  }
  showNodeEditModal.value = true
}

function saveNodeEdit(): void {
  if (editTargetId.value == null) return
  const node = findNodeById(draftItems.value, editTargetId.value)
  if (!node) return
  node.meta = {
    ...(node.meta || {}),
    title: editForm.value.title,
  }
  node.icon = editForm.value.icon.trim()
  node.hidden = editForm.value.hidden
  touchDraft()
  showNodeEditModal.value = false
}

function renderTreeLabel({ option }: { option: TreeOption }) {
  const node = findNodeById(draftItems.value, option.key as string | number)
  if (!node) {
    return String(option.label || '')
  }
  const nodeId = option.key as string | number
  const siblingsInfo = findSiblingsAndIndex(draftItems.value, nodeId)
  const canMoveUp = Boolean(siblingsInfo && siblingsInfo.index > 0)
  const canMoveDown = Boolean(siblingsInfo && siblingsInfo.index < siblingsInfo.siblings.length - 1)

  const actionButton = (
    label: string,
    icon: typeof PencilIcon,
    onClick: () => void,
    disabled = false,
    variantClass = '',
  ) => {
    return h(
      NTooltip,
      null,
      {
        trigger: () =>
          h(
            NButton,
            {
              size: 'tiny',
              quaternary: true,
              circle: true,
              disabled,
              class: ['menu-node-action', variantClass],
              'aria-label': label,
              onClick: (event: MouseEvent) => {
                event.stopPropagation()
                if (disabled) return
                onClick()
              },
            },
            {
              icon: () => h(icon, { size: 14 }),
            },
          ),
        default: () => label,
      },
    )
  }

  return h('div', { class: 'menu-node' }, [
    h('div', { class: 'menu-node-actions' }, [
      actionButton('编辑', PencilIcon, () => openNodeEditModal(nodeId), false, 'menu-node-action--edit'),
      actionButton(
        node.hidden ? '当前隐藏，点击显示' : '当前显示，点击隐藏',
        node.hidden ? EyeOffIcon : EyeIcon,
        () => toggleNodeHidden(nodeId),
        false,
        node.hidden ? 'menu-node-action--hidden' : 'menu-node-action--visible',
      ),
      actionButton('上移', ArrowUpIcon, () => moveNode(nodeId, 'up'), !canMoveUp, 'menu-node-action--move'),
      actionButton('下移', ArrowDownIcon, () => moveNode(nodeId, 'down'), !canMoveDown, 'menu-node-action--move'),
    ]),
    h('span', { class: 'menu-node__title' }, String(node.meta?.title || node.name)),
  ])
}

function handleSave(): void {
  if (!activePreset.value) return
  emit('save-preset', {
    presetId: activePreset.value.id,
    items: cloneItems(draftItems.value),
  })
}

function handleCreatePreset(): void {
  const name = newPresetName.value.trim()
  if (!name) return
  emit('create-preset', name)
  newPresetName.value = ''
  showCreateModal.value = false
}

function handleDeletePreset(): void {
  if (!activePreset.value || !canDeleteActivePreset.value) return
  emit('delete-preset', activePreset.value.id)
}

function handleSetDefault(): void {
  if (!activePreset.value || isActiveDefault.value) return
  emit('set-default-preset', activePreset.value.id)
}

function handlePresetChange(value: string): void {
  emit('update:activePresetId', value)
}

function filterTree(pattern: string, option: TreeOption): boolean {
  if (!pattern) return true
  const text = String(option.label || '').toLowerCase()
  return text.includes(pattern.toLowerCase())
}
</script>

<template>
  <div class="menu-preset-editor" data-testid="menu-preset-editor">
    <div class="menu-preset-editor__toolbar">
      <n-select
        :value="activePresetId"
        :options="presets.map((item) => ({ label: item.name, value: item.id }))"
        size="small"
        class="menu-preset-editor__preset-select"
        @update:value="handlePresetChange"
      />
      <n-space :size="8">
        <n-button size="small" @click="showCreateModal = true">新建组合</n-button>
        <n-button size="small" :disabled="isActiveDefault" @click="handleSetDefault">
          {{ isActiveDefault ? '已是默认' : '设为默认' }}
        </n-button>
        <n-popconfirm @positive-click="handleDeletePreset">
          <template #trigger>
            <n-button size="small" type="error" :disabled="!canDeleteActivePreset">删除组合</n-button>
          </template>
          确认删除当前菜单组合？
        </n-popconfirm>
      </n-space>
    </div>

    <n-alert type="info" class="menu-preset-editor__tip" :show-icon="false">
      支持拖拽排序、切换显隐、编辑标题与图标。默认菜单组合不可删除。
    </n-alert>

    <div class="menu-preset-editor__body">
      <section class="menu-preset-editor__tree-panel">
        <n-input v-model:value="keyword" size="small" clearable placeholder="搜索菜单标题或路径" />
        <n-tree
          class="menu-preset-editor__tree"
          block-line
          selectable
          draggable
          :pattern="keyword"
          :filter="filterTree"
          :data="treeData"
          :render-label="renderTreeLabel"
          :selected-keys="selectedKeys"
          @drop="handleDrop"
          @update:selected-keys="handleSelect"
        />
      </section>
    </div>

    <div class="menu-preset-editor__footer">
      <n-tag :type="hasDirty ? 'warning' : 'success'" size="small">
        {{ hasDirty ? '有未保存改动' : '已同步' }}
      </n-tag>
      <n-space :size="8">
        <n-button size="small" :disabled="!hasDirty" @click="resetDraftFromActive">撤销改动</n-button>
        <n-button type="primary" size="small" :disabled="!hasDirty || loading" :loading="loading" @click="handleSave">
          保存当前组合
        </n-button>
      </n-space>
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="新建菜单组合" class="menu-preset-editor__modal">
      <div class="menu-preset-editor__create-body">
        <n-input
          v-model:value="newPresetName"
          maxlength="30"
          show-count
          placeholder="请输入菜单组合名称"
          @keyup.enter="handleCreatePreset"
        />
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button size="small" @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" size="small" :disabled="!newPresetName.trim()" @click="handleCreatePreset">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showNodeEditModal"
      preset="card"
      title="编辑菜单节点"
      class="menu-preset-editor__modal"
    >
      <div class="menu-preset-editor__create-body menu-preset-editor__field-group">
        <div class="menu-preset-editor__field">
          <span class="menu-preset-editor__label">菜单标题</span>
          <n-input v-model:value="editForm.title" size="small" />
        </div>
        <div class="menu-preset-editor__field">
          <span class="menu-preset-editor__label">图标名称</span>
          <n-input v-model:value="editForm.icon" size="small" placeholder="例如：Mail" />
        </div>
        <div class="menu-preset-editor__field menu-preset-editor__field--inline">
          <span class="menu-preset-editor__label">隐藏菜单</span>
          <n-switch v-model:value="editForm.hidden" />
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button size="small" @click="showNodeEditModal = false">取消</n-button>
          <n-button type="primary" size="small" :disabled="!editForm.title.trim()" @click="saveNodeEdit">
            保存节点
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.menu-preset-editor {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-4, 16px);
}

.menu-preset-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: var(--ra-spacing-3, 12px);
}

.menu-preset-editor__preset-select {
  width: 280px;
}

.menu-preset-editor__tip {
  margin: 0;
}

.menu-preset-editor__body {
  display: block;
}

.menu-preset-editor__tree-panel {
  border: 1px solid var(--ra-color-border-light, #eef0f6);
  border-radius: var(--ra-radius-lg, 12px);
  background: var(--ra-color-bg-surface, #fff);
  padding: var(--ra-spacing-3, 12px);
}

.menu-preset-editor__tree-panel {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3, 12px);
  min-height: 460px;
}

.menu-preset-editor__tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.menu-preset-editor__field {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1, 4px);
}

.menu-preset-editor__field-group {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3, 12px);
}

.menu-preset-editor__field--inline {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.menu-preset-editor__label {
  font-size: var(--ra-font-size-xs, 12px);
  color: var(--ra-color-text-secondary, #4a5068);
}

.menu-preset-editor__path {
  font-size: var(--ra-font-size-xs, 12px);
  color: var(--ra-color-text-tertiary, #6e7389);
  word-break: break-all;
}

.menu-node {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
}

.menu-node__title {
  display: inline-block;
  flex: 0 1 auto;
  color: var(--ra-color-text-primary, #1e2235);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-node-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.menu-preset-editor__tree :deep(.n-tree-node-content__text) {
  display: flex;
  align-items: center;
  min-width: 0;
}

.menu-preset-editor__tree :deep(.n-tree-node-content__text .menu-node) {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}

.menu-node-action {
  height: 24px;
  width: 24px;
  min-width: 24px;
}

.menu-preset-editor__tree :deep(.menu-node-action--edit .n-button__icon) {
  color: var(--ra-color-brand-primary, #6b93f5);
}

.menu-preset-editor__tree :deep(.menu-node-action--visible .n-button__icon) {
  color: var(--ra-color-success, #18a058);
}

.menu-preset-editor__tree :deep(.menu-node-action--hidden .n-button__icon) {
  color: var(--ra-color-text-tertiary, #9094a8);
}

.menu-preset-editor__tree :deep(.menu-node-action--move .n-button__icon) {
  color: var(--ra-color-text-secondary, #4a5068);
}

.menu-preset-editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-preset-editor__modal {
  width: 460px;
}

.menu-preset-editor__create-body {
  padding: var(--ra-spacing-1, 4px) 0;
}

@media (max-width: 900px) {
  .menu-preset-editor__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .menu-preset-editor__preset-select {
    width: 100%;
  }

  .menu-node-actions {
    flex-wrap: wrap;
  }
}
</style>

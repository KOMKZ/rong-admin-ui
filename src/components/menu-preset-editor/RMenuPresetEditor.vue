<script setup lang="ts">
import './RMenuPresetEditor.css'
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

  function normalizeTree(
    items: MenuPresetItem[],
    parentId: string | number | null = null,
  ): MenuPresetItem[] {
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

  function findParentSiblings(
    items: MenuPresetItem[],
    id: string | number,
  ): MenuPresetItem[] | null {
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
    const canMoveDown = Boolean(
      siblingsInfo && siblingsInfo.index < siblingsInfo.siblings.length - 1,
    )

    const actionButton = (
      label: string,
      icon: typeof PencilIcon,
      onClick: () => void,
      disabled = false,
      variantClass = '',
    ) => {
      return h(NTooltip, null, {
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
      })
    }

    return h('div', { class: 'menu-node' }, [
      h('div', { class: 'menu-node-actions' }, [
        actionButton(
          '编辑',
          PencilIcon,
          () => openNodeEditModal(nodeId),
          false,
          'menu-node-action--edit',
        ),
        actionButton(
          node.hidden ? '当前隐藏，点击显示' : '当前显示，点击隐藏',
          node.hidden ? EyeOffIcon : EyeIcon,
          () => toggleNodeHidden(nodeId),
          false,
          node.hidden ? 'menu-node-action--hidden' : 'menu-node-action--visible',
        ),
        actionButton(
          '上移',
          ArrowUpIcon,
          () => moveNode(nodeId, 'up'),
          !canMoveUp,
          'menu-node-action--move',
        ),
        actionButton(
          '下移',
          ArrowDownIcon,
          () => moveNode(nodeId, 'down'),
          !canMoveDown,
          'menu-node-action--move',
        ),
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
void [filterTree, handleCreatePreset, handleDeletePreset, handleDrop, handlePresetChange, handleSave, handleSelect, handleSetDefault, hasDirty, renderTreeLabel, saveNodeEdit, treeData]
</script>

<template src="./RMenuPresetEditor.template.html"></template>


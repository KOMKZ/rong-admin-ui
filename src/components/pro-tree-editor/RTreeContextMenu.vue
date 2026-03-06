<script lang="ts" setup>
import { computed, h, type PropType } from 'vue'
import { NDropdown, type DropdownOption } from 'naive-ui'
import RIcon from '../icon/RIcon.vue'
import type { TreeI18n, TreeNodeData } from './types'
import { DEFAULT_I18N } from './types'

const props = defineProps({
  show: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  node: { type: Object as PropType<TreeNodeData | null>, default: null },
  i18n: { type: Object as PropType<TreeI18n>, default: () => ({}) },
  draggable: { type: Boolean, default: true },
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  action: [key: string, node: TreeNodeData]
}>()

const t = computed(() => ({ ...DEFAULT_I18N, ...props.i18n }))

function renderIcon(name: string): () => ReturnType<typeof h> {
  return () => h(RIcon, { name, size: 14 })
}

const menuOptions = computed<DropdownOption[]>(() => {
  if (!props.node) return []
  return [
    { label: t.value.newSubFolder, key: 'createChild', icon: renderIcon('folder-plus') },
    { label: t.value.newFolder, key: 'createSibling', icon: renderIcon('plus') },
    { type: 'divider', key: 'd1' },
    { label: t.value.rename, key: 'rename', icon: renderIcon('pencil') },
    ...(props.draggable ? [{ label: t.value.move, key: 'move', icon: renderIcon('move') }] : []),
    { type: 'divider', key: 'd2' },
    {
      label: t.value.delete,
      key: 'delete',
      icon: renderIcon('trash-2'),
      props: { class: 'rpte-ctx-danger' },
    },
  ]
})

function handleSelect(key: string): void {
  if (props.node) {
    emit('action', key, props.node)
  }
  emit('update:show', false)
}

function handleClickOutside(): void {
  emit('update:show', false)
}
</script>

<template>
  <NDropdown
    trigger="manual"
    placement="bottom-start"
    :show="show"
    :x="x"
    :y="y"
    :options="menuOptions"
    data-testid="tree-context-menu"
    @select="handleSelect"
    @clickoutside="handleClickOutside"
  />
</template>

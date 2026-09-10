import { defineComponent, h, type PropType as PT } from 'vue'
import RTreeNode from './RTreeNode.vue'
import type {
  DropPosition,
  TreeDensity,
  TreeError,
  TreeI18n,
  TreeNodeData,
  TreeNodeIcons,
} from './types'

export const RTreeNodeRecursive = defineComponent({
  name: 'RTreeNodeRecursive',
  props: {
    node: { type: Object as PT<TreeNodeData>, required: true },
    depth: { type: Number, default: 0 },
    density: { type: String as PT<TreeDensity>, default: 'default' },
    icons: { type: Object as PT<TreeNodeIcons>, default: () => ({}) },
    i18n: { type: Object as PT<TreeI18n>, default: () => ({}) },
    showCounts: { type: Boolean, default: false },
    draggable: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    batchMode: { type: Boolean, default: false },
    selectedKey: { type: [String, Number] as PT<string | number | null>, default: null },
    checkedKeys: { type: Array as PT<(string | number)[]>, default: () => [] },
    expandedKeys: { type: Object as PT<Set<string | number>>, required: true },
    editingNodeId: { type: [String, Number] as PT<string | number | null>, default: null },
    loadingNodeIds: { type: Object as PT<Set<string | number>>, required: true },
    operationErrors: { type: Object as PT<Map<string | number, TreeError>>, required: true },
    dragNodeId: { type: [String, Number] as PT<string | number | null>, default: null },
    searchOps: { type: Object, required: true },
    dndOps: { type: Object, required: true },
  },
  emits: [
    'select',
    'toggle',
    'startEdit',
    'submitEdit',
    'cancelEdit',
    'delete',
    'check',
    'contextmenu',
    'dragstart',
    'dragover',
    'dragend',
    'clearError',
  ],
  setup(props, { emit }) {
    return () => {
      const expanded = props.expandedKeys.has(props.node.id)
      const isVisible = props.searchOps.isNodeVisible(props.node.id)
      if (!isVisible) return null
      const dropInfo = props.dndOps.getDropIndicator(props.node.id)

      const children: ReturnType<typeof h>[] = [
        h(RTreeNode, {
          key: props.node.id,
          node: props.node,
          depth: props.depth,
          expanded,
          selected: props.selectedKey === props.node.id,
          editing: props.editingNodeId === props.node.id,
          loading: props.loadingNodeIds.has(props.node.id),
          dragging: props.dragNodeId === props.node.id,
          disabled: props.node.disabled || false,
          density: props.density,
          icons: props.icons,
          i18n: props.i18n,
          showCounts: props.showCounts,
          draggable: props.draggable,
          selectable: props.selectable,
          checked: props.checkedKeys.includes(props.node.id),
          batchMode: props.batchMode,
          searchMatch: props.searchOps.isMatch(props.node.id),
          highlightRanges: props.searchOps.getHighlightRanges(props.node.label),
          error: props.operationErrors.get(props.node.id) || null,
          dropTarget: dropInfo.isTarget,
          dropPosition: dropInfo.position,
          dropLegal: dropInfo.legal,
          dropReason: dropInfo.reason,
          onToggle: () => emit('toggle', props.node.id),
          onSelect: () => emit('select', props.node.id),
          onStartEdit: () => emit('startEdit', props.node.id),
          onSubmitEdit: (name: string) => emit('submitEdit', props.node.id, name),
          onCancelEdit: () => emit('cancelEdit', props.node.id),
          onDelete: () => emit('delete', props.node),
          onCheck: (checked: boolean) => emit('check', props.node.id, checked),
          onContextmenu: (e: MouseEvent) => emit('contextmenu', e, props.node),
          onDragstart: () => emit('dragstart', props.node.id),
          onDragover: (pos: DropPosition) => emit('dragover', props.node.id, pos),
          onDragend: () => emit('dragend'),
          onRetryError: () => emit('clearError', props.node.id),
        }),
      ]

      if (expanded && props.node.children?.length) {
        for (const child of props.node.children) {
          if (!props.searchOps.isNodeVisible(child.id)) continue
          children.push(
            h(RTreeNodeRecursive, {
              ...props,
              key: child.id,
              node: child,
              depth: props.depth + 1,
              onSelect: (id: string | number) => emit('select', id),
              onToggle: (id: string | number) => emit('toggle', id),
              onStartEdit: (id: string | number) => emit('startEdit', id),
              onSubmitEdit: (id: string | number, name: string) => emit('submitEdit', id, name),
              onCancelEdit: (id: string | number) => emit('cancelEdit', id),
              onDelete: (node: TreeNodeData) => emit('delete', node),
              onCheck: (id: string | number, checked: boolean) => emit('check', id, checked),
              onContextmenu: (e: MouseEvent, node: TreeNodeData) => emit('contextmenu', e, node),
              onDragstart: (id: string | number) => emit('dragstart', id),
              onDragover: (id: string | number, pos: DropPosition) => emit('dragover', id, pos),
              onDragend: () => emit('dragend'),
              onClearError: (id: string | number) => emit('clearError', id),
            }),
          )
        }
      }

      return children
    }
  },
})

import { type Ref } from 'vue'
import type { TreeNodeData } from '../types'

interface UseTreeKeyboardOptions {
  flatNodes: Ref<TreeNodeData[]>
  expandedKeys: Ref<Set<string | number>>
  selectedKey: Ref<string | number | null>
  editingNodeId: Ref<string | number | null>
  visibleNodeIds: Ref<Set<string | number> | null>
  onSelect: (id: string | number) => void
  onToggleExpand: (id: string | number) => void
  onStartEditing: (id: string | number) => void
  onCancelEditing: () => void
}

function getVisibleFlatList(
  nodes: TreeNodeData[],
  expandedKeys: Set<string | number>,
  visibleNodeIds: Set<string | number> | null,
): TreeNodeData[] {
  const result: TreeNodeData[] = []
  const walk = (items: TreeNodeData[]): void => {
    for (const n of items) {
      if (visibleNodeIds && !visibleNodeIds.has(n.id)) continue
      result.push(n)
      if (n.children?.length && expandedKeys.has(n.id)) {
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return result
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTreeKeyboard(options: UseTreeKeyboardOptions) {
  function findRootNodes(): TreeNodeData[] {
    return options.flatNodes.value.filter((n) => n.parentId === null)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (options.editingNodeId.value !== null) {
      if (event.key === 'Escape') {
        event.preventDefault()
        options.onCancelEditing()
      }
      return
    }

    const { key } = event
    const visibleList = getVisibleFlatList(
      findRootNodes(),
      options.expandedKeys.value,
      options.visibleNodeIds.value,
    )

    if (visibleList.length === 0) return

    const currentIndex = options.selectedKey.value !== null
      ? visibleList.findIndex((n) => n.id === options.selectedKey.value)
      : -1

    switch (key) {
      case 'ArrowDown': {
        event.preventDefault()
        const next = currentIndex < visibleList.length - 1 ? currentIndex + 1 : 0
        options.onSelect(visibleList[next].id)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        const prev = currentIndex > 0 ? currentIndex - 1 : visibleList.length - 1
        options.onSelect(visibleList[prev].id)
        break
      }
      case 'ArrowRight': {
        event.preventDefault()
        if (currentIndex >= 0) {
          const node = visibleList[currentIndex]
          if (node.children?.length && !options.expandedKeys.value.has(node.id)) {
            options.onToggleExpand(node.id)
          } else if (node.children?.length) {
            const firstChild = visibleList[currentIndex + 1]
            if (firstChild) options.onSelect(firstChild.id)
          }
        }
        break
      }
      case 'ArrowLeft': {
        event.preventDefault()
        if (currentIndex >= 0) {
          const node = visibleList[currentIndex]
          if (options.expandedKeys.value.has(node.id)) {
            options.onToggleExpand(node.id)
          } else if (node.parentId !== null) {
            options.onSelect(node.parentId)
          }
        }
        break
      }
      case 'Enter': {
        event.preventDefault()
        if (currentIndex >= 0) {
          const node = visibleList[currentIndex]
          options.onToggleExpand(node.id)
        }
        break
      }
      case 'F2': {
        event.preventDefault()
        if (currentIndex >= 0) {
          options.onStartEditing(visibleList[currentIndex].id)
        }
        break
      }
      case 'Home': {
        event.preventDefault()
        if (visibleList.length > 0) options.onSelect(visibleList[0].id)
        break
      }
      case 'End': {
        event.preventDefault()
        if (visibleList.length > 0) options.onSelect(visibleList[visibleList.length - 1].id)
        break
      }
    }
  }

  return { handleKeyDown }
}

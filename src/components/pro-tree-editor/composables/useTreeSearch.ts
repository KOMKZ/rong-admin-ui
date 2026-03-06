import { ref, computed, type Ref } from 'vue'
import type { TreeNodeData } from '../types'

interface UseTreeSearchOptions {
  treeData: Ref<TreeNodeData[]>
  expandedKeys: Ref<Set<string | number>>
}

function collectAncestorIds(
  nodes: TreeNodeData[],
  matchIds: Set<string | number>,
): Set<string | number> {
  const ancestorIds = new Set<string | number>()

  const walk = (items: TreeNodeData[], parentChain: (string | number)[]): void => {
    for (const node of items) {
      const chain = [...parentChain, node.id]
      if (matchIds.has(node.id)) {
        for (const pid of parentChain) ancestorIds.add(pid)
      }
      if (node.children) walk(node.children, chain)
    }
  }

  walk(nodes, [])
  return ancestorIds
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTreeSearch(options: UseTreeSearchOptions) {
  const keyword = ref('')
  const previousExpandedKeys = ref<Set<string | number> | null>(null)

  const matchedNodeIds = computed<Set<string | number>>(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return new Set()
    const ids = new Set<string | number>()
    const walk = (nodes: TreeNodeData[]): void => {
      for (const node of nodes) {
        if (node.label.toLowerCase().includes(kw)) ids.add(node.id)
        if (node.children) walk(node.children)
      }
    }
    walk(options.treeData.value)
    return ids
  })

  const visibleNodeIds = computed<Set<string | number> | null>(() => {
    if (!keyword.value.trim()) return null
    const matched = matchedNodeIds.value
    if (matched.size === 0) return new Set()
    const ancestors = collectAncestorIds(options.treeData.value, matched)
    return new Set([...matched, ...ancestors])
  })

  function setKeyword(kw: string): void {
    if (kw && !keyword.value) {
      previousExpandedKeys.value = new Set(options.expandedKeys.value)
    }
    keyword.value = kw

    if (kw.trim()) {
      const visible = visibleNodeIds.value
      if (visible) {
        for (const id of visible) {
          if (!matchedNodeIds.value.has(id)) {
            options.expandedKeys.value.add(id)
          }
        }
      }
    } else if (previousExpandedKeys.value) {
      options.expandedKeys.value = previousExpandedKeys.value
      previousExpandedKeys.value = null
    }
  }

  function isNodeVisible(nodeId: string | number): boolean {
    const visible = visibleNodeIds.value
    if (visible === null) return true
    return visible.has(nodeId)
  }

  function isMatch(nodeId: string | number): boolean {
    return matchedNodeIds.value.has(nodeId)
  }

  function getHighlightRanges(
    text: string,
  ): Array<{ start: number; end: number }> {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return []
    const ranges: Array<{ start: number; end: number }> = []
    const lower = text.toLowerCase()
    let pos = 0
    while (pos < lower.length) {
      const idx = lower.indexOf(kw, pos)
      if (idx < 0) break
      ranges.push({ start: idx, end: idx + kw.length })
      pos = idx + kw.length
    }
    return ranges
  }

  return {
    keyword,
    matchedNodeIds,
    visibleNodeIds,
    setKeyword,
    isNodeVisible,
    isMatch,
    getHighlightRanges,
  }
}
